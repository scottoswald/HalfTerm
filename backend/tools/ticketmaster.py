from langchain_core.tools import tool
from datetime import datetime
from typing import Optional
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
    date_pattern = r'(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})'
    matches = re.findall(date_pattern, date_str)

    if matches:
        try:
            first_date = datetime.strptime(
                f"{matches[0][0]} {matches[0][1]} {matches[0][2]}", "%d %B %Y"
            )
            last_date = datetime.strptime(
                f"{matches[-1][0]} {matches[-1][1]} {matches[-1][2]}", "%d %B %Y"
            ) if len(matches) > 1 else first_date

            return (
                first_date.strftime("%Y-%m-%dT00:00:00Z"),
                last_date.strftime("%Y-%m-%dT23:59:59Z")
            )
        except ValueError:
            pass

    today_str = today.strftime("%Y-%m-%d")
    return f"{today_str}T00:00:00Z", f"{today_str}T23:59:59Z"


@tool
def search_ticketmaster_events(
    location: str,
    date: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[int] = 5
) -> str:
    """
    Search for kids and family events using the Ticketmaster API.
    Returns a list of live events with venue, date, time, booking links and image URLs.
    Use this tool to find ticketed events and attractions happening on the specified dates.
    Works for any UK city and any type of family activity.
    Always use this tool when searching for live events, shows, attractions or activities.
    Accepts optional coordinates for radius-based searching.
    """
    api_key = os.getenv("TICKETMASTER_API_KEY")
    start_datetime, end_datetime = parse_date_range(date)

    try:
        params = {
            "apikey": api_key,
            "countryCode": "GB",
            "classificationName": "family",
            "startDateTime": start_datetime,
            "endDateTime": end_datetime,
            "size": 5,
        }

        if latitude is not None and longitude is not None:
            params["latlong"] = f"{latitude},{longitude}"
            params["radius"] = str(radius_miles or 5)
            params["unit"] = "miles"
        else:
            params["city"] = location

        response = requests.get(
            "https://app.ticketmaster.com/discovery/v2/events.json",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        if "_embedded" not in data or "events" not in data["_embedded"]:
            return f"No family events found in {location} for the selected dates on Ticketmaster."

        results = []
        for event in data["_embedded"]["events"]:
            name = event.get("name", "Unknown event")
            url = event.get("url", "No URL available")

            venues = event.get("_embedded", {}).get("venues", [])
            venue_name = venues[0].get("name", "Unknown venue") if venues else "Unknown venue"

            date_info = event.get("dates", {}).get("start", {})
            event_date = date_info.get("localDate", "Date unknown")
            event_time = date_info.get("localTime", "Time unknown")

            # Extract the best available image from Ticketmaster
            # Ticketmaster returns multiple image sizes — we prefer 16:9 ratio at medium size
            image_url = "No photo"
            images = event.get("images", [])
            if images:
                # Try to find a 16:9 ratio image first, fall back to first available
                preferred = [img for img in images if img.get("ratio") == "16_9" and img.get("width", 0) >= 640]
                chosen = preferred[0] if preferred else images[0]
                image_url = chosen.get("url", "No photo")

            results.append(
                f"- {name} at {venue_name} on {event_date} at {event_time}\n"
                f"  More info: {url}\n"
                f"  Photo: {image_url}"
            )

        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        return "Ticketmaster is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        return "Could not connect to Ticketmaster. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        return f"Ticketmaster returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Unexpected error in search_ticketmaster_events: {str(e)}")
        return "Something went wrong searching for events. Please try again."
