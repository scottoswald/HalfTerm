from pydantic import BaseModel
from typing import Optional

# ---- REQUEST MODELS ----

# Pydantic models define the expected shape of incoming requests

# A selected vibe stores both the display label and the full agent value
# label — shown in the UI summary e.g. "Accessible"
# value — passed to the agent e.g. "accessible and inclusive for children with additional needs..."

class SelectedVibe(BaseModel):
    label: str
    value: str

class SearchRequest(BaseModel):
    activities: list[str]
    vibes: list[SelectedVibe] = []
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_miles: Optional[int] = 5
    date: str
    age_range: str
    cost_range: str
    free_text: Optional[str] = None
    # New time filters — optional, None means no preference
    duration: Optional[str] = None
    time_of_day: Optional[str] = None