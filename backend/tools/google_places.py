from langchain_core.tools import tool
import requests
import os

# Dictionary of UK city coordinates
# Used to bias Google Places results towards the correct city
# Falls back to London if the city isn't in our dictionary
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

    # Look up coordinates for the requested city
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
            # textQuery includes both the search term and city name
            # locationBias nudges results towards the selected city
            json={
                "textQuery": f"{query} {location}",
                "locationBias": {
                    "circle": {
                        # Use the dynamically looked up coordinates for the selected city
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

        # Build a readable string of venues — limit to 3 to keep response concise
        results = []
        for place in data["places"][:3]:
            # .get() returns the default value if the key doesn't exist
            # rather than throwing a KeyError
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