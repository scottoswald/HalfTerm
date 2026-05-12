from langchain_core.tools import tool
from datetime import datetime, timedelta
import requests
import os
import re

def parse_date_range(date_str: str) -> tuple[str, str]:
    """
    Parse a date string from the agent into Ticketmaster API date range format.
    
    The agent receives resolved dates like:
    - 'today (Tuesday 12th May 2026)'
    - 'this weekend (Saturday 16th May and Sunday 17th May 2026)'
    - 'next week (Monday 18th May to Sunday 24th May 2026)'
    
    Returns a tuple of (start_datetime, end_datetime) in Ticketmaster format.
    """
    today = datetime.now()

    # Try to extract dates from the resolved date string
    # Look for patterns like "12th May 2026" or "16th May"
    date_pattern = r'(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})'
    matches = re.findall(date_pattern, date_str)

    if matches:
        try:
            # Parse the first date found
            first_date = datetime.strptime(
                f"{matches[0][0]} {matches[0][1]} {matches[0][2]}", 
                "%d %B %Y"
            )
            # If there's a second date use it as the end, otherwise end of first day
            if len(matches) > 1:
                last_date = datetime.strptime(
                    f"{matches[-1][0]} {matches[-1][1]} {matches[-1][2]}", 
                    "%d %B %Y"
                )
            else:
                last_date = first_date

            # Format as Ticketmaster expects — start of first day to end of last day
            start_datetime = first_date.strftime("%Y-%m-%dT00:00:00Z")
            end_datetime = last_date.strftime("%Y-%m-%dT23:59:59Z")
            return start_datetime, end_datetime

        except ValueError:
            pass

    # Fallback to today if we can't parse the date
    today_str = today.strftime("%Y-%m-%d")
    return f"{today_str}T00:00:00Z", f"{today_str}T23:59:59Z"


@tool
def search_ticketmaster_events(location: str, date: str) -> str:
    """
    Search for kids and family events using the Ticketmaster API.
    Returns a list of live events with venue, date, time and booking links.
    Use this tool to find ticketed events and attractions happening on the specified dates.
    Works for any UK city and any type of family activity.
    Always use this tool when searching for live events, shows, attractions or activities.
    """
    # Get the Ticketmaster API key from environment variables
    api_key = os.getenv("TICKETMASTER_API_KEY")

    # Parse the date string into Ticketmaster's required format
    # The date comes pre-resolved e.g. "this weekend (Saturday 16th May and Sunday 17th May 2026)"
    start_datetime, end_datetime = parse_date_range(date)

    try:
        # Make the API request with a timeout
        # timeout=10 means if Ticketmaster doesn't respond in 10 seconds give up
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
        response.raise_for_status()

        # Parse the JSON response into a Python dictionary
        data = response.json()

        # Check if any events were found
        if "_embedded" not in data or "events" not in data["_embedded"]:
            return f"No family events found in {location} for the selected dates on Ticketmaster."

        events = data["_embedded"]["events"]

        # Build a readable string of events to return to the agent
        results = []
        for event in events:
            # Safely extract event details using .get()
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
        return "Ticketmaster is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        return "Could not connect to Ticketmaster. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        return f"Ticketmaster returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        # Log the full error for debugging but return a friendly message
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error in search_ticketmaster_events: {str(e)}")
        return "Something went wrong searching for events. Please try again."