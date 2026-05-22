from langchain_core.tools import tool
from datetime import datetime
from typing import Optional
import requests
import re
import os

@tool
def search_eventbrite_events(
    location: str,
    query: str,
    date: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[int] = 5
) -> str:
    """
    Search for kids and family events using the Eventbrite API.
    Returns community events, workshops, classes and local activities with details and links.
    Use this tool to find smaller local events, workshops and classes that may not appear
    on Ticketmaster — things like craft workshops, coding classes, sports sessions,
    family fun days and community events.
    Always use this tool alongside Ticketmaster for comprehensive event coverage.
    Accepts optional coordinates for radius-based searching — more accurate than city name alone.
    """
    api_key = os.getenv("EVENTBRITE_API_KEY")

    is_today = date.startswith('today')

    try:
        # Build base params
        # We append "kids family children" to bias results towards family content
        params = {
            "q": f"{query} kids family children",
            "categories": "1",
            "expand": "venue",
            "sort_by": "date",
        }

        # Use lat/lng radius search if coordinates are available
        # This is more accurate than city name alone especially for postcode searches
        if latitude is not None and longitude is not None:
            params["location.latitude"] = str(latitude)
            params["location.longitude"] = str(longitude)
            params["location.within"] = f"{radius_miles or 5}mi"
        else:
            # Fall back to city name search
            params["location.address"] = location
            params["location.within"] = "20km"

        # Set date range params
        if is_today:
            params["start_date.keyword"] = "today"
        else:
            date_pattern = r'(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})'
            matches = re.findall(date_pattern, date)

            if matches:
                try:
                    first_date = datetime.strptime(
                        f"{matches[0][0]} {matches[0][1]} {matches[0][2]}",
                        "%d %B %Y"
                    )
                    params["start_date.range_start"] = first_date.strftime("%Y-%m-%dT00:00:00Z")

                    if len(matches) > 1:
                        last_date = datetime.strptime(
                            f"{matches[-1][0]} {matches[-1][1]} {matches[-1][2]}",
                            "%d %B %Y"
                        )
                        params["start_date.range_end"] = last_date.strftime("%Y-%m-%dT23:59:59Z")

                except ValueError:
                    params["start_date.keyword"] = "today"
            else:
                params["start_date.keyword"] = "today"

        response = requests.get(
            "https://www.eventbriteapi.com/v3/events/search/",
            headers={"Authorization": f"Bearer {api_key}"},
            params=params,
            timeout=10
        )

        response.raise_for_status()
        data = response.json()

        if not data.get("events"):
            return f"No Eventbrite events found in {location} for {query} on the selected dates."

        results = []
        for event in data["events"][:5]:
            name = event.get("name", {}).get("text", "Unknown event")
            url = event.get("url", "No URL available")
            description = event.get("description", {}).get("text", "")

            if description and len(description) > 100:
                description = description[:100] + "..."

            venue = event.get("venue", {})
            venue_name = venue.get("name", "Venue TBC")
            venue_address = venue.get("address", {}).get("localized_address_display", "")

            start = event.get("start", {})
            event_date = start.get("local", "Date TBC")

            is_free = event.get("is_free", False)
            cost = "Free" if is_free else "Paid (see website for prices)"

            results.append(
                f"- {name}\n"
                f"  Venue: {venue_name} {venue_address}\n"
                f"  Date: {event_date}\n"
                f"  Cost: {cost}\n"
                f"  Link: {url}"
            )

        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        return "Eventbrite is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        return "Could not connect to Eventbrite. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        return f"Eventbrite returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Unexpected error in search_eventbrite_events: {str(e)}")
        return "Something went wrong searching Eventbrite. Please try again."
