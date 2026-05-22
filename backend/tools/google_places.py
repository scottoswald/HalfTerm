from langchain_core.tools import tool
from typing import Optional
import requests
import os

# Fallback coordinates for UK cities
# Used when no GPS or postcode coordinates are provided
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
def search_google_places(query: str, location: str, latitude: Optional[float] = None, longitude: Optional[float] = None, radius_miles: Optional[int] = 5) -> str:
    """
    Search for family friendly venues, museums, parks and attractions in a UK location
    using the Google Places API.
    Returns venue details including address, rating and website.
    Use this tool to find permanent venues and attractions — museums, parks,
    science centres, zoos, theatres and similar places families can visit.
    Always use this tool alongside Ticketmaster to provide venue information.
    Accepts optional coordinates for more accurate radius-based searching.
    """
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")

    # Use provided coordinates if available, otherwise look up city coordinates
    # Convert radius from miles to metres for the API (1 mile = 1609 metres)
    if latitude is not None and longitude is not None:
        coords = {"latitude": latitude, "longitude": longitude}
        radius_metres = (radius_miles or 5) * 1609
    else:
        coords = UK_CITY_COORDINATES.get(location, UK_CITY_COORDINATES["London"])
        radius_metres = 10000  # Default 10km for city-based searches

    try:
        response = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.websiteUri",
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
            return f"No venues found in {location}."

        results = []
        for place in data["places"][:3]:
            name = place.get("displayName", {}).get("text", "Unknown")
            address = place.get("formattedAddress", "No address")
            rating = place.get("rating", "No rating")
            website = place.get("websiteUri", "No website")

            results.append(
                f"- {name}\n  Address: {address}\n  Rating: {rating}/5\n  Website: {website}"
            )

        return "\n\n".join(results)

    except requests.exceptions.Timeout:
        return "Google Places is taking too long to respond. Please try again shortly."

    except requests.exceptions.ConnectionError:
        return "Could not connect to Google Places. Please check your connection and try again."

    except requests.exceptions.HTTPError as e:
        return f"Google Places returned an error: {str(e)}. Please try again shortly."

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Unexpected error in search_google_places: {str(e)}")
        return "Something went wrong searching for venues. Please try again."
