from pydantic import BaseModel
from typing import Optional

# ---- REQUEST MODELS ----
# Pydantic models define the expected shape of incoming requests
# FastAPI uses these to automatically validate request bodies
# If a required field is missing or the wrong type FastAPI returns a 422 error

class SearchRequest(BaseModel):
    # List of activities because users can select multiple
    # e.g. ["Museums", "Outdoor Activities"]
    activities: list[str]
    # The location text e.g. "London", "SW1A 1AA", "Hackney"
    location: str
    # Optional GPS or postcode-derived coordinates
    # If provided these are used for radius search instead of just location name
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Search radius in miles — default 5
    radius_miles: Optional[int] = 5
    # The date range e.g. "today", "this weekend"
    date: str
    # Age range of the children e.g. "4-7", "all ages"
    age_range: str
    # Budget range e.g. "free", "under £10", "any"
    cost_range: str
    # Optional free text search — user can type anything e.g. "go karting" or "baking class"
    # Claude handles spelling mistakes and interprets the intent
    free_text: Optional[str] = None
