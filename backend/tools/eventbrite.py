from langchain_core.tools import tool
import requests
import os

@tool
def search_eventbrite_events(location: str, query: str) -> str:
    """
    Search for kids and family events using the Eventbrite API.
    Returns a list of relevant events with details and links.
    Use this tool to find additional family events beyond Ticketmaster.
    """
    # Get the Eventbrite API key from environment variables
    api_key = os.getenv("EVENTBRITE_API_KEY")

    try:
        # Eventbrite API v3 search endpoint
        # We search for family/kids events in the specified location
        response = requests.get(
            "https://www.eventbriteapi.com/v3/events/search/",
            headers={
                # Eventbrite uses Bearer token authentication
                # The token goes in the Authorization header
                "Authorization": f"Bearer {api_key}",
            },
            params={
                "q": f"{query} kids family children",  # Search query
                "location.address": location,          # City to search in
                "location.within": "20km",             # Radius around city
                "categories": "1",                     # Category 1 = Arts & Entertainment
                "expand": "venue",                     # Include venue details in response
                "sort_by": "date",                     # Sort by date — most relevant first
                "start_date.keyword": "today",         # Only show events from today onwards
            },
            timeout=10
        )

        # raise_for_status() throws an error if the status code is 4xx or 5xx
        response.raise_for_status()

        # Parse the JSON response into a Python dictionary
        data = response.json()

        # Check if any events were found
        if not data.get("events"):
            return f"No Eventbrite events found in {location} for {query}."

        # Build a readable string of events — limit to 5
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

            # Extract date information
            start = event.get("start", {})
            event_date = start.get("local", "Date TBC")

            # Extract ticket information
            is_free = event.get("is_free", False)
            cost = "Free" if is_free else "Paid (see website for prices)"

            results.append(
                f"- {name}\n"
                f"  📍 {venue_name} {venue_address}\n"
                f"  📅 {event_date}\n"
                f"  💰 {cost}\n"
                f"  🔗 {url}"
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
        print(f"Unexpected error in search_eventbrite_events: {str(e)}")
        return "Something went wrong searching Eventbrite. Please try again."