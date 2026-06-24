import logging
import requests
import os
from langchain_core.tools import tool
from typing import Optional

logger = logging.getLogger(__name__)

# Fallback coordinates for UK cities
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

def format_opening_hours(hours_data: dict) -> str:
    """
    Format Google Places regularOpeningHours into a readable string.
    Falls back to 'Check website for hours' if data is unavailable.
    """
    if not hours_data:
        return "Check website for hours"

    weekday_descriptions = hours_data.get("weekdayDescriptions", [])
    if weekday_descriptions:
        # Return the first two days as a summary e.g. "Mon-Fri: 10am-5pm"
        return " | ".join(weekday_descriptions[:2])

    return "Check website for hours"


def search_google_places_with_photos(
    query: str,
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[int] = 5
) -> tuple[str, dict[str, str]]:
    """
    Search Google Places and return both a text summary for Claude
    and a dict of photo URLs keyed by venue name.

    This is the primary production function used by agent.py.
    Photo URLs are extracted here in Python so Claude doesn't generate them —
    this saves ~400 output tokens per search and speeds up Claude significantly.
    Opening hours are also extracted here and passed as structured text.

    Returns: (text_for_claude, photo_urls_by_name)
    """
    api_key = os.getenv("GOOGLE_PLACES_API_KEY_BACKEND")

    if latitude is not None and longitude is not None:
        coords = {"latitude": latitude, "longitude": longitude}
        radius_metres = (radius_miles or 5) * 1609
    else:
        coords = UK_CITY_COORDINATES.get(location, UK_CITY_COORDINATES["London"])
        radius_metres = 10000

    try:
        response = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                # Added regularOpeningHours to get actual opening times
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.websiteUri,places.photos,places.regularOpeningHours",
            },
            json={
                "textQuery": f"{query} {location}",
                "locationBias": {
                    "circle": {
                        "center": coords,
                        "radius": float(radius_metres)
                    }
                }
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        if "places" not in data:
            return f"No venues found in {location}.", {}

        results = []
        photo_urls: dict[str, str] = {}

        for place in data["places"][:5]:
            name = place.get("displayName", {}).get("text", "Unknown")
            address = place.get("formattedAddress", "No address")
            rating = place.get("rating", "No rating")
            website = place.get("websiteUri", "No website")

            # Extract opening hours — structured data, not "Check website"
            opening_hours = format_opening_hours(
                place.get("regularOpeningHours", {})
            )

            # Extract photo URL in Python — not passed to Claude to save tokens
            photos = place.get("photos", [])
            if photos:
                photo_name = photos[0].get("name", "")
                if photo_name:
                    photo_urls[name] = f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=800&key={api_key}"

            results.append(
                f"- {name}\n"
                f"  Address: {address}\n"
                f"  Rating: {rating}/5\n"
                f"  Website: {website}\n"
                f"  Opening hours: {opening_hours}"
            )

        return "\n\n".join(results), photo_urls

    except requests.exceptions.Timeout:
        return "Google Places is taking too long to respond.", {}
    except requests.exceptions.ConnectionError:
        return "Could not connect to Google Places.", {}
    except requests.exceptions.HTTPError as e:
        return f"Google Places returned an error: {str(e)}.", {}
    except Exception as e:
        logger.error(f"Unexpected error in search_google_places_with_photos: {str(e)}")
        return "Something went wrong searching for venues.", {}


# Alias for backward compatibility
search_google_places_raw = search_google_places_with_photos


@tool
def search_google_places(
    query: str,
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[int] = 5
) -> str:
    """
    Search for family friendly venues, museums, parks and attractions in a UK location
    using the Google Places API.
    Returns venue details including address, rating, website, opening hours and photo URL.
    Note: In production, agent.py calls search_google_places_with_photos directly.
    """
    text, photo_urls = search_google_places_with_photos(query, location, latitude, longitude, radius_miles)

    if photo_urls:
        lines = text.split("\n\n")
        enhanced = []
        for line in lines:
            name = line.split("\n")[0].replace("- ", "").strip()
            if name in photo_urls:
                line += f"\n  Photo: {photo_urls[name]}"
            enhanced.append(line)
        return "\n\n".join(enhanced)

    return text

