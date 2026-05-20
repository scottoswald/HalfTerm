from pydantic import BaseModel

# ---- REQUEST MODELS ----
# Pydantic models define the expected shape of incoming requests
# FastAPI uses these to automatically validate request bodies
# If a required field is missing or the wrong type FastAPI returns a 422 error

class SearchRequest(BaseModel):
    # List of activities because users can select multiple
    # e.g. ["Museums", "Outdoor Activities"]
    activities: list[str]
    # The city to search in e.g. "London"
    location: str
    # The date range e.g. "today", "this weekend"
    date: str
    # Age range of the children e.g. "4-7", "all ages"
    age_range: str
    # Budget range e.g. "free", "under £10", "any"
    cost_range: str