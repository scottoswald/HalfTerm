from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from tools.ticketmaster import search_ticketmaster_events
from tools.google_places import search_google_places_with_photos
from tools.eventbrite import search_eventbrite_events
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
# Each category has:
# - use_google_places: whether to search Google Places for venues
# - use_ticketmaster: whether to search Ticketmaster for events
# - use_eventbrite: whether to search Eventbrite for events
# - google_query: tailored query for Google Places (more specific than raw category)
# - eventbrite_query: tailored query for Eventbrite
# - ticketmaster_category: passed to Ticketmaster for classification-based filtering

CATEGORY_STRATEGY = {
    "Museums": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "family museums galleries heritage children",
        "eventbrite_query": "museum family children",
        "ticketmaster_category": None,
    },
    "Attractions": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "family attractions theme parks visitor centres rides",
        "eventbrite_query": "family attractions children",
        "ticketmaster_category": None,
    },
    "Outdoors": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        # Specific query prevents returning outdoor equipment shops
        "google_query": "parks nature reserves gardens family outdoor walks picnic",
        "eventbrite_query": "outdoor family nature walk children",
        "ticketmaster_category": None,
    },
    "Sports": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "sports centres leisure centres stadiums family activities",
        "eventbrite_query": "sports family children activities",
        "ticketmaster_category": "Sports",
    },
    "Theatre and Shows": {
        # Skip Google Places — returns theatre buildings not shows
        # Use Arts & Theatre classification on Ticketmaster for actual productions
        "use_google_places": False,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "",
        "eventbrite_query": "theatre show performance family children",
        "ticketmaster_category": "Theatre and Shows",
    },
    "Arts and Crafts": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "arts crafts studios pottery painting family workshops children",
        "eventbrite_query": "arts crafts workshop family children",
        "ticketmaster_category": None,
    },
    "Science and Technology": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "science centres technology museums discovery family children",
        "eventbrite_query": "science technology workshop family children",
        "ticketmaster_category": None,
    },
    "Animals": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "zoos farms aquariums wildlife parks family animals children",
        "eventbrite_query": "animals wildlife family children",
        "ticketmaster_category": None,
    },
    "Play and Explore": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "soft play playgrounds indoor play centres trampolines family children",
        "eventbrite_query": "play family children activities",
        "ticketmaster_category": None,
    },
    "Thrills and Challenges": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "go karting climbing walls escape rooms laser tag family",
        "eventbrite_query": "adventure challenge family children",
        "ticketmaster_category": None,
    },
    "Fairs and Festivals": {
        # Skip Google Places — fairs and festivals are events not permanent venues
        "use_google_places": False,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "",
        "eventbrite_query": "fair festival family children",
        "ticketmaster_category": "Fairs and Festivals",
    },
    "Swimming": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "swimming pools lidos water parks family children",
        "eventbrite_query": "swimming family children",
        "ticketmaster_category": None,
    },
    "Music": {
        # Skip Google Places — returns concert halls not actual concerts
        "use_google_places": False,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "",
        "eventbrite_query": "music concert family children",
        "ticketmaster_category": "Music",
    },
    "Gaming": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "arcades VR gaming centres board game cafes family entertainment",
        "eventbrite_query": "gaming family children",
        "ticketmaster_category": None,
    },
    "Learning": {
        "use_google_places": True,
        "use_ticketmaster": True,
        "use_eventbrite": True,
        "google_query": "discovery centres educational museums learning family children",
        "eventbrite_query": "learning workshop educational family children",
        "ticketmaster_category": None,
    },
    "Community": {
        # Skip Google Places and Ticketmaster — community events are hyper-local
        # Eventbrite is the best source for grassroots community events
        "use_google_places": False,
        "use_ticketmaster": False,
        "use_eventbrite": True,
        "google_query": "",
        "eventbrite_query": "community family children activities local",
        "ticketmaster_category": None,
    },
}

def get_strategy(activities: list[str]) -> dict:
    """
    Get the combined search strategy for a list of activities.
    If multiple activities are selected, we union the strategies.
    """
    if not activities:
        return {
            "use_google_places": True,
            "use_ticketmaster": True,
            "use_eventbrite": True,
            "google_query": "family activities children",
            "eventbrite_query": "family activities children",
            "ticketmaster_category": None,
        }

    use_google = False
    use_ticketmaster = False
    use_eventbrite = False
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
        else:
            use_google = True
            use_ticketmaster = True
            use_eventbrite = True
            google_queries.append(f"{activity} family children")
            eventbrite_queries.append(f"{activity} family children")

    return {
        "use_google_places": use_google,
        "use_ticketmaster": use_ticketmaster,
        "use_eventbrite": use_eventbrite,
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
        radius_str = f"\nPrefer results within {radius_miles} miles of ({latitude:.4f}, {longitude:.4f}). If extending, set search_extended=true with a friendly message."
    else:
        radius_str = ""

    prompt = f"""Format this Google Places data into JSON for a family activities finder.

Search: {activities_str} in {location}, {date}, ages {age_range}, budget {cost_range}{vibes_str}{free_text_str}{radius_str}

GOOGLE PLACES DATA:
{google_data}

STRICT RULES:
1. VENUE = permanent place families visit year-round: museum, park, zoo, aquarium, gallery, theatre building, science centre, soft play, theme park. Even ticketed permanent attractions (London Eye, Madame Tussauds, Sea Life) are VENUES not events.
2. Only include venues genuinely matching: {activities_str}
3. Only use results from the data above — never add from your own knowledge
4. Return max 5 venues
5. cost: NEVER use null — use "Free", "From £X", or "Paid — check website"
6. directions_url: https://www.google.com/maps/dir/?api=1&destination=ADDRESS_URL_ENCODED
7. Keywords only from: {keywords_list}
8. image_url: always set to null (photos are added separately)

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
      "opening_times": "Daily 10:00 AM - 5:00 PM",
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
            # Use tailored eventbrite query for better results
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

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_tm = executor.submit(call_ticketmaster)
        future_eb = executor.submit(call_eventbrite)
        ticketmaster_data = future_tm.result()
        eventbrite_data = future_eb.result()

    vibes_str = f"\nPrioritise results that are: {', '.join(vibes)}" if vibes else ""
    free_text_str = f"\nUser also searched for: \"{free_text}\"" if free_text and free_text.strip() else ""

    if latitude is not None and longitude is not None:
        radius_str = f"\nPrefer results within {radius_miles} miles of ({latitude:.4f}, {longitude:.4f}). If extending, set search_extended=true with a friendly message."
    else:
        radius_str = ""

    prompt = f"""Format this events data into JSON for a family activities finder.

Search: {activities_str} in {location}, {date}, ages {age_range}, budget {cost_range}{vibes_str}{free_text_str}{radius_str}

TICKETMASTER DATA:
{ticketmaster_data}

EVENTBRITE DATA:
{eventbrite_data}

STRICT RULES:
1. EVENT = time-specific and temporary: workshop, show, performance, class, community day. Has a specific date/time.
2. Do NOT include permanent attractions (London Eye, Madame Tussauds, museums) — those are venues.
3. Only include events genuinely matching: {activities_str}
4. Only use results from the data above — never add from your own knowledge
5. Return max 5 events
6. cost: NEVER use null — use "Free", "From £X", or "Paid — check website"
7. directions_url: https://www.google.com/maps/dir/?api=1&destination=ADDRESS_URL_ENCODED
8. Keywords only from: {keywords_list}
9. image_url: use the Photo URL from Ticketmaster/Eventbrite data if present, otherwise null
10. If the same show appears multiple times on different dates, only include it ONCE — pick the earliest upcoming date.
11. Only include events genuinely suitable for families with children. Reject adult comedy, adult concerts, and events with no family relevance even if Ticketmaster returns them.

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
