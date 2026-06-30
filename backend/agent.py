from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from tools.ticketmaster import search_ticketmaster_events
from tools.google_places import search_google_places_with_photos
from tools.eventbrite import search_eventbrite_events
from tools.skiddle import search_skiddle_events
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
import os
import json
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# ---- THE MODEL ----
# Haiku — ~4x faster than Sonnet for structured formatting tasks
llm = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

keywords_list = "sibling friendly, dog friendly, accessible, parking nearby, café on site, book in advance, free cancellation, outdoor, indoor, rainy day, sunny day, drop in, booking required, gift shop, picnic area, photography allowed"

# ---- PER-CATEGORY SEARCH STRATEGY ----
# Queries are intentionally generic — no city names hardcoded.
# The location is passed separately as a parameter to each API.
CATEGORY_STRATEGY = {
    "Museums": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "family museums galleries heritage children",
        "eventbrite_query": "museum family children",
        "ticketmaster_category": None,
    },
    "Attractions": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "family attractions theme parks visitor centres rides",
        "eventbrite_query": "family attractions children",
        "ticketmaster_category": None,
    },
    "Outdoors": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": True,
        # Added "gardens" and "children" — surfaces bigger parks alongside nature reserves
        "google_query": "parks gardens nature reserves family outdoor walks children",
        "eventbrite_query": "outdoor family nature walk children",
        "ticketmaster_category": None,
    },
    "Sports": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "sports centres leisure centres stadiums family activities",
        "eventbrite_query": "sports family children activities",
        "ticketmaster_category": "Sports",
    },
    "Theatre and Shows": {
        # Google Places now enabled — search for children's theatres specifically
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": True,
        "google_query": "children's theatre family theatre kids shows performances",
        "eventbrite_query": "theatre show performance family children",
        "ticketmaster_category": "Theatre and Shows",
    },
    "Arts and Crafts": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": True,
        "google_query": "arts crafts studios pottery painting family workshops children",
        "eventbrite_query": "arts crafts workshop family children",
        "ticketmaster_category": None,
    },
    "Science and Technology": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        # Tightened to reduce overlap with Museums and Learning
        "google_query": "science centres planetarium interactive technology coding robotics family children",
        "eventbrite_query": "science technology workshop family children",
        "ticketmaster_category": None,
    },
    "Animals": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "zoos farms aquariums wildlife parks family animals children",
        "eventbrite_query": "animals wildlife family children",
        "ticketmaster_category": None,
    },
    "Play and Explore": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "soft play playgrounds indoor play centres trampolines family children",
        "eventbrite_query": "play family children activities",
        "ticketmaster_category": None,
    },
    "Thrills and Challenges": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": False,
        "google_query": "go karting climbing walls escape rooms laser tag family",
        "eventbrite_query": "adventure challenge family children",
        "ticketmaster_category": None,
    },
    "Fairs and Festivals": {
        # Ticketmaster disabled — returns adult music festivals not family fairs
        # Skiddle and Eventbrite better for this category
        "use_google_places": False,
        "use_ticketmaster": False,
        "use_eventbrite": True,
        "use_skiddle": True,
        "google_query": "",
        "eventbrite_query": "family fair festival summer fete children",
        "ticketmaster_category": None,
    },
    "Swimming": {
        "use_google_places": True,
        "use_ticketmaster": False,
        "use_eventbrite": False,
        "use_skiddle": False,
        # Balanced indoor/outdoor — previously only returning lidos
        "google_query": "swimming pools indoor pools leisure centres lidos water parks family children",
        "eventbrite_query": "swimming family children",
        "ticketmaster_category": None,
    },
    "Music": {
        # Ticketmaster returns adult concerts — disabled until better filtering available
        # Skiddle LIVE code also returns adult gigs
        "use_google_places": False,
        "use_ticketmaster": False,
        "use_eventbrite": True,
        "use_skiddle": True,
        "google_query": "",
        "eventbrite_query": "children's music concert singalong family music workshop",
        "ticketmaster_category": None,
    },
    "Gaming": {
        "use_google_places": True,
        "use_ticketmaster": False,
        "use_eventbrite": False,
        "use_skiddle": False,
        "google_query": "arcades VR gaming centres board game cafes family entertainment",
        "eventbrite_query": "gaming family children",
        "ticketmaster_category": None,
    },
    "Learning": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "use_skiddle": True,
        # Tightened to reduce overlap with Museums
        "google_query": "discovery centres educational workshops learning family children",
        "eventbrite_query": "learning workshop educational family children",
        "ticketmaster_category": None,
    },
    "Community": {
        "use_google_places": False,
        "use_ticketmaster": False,
        "use_eventbrite": True,
        "use_skiddle": True,
        "google_query": "",
        "eventbrite_query": "community family children activities local",
        "ticketmaster_category": None,
    },
}

def get_strategy(activities: list[str]) -> dict:
    if not activities:
        return {
            "use_google_places": True,
            "use_ticketmaster": True,
            "use_eventbrite": True,
            "use_skiddle": True,
            "google_query": "family activities children",
            "eventbrite_query": "family activities children",
            "ticketmaster_category": None,
        }

    use_google = False
    use_ticketmaster = False
    use_eventbrite = False
    use_skiddle = False
    google_queries = []
    eventbrite_queries = []
    ticketmaster_category = None

    for activity in activities:
        strategy = CATEGORY_STRATEGY.get(activity)
        if strategy:
            if strategy["use_google_places"]:
                use_google = True
                if strategy["google_query"]:
                    google_queries.append(strategy["google_query"])
            if strategy["use_ticketmaster"]:
                use_ticketmaster = True
                if strategy["ticketmaster_category"] and not ticketmaster_category:
                    ticketmaster_category = strategy["ticketmaster_category"]
            if strategy["use_eventbrite"]:
                use_eventbrite = True
                if strategy["eventbrite_query"]:
                    eventbrite_queries.append(strategy["eventbrite_query"])
            if strategy["use_skiddle"]:
                use_skiddle = True
        else:
            use_google = True
            use_ticketmaster = True
            use_eventbrite = True
            use_skiddle = True
            google_queries.append(f"{activity} family children")
            eventbrite_queries.append(f"{activity} family children")

    return {
        "use_google_places": use_google,
        "use_ticketmaster": use_ticketmaster,
        "use_eventbrite": use_eventbrite,
        "use_skiddle": use_skiddle,
        "google_query": google_queries[0] if google_queries else "family activities children",
        "eventbrite_query": eventbrite_queries[0] if eventbrite_queries else "family activities children",
        "ticketmaster_category": ticketmaster_category,
    }


def parse_response(response_text: str, activities_str: str, location: str) -> dict:
    """Parse Claude's JSON response, stripping any markdown fences."""
    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude JSON: {str(e)}")
        return {
            "search_summary": f"{activities_str} in {location}",
            "search_extended": False,
            "search_extended_message": None,
            "events": [],
            "venues": [],
            "error": "Sorry, something went wrong. Please try again."
        }


def inject_venue_photos(venues: list, photo_urls: dict[str, str]) -> list:
    """
    Inject photo URLs into venue results after Claude has formatted them.
    Claude sets image_url to null — we match by venue name and inject here.
    This saves ~400 output tokens per search, speeding up Claude significantly.
    """
    for venue in venues:
        name = venue.get("name", "")
        if name in photo_urls:
            venue["image_url"] = photo_urls[name]
        elif venue.get("image_url") is None:
            for photo_name, url in photo_urls.items():
                if photo_name.lower() in name.lower() or name.lower() in photo_name.lower():
                    venue["image_url"] = url
                    break
    return venues


# ---- VENUES SEARCH ----
def run_venues_search(
    activities: list[str],
    location: str,
    date: str,
    age_range: str,
    cost_range: str,
    vibes: list[str] = [],
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: int = 5,
    free_text: Optional[str] = None
) -> dict:
    activities_str = ", ".join(activities) if activities else "family activities"
    strategy = get_strategy(activities)

    if not strategy["use_google_places"]:
        logger.info(f"Skipping Google Places for categories: {activities_str}")
        return {
            "search_summary": f"{activities_str} in {location}",
            "search_extended": False,
            "search_extended_message": None,
            "events": [],
            "venues": []
        }

    google_query = strategy["google_query"] or activities_str

    try:
        google_data, photo_urls = search_google_places_with_photos(
            query=google_query,
            location=location,
            latitude=latitude,
            longitude=longitude,
            radius_miles=radius_miles
        )
    except Exception as e:
        logger.error(f"Google Places error: {str(e)}")
        google_data = "No results found."
        photo_urls = {}

    vibes_str = f"\nPrioritise results that are: {', '.join(vibes)}" if vibes else ""
    free_text_str = f"\nUser also searched for: \"{free_text}\"" if free_text and free_text.strip() else ""

    if latitude is not None and longitude is not None:
        radius_str = f"""
  RADIUS: User is at ({latitude:.4f}, {longitude:.4f}) and requested results within {radius_miles} miles.
  - ONLY set search_extended=true if you are including results MORE than {radius_miles} miles away
  - If ALL results are within {radius_miles} miles, set search_extended=false and search_extended_message=null
  - Do NOT set search_extended=true just because fewer results were found than expected"""
    else:
        radius_str = ""

    prompt = f"""Format this Google Places data into JSON for a family activities finder.

Search: {activities_str} in {location}, {date}, ages {age_range}, budget {cost_range}{vibes_str}{free_text_str}{radius_str}

GOOGLE PLACES DATA:
{google_data}

STRICT RULES:
1. VENUE = permanent place families visit year-round: museum, park, zoo, aquarium, gallery, theatre building, science centre, soft play, theme park. Even ticketed permanent attractions are VENUES not events.
2. Only include venues genuinely matching: {activities_str}
3. Only use results from the data above — never add from your own knowledge
4. Return max 8 venues
5. cost: NEVER use null — use "Free", "From £X", or "Paid — check website"
6. directions_url: https://www.google.com/maps/dir/?api=1&destination=ADDRESS_URL_ENCODED
7. Keywords only from: {keywords_list}
8. image_url: always set to null (photos are added separately)
9. opening_times: use Opening hours from the Google Places data. Only use 'Check website for hours' if no opening hours were provided.

Return ONLY valid JSON:
{{
  "search_summary": "{activities_str} in {location}, {date}, Ages {age_range}, {cost_range}",
  "search_extended": false,
  "search_extended_message": null,
  "events": [],
  "venues": [
    {{
      "type": "venue",
      "name": "name",
      "image_url": null,
      "location": "full address",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "opening_times": "use Opening hours from data or Check website for hours",
      "age_range": "All ages",
      "cost": "Free",
      "is_free": true,
      "rating": 4.5,
      "keywords": ["indoor"],
      "description": "one sentence",
      "expanded_description": "2 sentences with practical family details",
      "website_url": "url or null",
      "directions_url": "https://www.google.com/maps/dir/?api=1&destination=ADDRESS"
    }}
  ]
}}"""

    response = llm.invoke(prompt)
    result = parse_response(response.content, activities_str, location)

    if result.get("venues"):
        result["venues"] = inject_venue_photos(result["venues"], photo_urls)

    return result


# ---- EVENTS SEARCH ----
# Calls Ticketmaster, Eventbrite and Skiddle based on category strategy
def run_events_search(
    activities: list[str],
    location: str,
    date: str,
    age_range: str,
    cost_range: str,
    vibes: list[str] = [],
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: int = 5,
    free_text: Optional[str] = None
) -> dict:
    activities_str = ", ".join(activities) if activities else "family activities"
    strategy = get_strategy(activities)

    def call_ticketmaster():
        if not strategy["use_ticketmaster"]:
            return "Ticketmaster not used for this category."
        try:
            return search_ticketmaster_events.invoke({
                "location": location,
                "date": date,
                "latitude": latitude,
                "longitude": longitude,
                "radius_miles": radius_miles,
                "category": strategy["ticketmaster_category"],
            })
        except Exception as e:
            return f"Ticketmaster failed: {str(e)}"

    def call_eventbrite():
        if not strategy["use_eventbrite"]:
            return "Eventbrite not used for this category."
        try:
            eventbrite_query = strategy.get("eventbrite_query", activities_str)
            return search_eventbrite_events.invoke({
                "location": location,
                "query": eventbrite_query,
                "date": date,
                "latitude": latitude,
                "longitude": longitude,
                "radius_miles": radius_miles
            })
        except Exception as e:
            return f"Eventbrite failed: {str(e)}"

    def call_skiddle():
        if not strategy["use_skiddle"]:
            return "Skiddle not used for this category."
        try:
            return search_skiddle_events.invoke({
                "query": activities_str,
                "location": location,
                "date": date,
                "latitude": latitude,
                "longitude": longitude,
                "radius_miles": radius_miles,
                "category": activities[0] if activities else None,
            })
        except Exception as e:
            return f"Skiddle failed: {str(e)}"

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_tm = executor.submit(call_ticketmaster)
        future_eb = executor.submit(call_eventbrite)
        future_sk = executor.submit(call_skiddle)
        ticketmaster_data = future_tm.result()
        eventbrite_data = future_eb.result()
        skiddle_data = future_sk.result()

    vibes_str = f"\nPrioritise results that are: {', '.join(vibes)}" if vibes else ""
    free_text_str = f"\nUser also searched for: \"{free_text}\"" if free_text and free_text.strip() else ""

    if latitude is not None and longitude is not None:
        radius_str = f"""
  RADIUS: User is at ({latitude:.4f}, {longitude:.4f}) and requested results within {radius_miles} miles.
  - ONLY set search_extended=true if you are including results MORE than {radius_miles} miles away
  - If ALL results are within {radius_miles} miles, set search_extended=false and search_extended_message=null
  - Do NOT set search_extended=true just because fewer results were found than expected"""
    else:
        radius_str = ""

    prompt = f"""Format this events data into JSON for a family activities finder.

Search: {activities_str} in {location}, {date}, ages {age_range}, budget {cost_range}{vibes_str}{free_text_str}{radius_str}

TICKETMASTER DATA:
{ticketmaster_data}

EVENTBRITE DATA:
{eventbrite_data}

SKIDDLE DATA:
{skiddle_data}

STRICT RULES:
1. EVENT = time-specific and temporary: workshop, show, performance, class, community day. Has a specific date/time.
2. Do NOT include permanent attractions — those are venues not events.
3. Only include events genuinely matching: {activities_str}
4. Only use results from the API data above — never add from your own knowledge
5. Return max 8 events
6. cost: NEVER use null — use "Free", "From £X", or "Paid — check website"
7. directions_url: https://www.google.com/maps/dir/?api=1&destination=ADDRESS_URL_ENCODED
8. Keywords only from: {keywords_list}
9. image_url: use the Photo URL from the data if present, otherwise null
10. If the same show appears multiple times on different dates, only include it ONCE — pick the earliest upcoming date.
11. Only include events genuinely suitable for families with children.
    - Music: ONLY include children's concerts, singalong shows, family music events. REJECT adult gigs, rock concerts, club nights.
    - Fairs and Festivals: ONLY include family fairs, summer fetes, children's festivals. REJECT adult music festivals.
    - Theatre: Prioritise shows specifically marketed for children. West End shows acceptable if family-friendly.
    - All categories: reject adult comedy, adult nightlife, events clearly aimed at adults only.

Return ONLY valid JSON:
{{
  "search_summary": "{activities_str} in {location}, {date}, Ages {age_range}, {cost_range}",
  "search_extended": false,
  "search_extended_message": null,
  "venues": [],
  "events": [
    {{
      "type": "event",
      "name": "name",
      "image_url": "Photo URL from data or null",
      "location": "full address",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "date": "formatted date",
      "time": "10:00 AM",
      "age_range": "All ages",
      "cost": "From £18",
      "is_free": false,
      "rating": null,
      "keywords": ["indoor"],
      "description": "one sentence",
      "expanded_description": "2 sentences with practical family details",
      "booking_url": "url or null",
      "directions_url": "https://www.google.com/maps/dir/?api=1&destination=ADDRESS"
    }}
  ]
}}"""

    response = llm.invoke(prompt)
    return parse_response(response.content, activities_str, location)


# ---- LEGACY COMBINED SEARCH ----
def run_agent(
    activities: list[str],
    location: str,
    date: str,
    age_range: str,
    cost_range: str,
    vibes: list[str] = [],
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: int = 5,
    free_text: Optional[str] = None
) -> dict:
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_venues = executor.submit(
            run_venues_search, activities, location, date, age_range,
            cost_range, vibes, latitude, longitude, radius_miles, free_text
        )
        future_events = executor.submit(
            run_events_search, activities, location, date, age_range,
            cost_range, vibes, latitude, longitude, radius_miles, free_text
        )
        venues_result = future_venues.result()
        events_result = future_events.result()

    return {
        "search_summary": venues_result.get("search_summary", f"{', '.join(activities)} in {location}"),
        "search_extended": venues_result.get("search_extended", False) or events_result.get("search_extended", False),
        "search_extended_message": venues_result.get("search_extended_message") or events_result.get("search_extended_message"),
        "venues": venues_result.get("venues", []),
        "events": events_result.get("events", []),
    }
