from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from tools import search_ticketmaster_events, search_google_places, search_eventbrite_events
from typing import Optional
import os
import json
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# ---- THE MODEL ----
llm = ChatAnthropic(
    model="claude-opus-4-5",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# ---- THE TOOLS ----
tools = [search_ticketmaster_events, search_google_places, search_eventbrite_events]

# ---- THE AGENT ----
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
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
    activities_str = ", ".join(activities) if activities else "family activities"

    keywords_list = "sibling friendly, dog friendly, accessible, parking nearby, café on site, book in advance, free cancellation, outdoor, indoor, rainy day, sunny day, drop in, booking required, gift shop, picnic area, photography allowed"

    # Build vibes instruction
    vibes_instruction = ""
    if vibes:
        vibes_str = ", ".join(vibes)
        vibes_instruction = f"""
    - The user is also looking for experiences that are: {vibes_str}
      Prioritise results that match these experience qualities.
      If "surprise the family with something unexpected" is selected, choose something
      genuinely unexpected and different rather than the most obvious options.
      If "free and low cost" is selected, prioritise free or under £5 options even if
      the budget filter is set to "any".
    """

    # Build location instruction with radius guidance
    if latitude is not None and longitude is not None:
        location_instruction = f"""
    - Location: {location} (coordinates: {latitude:.4f}, {longitude:.4f})
    - Requested search radius: {radius_miles} miles from these coordinates
    - When calling search_ticketmaster_events, pass location="{location}", date="{date}", latitude={latitude}, longitude={longitude}, radius_miles={radius_miles}
    - When calling search_eventbrite_events, pass location="{location}", query="{activities_str}", date="{date}", latitude={latitude}, longitude={longitude}, radius_miles={radius_miles}
    - When calling search_google_places, pass query="{activities_str}", location="{location}", latitude={latitude}, longitude={longitude}, radius_miles={radius_miles}

    RADIUS RULES:
    - Strongly prefer results within {radius_miles} miles of ({latitude:.4f}, {longitude:.4f})
    - If the tools return enough results within {radius_miles} miles, only include those
    - If the tools return fewer than 2 results within {radius_miles} miles, you may include
      results from further away BUT you MUST set "search_extended" to true in your response
      and set "search_extended_message" to a friendly message explaining this e.g.
      "We couldn't find enough results within {radius_miles} miles of {location}, so we've
      included some nearby options too."
    - If all results are within the radius, set "search_extended" to false
    """
    else:
        location_instruction = f"""
    - Location: {location}
    - When calling search_ticketmaster_events, pass location="{location}" and date="{date}"
    - When calling search_eventbrite_events, pass location="{location}", query="{activities_str}" and date="{date}"
    - When calling search_google_places, pass query="{activities_str}" and location="{location}"
    """

    # Free text instruction
    free_text_instruction = ""
    if free_text and free_text.strip():
        free_text_instruction = f"""
    - The user has also typed this specific search: "{free_text}"
      Prioritise results that match this specific request.
      Handle any spelling mistakes or ambiguous terms intelligently.
      IMPORTANT: If you cannot find results that genuinely match "{free_text}", do NOT
      substitute unrelated results. Return an empty events array and explain in the
      search_summary. It is better to return fewer accurate results than many irrelevant ones.
    """

    # Category matching instruction
    category_instruction = f"""
    IMPORTANT — Category matching rules:
    The user selected these specific categories: {activities_str}
    You MUST only return results that genuinely and specifically match these categories.
    If you cannot find enough genuinely matching results, return fewer results rather than
    padding with loosely related ones. Quality over quantity.
    """

    query = f"""
    Find activities for kids.

    Search criteria:
    - Activities: {activities_str}
    - Date: {date}
    - Age range: {age_range}
    - Budget: {cost_range}
    {vibes_instruction}
    {free_text_instruction}
    {category_instruction}

    Location and tool instructions:
    {location_instruction}
    - Only include results suitable for ages {age_range}
    - Only include results within the budget: {cost_range}
    - Return a maximum of 5 events and 5 venues

    CRITICAL — Data integrity rules:
    You MUST only return results that were explicitly returned by the tools you called.
    Do NOT use your own knowledge to add venues or events that were not in the tool responses.
    If the tools return fewer than 5 results, return fewer than 5 — never pad with extra results.
    Never invent, supplement or add results from your training data.
    Every result you return must have come directly from a tool response.

    IMPORTANT — Classification rules:
    A VENUE is a permanent place that families can visit. It exists year-round.
    Examples: museums, zoos, aquariums, theme parks, science centres, art galleries,
    parks, theatres (the building), cinemas, soft play centres.
    Ticketed permanent attractions like the London Eye, Madame Tussauds, Sea Life
    Aquarium — these are VENUES not events.

    An EVENT is something happening at a specific time that is temporary or one-off.
    Examples: a workshop, a holiday programme, a specific theatre performance,
    a craft class, a science show, a seasonal activity, a community fun day.

    When in doubt — if it would still be there next month, it's a VENUE.
    If it's only on for a limited time, it's an EVENT.

    - For keywords, only choose from this exact list: {keywords_list}
    - For directions_url use: https://www.google.com/maps/dir/?api=1&destination=VENUE_ADDRESS_URL_ENCODED
    - For latitude and longitude, provide the coordinates of the venue or event location

    You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no text before or after.
    The JSON must follow this exact structure:

    {{
      "search_summary": "brief summary e.g. Museums in London, Tuesday 20th May 2026, Ages 8-12, Free",
      "search_extended": false,
      "search_extended_message": null,
      "events": [
        {{
          "type": "event",
          "name": "event name",
          "image_url": null,
          "location": "full address",
          "latitude": 51.5074,
          "longitude": -0.1278,
          "date": "formatted date",
          "time": "formatted time e.g. 10:00 AM",
          "age_range": "e.g. 3-8 or All ages",
          "cost": "e.g. From £18 or Free",
          "is_free": true or false,
          "categories": ["category1", "category2"],
          "rating": null or number e.g. 4.6,
          "keywords": ["keyword1", "keyword2"],
          "description": "one sentence description",
          "expanded_description": "full paragraph with practical details for families",
          "booking_url": "url or null",
          "directions_url": "google maps directions url"
        }}
      ],
      "venues": [
        {{
          "type": "venue",
          "name": "venue name",
          "image_url": null,
          "location": "full address",
          "latitude": 51.5074,
          "longitude": -0.1278,
          "opening_times": "e.g. Daily 10:00 AM - 5:50 PM",
          "age_range": "e.g. All ages",
          "cost": "e.g. Free or From £10",
          "is_free": true or false,
          "categories": ["category1", "category2"],
          "rating": null or number e.g. 4.6,
          "keywords": ["keyword1", "keyword2"],
          "description": "one sentence description",
          "expanded_description": "full paragraph with practical details for families",
          "website_url": "url or null",
          "directions_url": "google maps directions url"
        }}
      ]
    }}
    """

    result = agent_executor.invoke({"messages": [("human", query)]})
    response_text = result["messages"][-1].content

    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse agent JSON response: {str(e)}")
        logger.error(f"Raw response: {response_text}")
        return {
            "search_summary": f"{activities_str} in {location}",
            "search_extended": False,
            "search_extended_message": None,
            "events": [],
            "venues": [],
            "error": "Sorry, something went wrong formatting the results. Please try again."
        }
