from langchain_core.tools import tool
from datetime import datetime
import requests
import re
import os

@tool
def search_eventbrite_events(location: str, query: str, date: str) -> str:
    """
    Search for kids and family events using the Eventbrite API.
    Returns community events, workshops, classes and local activities with details and links.
    Use this tool to find smaller local events, workshops and classes that may not appear
    on Ticketmaster — things like craft workshops, coding classes, sports sessions,
    family fun days and community events.
    Always use this tool alongside Ticketmaster for comprehensive event coverage.
    """
    # Get the Eventbrite API key from environment variables
    api_key = os.getenv("EVENTBRITE_API_KEY")

    # Determine if we're searching today or a future date
    # Eventbrite's start_date.keyword only supports 'today'
    # For future dates we use start_date.range_start instead
    is_today = date.startswith('today')

    try:
        # Build the base params for the Eventbrite search
        # We append "kids family children" to bias results towards family content
        params = {
            "q": f"{query} kids family children",  # Search query
            "location.address": location,           # City to search in
            "location.within": "20km",              # Radius around city centre
            "categories": "1",                      # Category 1 = Arts & Entertainment
            "expand": "venue",                      # Include venue details in response
            "sort_by": "date",                      # Sort chronologically
        }

        if is_today:
            # Eventbrite supports a 'today' keyword for same day searches
            params["start_date.keyword"] = "today"
        else:
            # For future dates extract the first date from the resolved string
            # e.g. "this weekend (Saturday 16th May 2026 and Sunday 17th May 2026)"
            # becomes start: 2026-05-16T00:00:00Z end: 2026-05-17T23:59:59Z
            date_pattern = r'(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})'
            matches = re.findall(date_pattern, date)

            if matches:
                try:
                    # Parse the first date found in the string
                    first_date = datetime.strptime(
                        f"{matches[0][0]} {matches[0][1]} {matches[0][2]}",
                        "%d %B %Y"
                    )
                    # Set the range start to the beginning of the first date
                    params["start_date.range_start"] = first_date.strftime("%Y-%m-%dT00:00:00Z")

                    # If there's a second date use it as the end of the range
                    if len(matches) > 1:
                        last_date = datetime.strptime(
                            f"{matches[-1][0]} {matches[-1][1]} {matches[-1][2]}",
                            "%d %B %Y"
                        )
                        params["start_date.range_end"] = last_date.strftime("%Y-%m-%dT23:59:59Z")

                except ValueError:
                    # If date parsing fails fall back to today
                    params["start_date.keyword"] = "today"
            else:
                # If no dates found in the string fall back to today
                params["start_date.keyword"] = "today"

        # Make the API request with a timeout
        # Eventbrite uses Bearer token authentication — the key goes in the header
        response = requests.get(
            "https://www.eventbriteapi.com/v3/events/search/",
            headers={
                "Authorization": f"Bearer {api_key}",
            },
            params=params,
            timeout=10
        )

        # raise_for_status() throws an error if the status code is 4xx or 5xx
        response.raise_for_status()

        # Parse the JSON response into a Python dictionary
        data = response.json()

        # Check if any events were found
        if not data.get("events"):
            return f"No Eventbrite events found in {location} for {query} on the selected dates."

        # Build a readable string of events — limit to 5 to keep response concise
        results = []
        for event in data["events"][:5]:
            # Safely extract event details using .get()
            name = event.get("name", {}).get("text", "Unknown event")
            url = event.get("url", "No URL available")
            description = event.get("description", {}).get("text", "")

            # Truncate description to keep response concise
            if description and len(description) > 100:
                description = description[:100] + "..."

            # Extract venue information if available
            venue = event.get("venue", {})
            venue_name = venue.get("name", "Venue TBC")
            venue_address = venue.get("address", {}).get("localized_address_display", "")

            # Extract date and time information
            start = event.get("start", {})
            event_date = start.get("local", "Date TBC")

            # Extract ticket/cost information
            is_free = event.get("is_free", False)
            cost = "Free" if is_free else "Paid (see website for prices)"

            results.append(
                f"- {name}\n"
                f"  Venue: {venue_name} {venue_address}\n"
                f"  Date: {event_date}\n"
                f"  Cost: {cost}\n"
                f"  Link: {url}"
            )

        # Join all events into one string separated by blank lines
        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        # The request took too long
        return "Eventbrite is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        # No internet connection or Eventbrite is unreachable
        return "Could not connect to Eventbrite. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        # The API returned an error status code
        # 401 means the API key is invalid or not authorised
        return f"Eventbrite returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        # Catch any other unexpected errors
        # Log for debugging but return a friendly message to the user
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error in search_eventbrite_events: {str(e)}")
        return "Something went wrong searching Eventbrite. Please try again."