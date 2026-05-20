from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from tools import search_ticketmaster_events, search_google_places, search_eventbrite_events
import os
import json
import logging

logger = logging.getLogger(__name__)

# Load environment variables from .env file before anything else runs
# This ensures API keys are available when the model is initialised
load_dotenv()

# ---- THE MODEL ----
# This creates our connection to Claude
# temperature=0 keeps responses consistent and factual rather than creative
# api_key reads the Anthropic API key from the .env file
llm = ChatAnthropic(
    model="claude-opus-4-5",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# ---- THE TOOLS ----
# Tools are defined in their own files under backend/tools/
# search_ticketmaster_events — finds live ticketed events via Ticketmaster API
# search_google_places — finds permanent venues via Google Places API
# search_eventbrite_events — finds community events and workshops via Eventbrite API
# Claude reads each tool's docstring to decide when and how to use it
tools = [search_ticketmaster_events, search_google_places, search_eventbrite_events]

# ---- THE AGENT ----
# create_react_agent wires together the LLM and tools
# The agent uses the ReAct pattern — Reason, Act, Observe, repeat
# It reads the tool docstrings to decide which tools to call and when
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
# This is the public interface of the agent — the only function main.py calls
# It takes all five search parameters and builds a detailed query for Claude
def run_agent(activities: list[str], location: str, date: str, age_range: str, cost_range: str) -> dict:
    # Join activities list into a readable string
    # e.g. ["Museums", "Outdoor Activities"] becomes "Museums, Outdoor Activities"
    activities_str = ", ".join(activities) if activities else "family activities"

    # The keyword list Claude can choose from for each result
    # Keeping this fixed ensures consistency across all results
    keywords_list = "sibling friendly, dog friendly, accessible, parking nearby, café on site, book in advance, free cancellation, outdoor, indoor, rainy day, sunny day, drop in, booking required, gift shop, picnic area, photography allowed"

    # Build the query asking Claude to return structured JSON
    # We're very explicit about the format to ensure consistent parsing
    query = f"""
    Find activities for kids in {location}.

    Search criteria:
    - Activities: {activities_str}
    - Date: {date}
    - Age range: {age_range}
    - Budget: {cost_range}

    Instructions:
    - When calling search_ticketmaster_events, pass location="{location}" and date="{date}"
    - When calling search_eventbrite_events, pass location="{location}", query="{activities_str}" and date="{date}"
    - When calling search_google_places, pass query="{activities_str}" and location="{location}"
    - Only include results suitable for ages {age_range}
    - Only include results within the budget: {cost_range}
    - Return a maximum of 5 events and 5 venues

    IMPORTANT — Classification rules:
    A VENUE is a permanent place that families can visit. It exists year-round and you can
    turn up on any day. Examples: museums, zoos, aquariums, theme parks, science centres,
    art galleries, parks, theatres (the building), cinemas, soft play centres.
    This includes ticketed permanent attractions like the London Eye, Madame Tussauds,
    Sea Life Aquarium, Legoland — these are VENUES not events even though they require tickets.

    An EVENT is something happening at a specific time that is temporary or one-off.
    Examples: a workshop, a holiday programme, a specific theatre performance,
    a craft class, a science show, a seasonal activity, a community fun day.
    Events have a specific start time and usually end after a few hours or days.

    When in doubt — if it would still be there next month, it's a VENUE.
    If it's only on for a limited time, it's an EVENT.

    - For keywords, only choose from this exact list: {keywords_list}
    - For directions_url use this format: https://www.google.com/maps/dir/?api=1&destination=VENUE_ADDRESS_URL_ENCODED

    You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no text before or after.
    The JSON must follow this exact structure:

    {{
      "search_summary": "brief summary e.g. Museums in London, Tuesday 20th May 2026, Ages 8-12, Free",
      "events": [
        {{
          "type": "event",
          "name": "event name",
          "image_url": null,
          "location": "full address",
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

    # Invoke the agent with the structured query
    result = agent_executor.invoke({"messages": [("human", query)]})

    # Get Claude's response
    response_text = result["messages"][-1].content

    # Parse the JSON response
    # Claude should return pure JSON but we strip any accidental whitespace
    try:
        # Sometimes Claude wraps JSON in ```json blocks despite instructions
        # Strip those if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except json.JSONDecodeError as e:
        # If JSON parsing fails log the error and return a structured error response
        logger.error(f"Failed to parse agent JSON response: {str(e)}")
        logger.error(f"Raw response: {response_text}")
        return {
            "search_summary": f"{activities_str} in {location}",
            "events": [],
            "venues": [],
            "error": "Sorry, something went wrong formatting the results. Please try again."
        }