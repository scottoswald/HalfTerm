from langchain_core.tools import tool
from datetime import datetime
import requests
import os

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