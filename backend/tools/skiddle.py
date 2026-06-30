import logging
import requests
import os
import re
from datetime import datetime
from langchain_core.tools import tool
from typing import Optional

logger = logging.getLogger(__name__)

# Skiddle event codes for family-relevant categories
# KIDS = Kids/Family Event, EXHIB = Exhibitions and Attractions, THEATRE = Theatre/Dance
CATEGORY_EVENT_CODES = {
    "Museums": "EXHIB",
    "Attractions": "EXHIB",
    "Theatre and Shows": "THEATRE",
    "Arts and Crafts": "KIDS",
    "Science and Technology": "EXHIB",
    "Animals": "EXHIB",
    "Play and Explore": "KIDS",
    "Fairs and Festivals": "FEST",
    "Music": "LIVE",
    "Sports": "SPORT",
    "Learning": "KIDS",
    "Community": "KIDS",
}

@tool
def search_skiddle_events(
    query: str,
    location: str,
    date: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[int] = 5,
    category: Optional[str] = None
) -> str:
    """
    Search for family events using the Skiddle API.
    Skiddle is a UK what's-on guide with strong coverage of grassroots,
    community and local family events that Ticketmaster doesn't list.
    Uses KIDS event code to filter for family-appropriate events.
    Accepts optional coordinates for radius-based searching.
    """
    api_key = os.getenv("SKIDDLE_API_KEY")

    # Determine event code — default to KIDS for family events
    event_code = CATEGORY_EVENT_CODES.get(category or "", "KIDS")

    try:
        params = {
            "api_key": api_key,
            "eventcode": event_code,
            "description": 1,
            "imagefilter": 0,  # Don't filter by image — reduces results
            "under18": 1,      # Only events under 18s can attend
            "order": "distance" if latitude else "trending",
            "limit": 10,
            "country": "GB",
        }

        # Use coordinates if available for accurate radius search
        if latitude is not None and longitude is not None:
            params["latitude"] = latitude
            params["longitude"] = longitude
            params["radius"] = radius_miles or 5
            params["getdistance"] = 1
        else:
            params["town"] = location

        # Add keyword from query if specific enough
        if query and query.lower() not in ["family activities", "family", "children"]:
            params["keyword"] = query

        # Parse dates from resolved date string
        date_pattern = r'(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})'
        matches = re.findall(date_pattern, date)
        if matches:
            try:
                first_date = datetime.strptime(
                    f"{matches[0][0]} {matches[0][1]} {matches[0][2]}", "%d %B %Y"
                )
                params["minDate"] = first_date.strftime("%Y-%m-%d")
                if len(matches) > 1:
                    last_date = datetime.strptime(
                        f"{matches[-1][0]} {matches[-1][1]} {matches[-1][2]}", "%d %B %Y"
                    )
                    params["maxDate"] = last_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

        response = requests.get(
            "https://www.skiddle.com/api/v1/events/search/",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("results"):
            # Try again without eventcode if no results — broader search
            params.pop("eventcode", None)
            params.pop("under18", None)
            params["keyword"] = f"family children {query}".strip()
            response = requests.get(
                "https://www.skiddle.com/api/v1/events/search/",
                params=params,
                timeout=10
            )
            data = response.json()

        if not data.get("results"):
            return f"No Skiddle family events found in {location} for the selected dates."

        results = []
        for event in data["results"][:8]:
            name = event.get("eventname", "Unknown event")
            venue = event.get("venue", {})
            venue_name = venue.get("name", "Venue TBC")
            venue_town = venue.get("town", "")
            venue_postcode = venue.get("postcode", "")
            venue_address = venue.get("address", "")
            full_address = ", ".join(filter(None, [venue_address, venue_town, venue_postcode]))

            event_date = event.get("date", "Date TBC")
            opening_times = event.get("openingtimes", {})
            time_str = opening_times.get("doorsopen", "") if opening_times else ""

            min_price = event.get("minarticleprice", "0")
            is_free = str(min_price) in ["0", "0.00", ""]
            price_str = "Free" if is_free else f"From £{min_price}"

            description = event.get("description", "")
            if description and len(description) > 150:
                description = description[:150] + "..."

            event_url = event.get("link", "")

            # Get image
            image_url = "No photo"
            images = event.get("images", {})
            if images and isinstance(images, dict):
                image_url = images.get("original", images.get("medium", "No photo"))

            # Get coordinates
            lat = venue.get("latitude", "")
            lng = venue.get("longitude", "")

            # Get distance if available
            distance = event.get("distance", "")
            distance_str = f"\n  Distance: {distance} miles" if distance else ""

            results.append(
                f"- {name}\n"
                f"  Venue: {venue_name}, {full_address}\n"
                f"  Date: {event_date}\n"
                f"  Time: {time_str}\n"
                f"  Price: {price_str}\n"
                f"  Description: {description}\n"
                f"  Link: {event_url}\n"
                f"  Photo: {image_url}\n"
                f"  Coordinates: {lat}, {lng}{distance_str}"
            )

        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        return "Skiddle is taking too long to respond. Please try again shortly."
    except requests.exceptions.ConnectionError:
        return "Could not connect to Skiddle. Please check your connection and try again."
    except requests.exceptions.HTTPError as e:
        return f"Skiddle returned an error: {str(e)}. Please try again shortly."
    except Exception as e:
        logger.error(f"Unexpected error in search_skiddle_events: {str(e)}")
        return "Something went wrong searching Skiddle. Please try again."
