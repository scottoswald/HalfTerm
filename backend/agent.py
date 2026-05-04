from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
import requests
import os
from datetime import datetime

# Load environment variables from .env file before anything else runs
load_dotenv()

# ---- THE MODEL ----
# This creates our connection to Claude
# temperature=0 keeps responses consistent and factual
llm = ChatAnthropic(
    model="claude-opus-4-5",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# ---- THE TOOLS ----

@tool
def search_ticketmaster_events(location: str) -> str:
    """
    Search for kids and family events happening today at museums in London
    using the Ticketmaster API. Returns a list of real live events.
    Use this tool when the user wants to find museum activities for children.
    """
    # Get the Ticketmaster API key from environment variables
    api_key = os.getenv("TICKETMASTER_API_KEY")

    # Get today's date in the format Ticketmaster expects
    # strftime formats a date object into a string
    # %Y = four digit year, %m = month, %d = day
    today = datetime.now().strftime("%Y-%m-%d")

    # Ticketmaster requires dates in this exact format with time and timezone
    start_datetime = f"{today}T00:00:00Z"
    end_datetime = f"{today}T23:59:59Z"

    try:
        # Make the API request with a timeout
        # timeout=10 means if Ticketmaster doesn't respond in 10 seconds give up
        # Without a timeout the app could hang forever waiting for a response
        response = requests.get(
            "https://app.ticketmaster.com/discovery/v2/events.json",
            params={
                "apikey": api_key,
                "city": location,
                "countryCode": "GB",
                "classificationName": "family",
                "startDateTime": start_datetime,
                "endDateTime": end_datetime,
                "size": 5,  # Return up to 5 events
            },
            timeout=10
        )

        # raise_for_status() throws an error if the status code is 4xx or 5xx
        # For example 401 (unauthorized) or 500 (server error)
        # Without this requests would silently return even on failed requests
        response.raise_for_status()

        # Parse the JSON response into a Python dictionary
        data = response.json()

        # Check if any events were found
        # Ticketmaster wraps results in _embedded.events
        if "_embedded" not in data or "events" not in data["_embedded"]:
            return "No family events found in London today on Ticketmaster."

        events = data["_embedded"]["events"]

        # Build a readable string of events to return to the agent
        results = []
        for event in events:
            # Safely extract event details using .get()
            # .get() returns None if the key doesn't exist rather than throwing an error
            name = event.get("name", "Unknown event")
            url = event.get("url", "No URL available")

            # Venue info is nested inside _embedded.venues
            venues = event.get("_embedded", {}).get("venues", [])
            venue_name = venues[0].get("name", "Unknown venue") if venues else "Unknown venue"

            # Date info is nested inside dates.start
            date_info = event.get("dates", {}).get("start", {})
            event_date = date_info.get("localDate", "Date unknown")
            event_time = date_info.get("localTime", "Time unknown")

            results.append(
                f"- {name} at {venue_name} on {event_date} at {event_time}\n  More info: {url}"
            )

        # Join all events into one string separated by blank lines
        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        # The request took too long — Ticketmaster might be slow or down
        return "Ticketmaster is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        # No internet connection or Ticketmaster is unreachable
        return "Could not connect to Ticketmaster. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        # The API returned an error status code (4xx or 5xx)
        return f"Ticketmaster returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        # Catch any other unexpected errors
        # We print the error for debugging but return a friendly message to the user
        print(f"Unexpected error in search_ticketmaster_events: {str(e)}")
        return "Something went wrong searching for events. Please try again."


# Dictionary of UK city coordinates
# Used to bias Google Places results towards the correct city
# latitude and longitude for the city centre of each supported city
UK_CITY_COORDINATES = {
    "London":     {"latitude": 51.5074, "longitude": -0.1278},
    "Manchester": {"latitude": 53.4808, "longitude": -2.2426},
    "Birmingham": {"latitude": 52.4862, "longitude": -1.8904},
    "Leeds":      {"latitude": 53.8008, "longitude": -1.5491},
    "Edinburgh":  {"latitude": 55.9533, "longitude": -3.1883},
    "Glasgow":    {"latitude": 55.8642, "longitude": -4.2518},
    "Bristol":    {"latitude": 51.4545, "longitude": -2.5879},
    "Cardiff":    {"latitude": 51.4816, "longitude": -3.1791},
    "Liverpool":  {"latitude": 53.4084, "longitude": -2.9916},
    "Newcastle":  {"latitude": 54.9783, "longitude": -1.6178},
    "Brighton":   {"latitude": 50.8225, "longitude": -0.1372},
    "Oxford":     {"latitude": 51.7520, "longitude": -1.2577},
    "Cambridge":  {"latitude": 52.2053, "longitude": 0.1218},
    "Bath":       {"latitude": 51.3811, "longitude": -2.3590},
}

@tool
def search_google_places(query: str, location: str) -> str:
    """
    Search for family friendly venues in a UK city using the Google Places API.
    Returns details about relevant venues including address and rating.
    Use this tool to find information about specific venues or attractions.
    """
    # Get the Google Places API key from environment variables
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")

    # Look up the coordinates for the requested city
    # Falls back to London if the city isn't in our dictionary
    coords = UK_CITY_COORDINATES.get(location, UK_CITY_COORDINATES["London"])

    try:
        # Places API (New) uses POST not GET
        # X-Goog-Api-Key passes the API key in the header
        # X-Goog-FieldMask tells Google exactly which fields to return
        # Only requesting what we need keeps the response lean and fast
        response = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.websiteUri",
            },
            # textQuery is the search term
            # locationBias nudges results towards the selected city
            # without restricting results exclusively to that area
            json={
                "textQuery": f"{query} {location}",
                "locationBias": {
                    "circle": {
                        # Use the coordinates for the selected city
                        "center": coords,
                        "radius": 10000.0  # 10km radius around city centre
                    }
                }
            },
            timeout=10
        )

        # raise_for_status() throws an error if the status code is 4xx or 5xx
        response.raise_for_status()

        # Parse the JSON response into a Python dictionary
        data = response.json()

        # If no places were found return a helpful message
        if "places" not in data:
            return f"No venues found in {location}."

        # Build a readable string of venues to return to the agent
        # Limit to 3 venues to keep the response concise
        results = []
        for place in data["places"][:3]:
            # Safely extract each field using .get()
            # .get() returns the default value if the key doesn't exist
            name = place.get("displayName", {}).get("text", "Unknown")
            address = place.get("formattedAddress", "No address")
            rating = place.get("rating", "No rating")
            website = place.get("websiteUri", "No website")

            results.append(
                f"- {name}\n  Address: {address}\n  Rating: {rating}/5\n  Website: {website}"
            )

        # Join all venues into one string separated by blank lines
        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        return "Google Places is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        return "Could not connect to Google Places. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        return f"Google Places returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        # Log the full error for debugging but return a friendly message
        print(f"Unexpected error in search_google_places: {str(e)}")
        return "Something went wrong searching for venues. Please try again."


# Collect all tools into a list
tools = [search_ticketmaster_events, search_google_places]

# ---- THE AGENT ----
# create_react_agent wires together the LLM and tools
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
def run_agent(activity: str, location: str, when: str) -> str:
    # Build a detailed natural language query from all search parameters
    # The more context we give the agent, the better it can filter results
    query = f"""
    Find {activity} activities for kids in {location} {when}.
    
    Please follow these instructions carefully:
    - Search for both live events and venue information
    - Filter results to match the specified criteria in: {when}
    - For age range: only suggest activities suitable for the specified age group
    - For budget: only suggest activities within the specified cost range
    - Present results in a clear, friendly format for families
    - For each result include: name, location, cost if known, and why it's good for kids
    - If you cannot find results matching all criteria, say so clearly and suggest alternatives
    - Always include booking links or website URLs where available
    """

    # Invoke the agent with the detailed query
    result = agent_executor.invoke({"messages": [("human", query)]})

    # Return the last message which is Claude's final formatted response
    return result["messages"][-1].content