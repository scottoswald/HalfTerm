from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from agent import run_agent
import logging
import pytz

# Load environment variables from .env file before anything else runs
load_dotenv()

# Set up logging so errors get written to the terminal
# This is more professional than using print() for error reporting
# logging.INFO means we'll see INFO, WARNING and ERROR messages
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Creates the actual API application
app = FastAPI()

# CORS — allows our frontend to talk to our backend
app.add_middleware(
    CORSMiddleware,
    # Allow requests from all our frontend environments:
    # - Local Vite development server
    # - Local Docker frontend container
    # - Deployed Railway frontend
    allow_origins=[
        "http://localhost:5173",      # Local Vite dev server
        "http://localhost:3000",      # Local Docker frontend container
        "https://halfterm.up.railway.app",  # Deployed Railway frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def resolve_date(date_value: str) -> str:
    """
    Convert a relative date string into an exact date or date range.
    This is called before passing dates to the agent so Claude
    always receives precise dates rather than relative terms it has to interpret.
    
    For example:
    'today' -> 'today (Wednesday 13th May 2026)'
    'this weekend' -> 'this weekend (Saturday 16th May and Sunday 17th May 2026)'
    'next week' -> 'next week (Monday 18th May to Sunday 24th May 2026)'
    """
    # Get current date in UK timezone
    # This ensures dates are correct for UK users regardless of server timezone
    uk_tz = pytz.timezone('Europe/London')
    now = datetime.now(uk_tz)
    today = now.date()

    # Helper to format a date as "Monday 13th May 2026"
    def format_date(d):
        # %-d removes the leading zero from the day number on Linux/Mac
        day = d.strftime('%-d')
        # Add the correct ordinal suffix (1st, 2nd, 3rd, 4th etc)
        if day in ('1', '21', '31'):
            suffix = 'st'
        elif day in ('2', '22'):
            suffix = 'nd'
        elif day in ('3', '23'):
            suffix = 'rd'
        else:
            suffix = 'th'
        return d.strftime(f'%A {day}{suffix} %B %Y')

    if date_value == 'today':
        return f"today ({format_date(today)})"

    elif date_value == 'tomorrow':
        tomorrow = today + timedelta(days=1)
        return f"tomorrow ({format_date(tomorrow)})"

    elif date_value == 'this weekend':
        # If today is Saturday (5) or Sunday (6) — we're already in the weekend
        # So "this weekend" means the current weekend we're in
        if today.weekday() == 5:
            # Today is Saturday — weekend is today and tomorrow
            saturday = today
            sunday = today + timedelta(days=1)
        elif today.weekday() == 6:
            # Today is Sunday — weekend is yesterday and today
            saturday = today - timedelta(days=1)
            sunday = today
        else:
            # It's a weekday — calculate days until next Saturday
            days_until_saturday = 5 - today.weekday()
            saturday = today + timedelta(days=days_until_saturday)
            sunday = saturday + timedelta(days=1)
        return f"this weekend ({format_date(saturday)} and {format_date(sunday)})"

    elif date_value == 'this week':
        # This week = today until Sunday
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        sunday = today + timedelta(days=days_until_sunday)
        return f"this week ({format_date(today)} to {format_date(sunday)})"

    elif date_value == 'next week':
        # Next week = Monday to Sunday of next week
        days_until_next_monday = (7 - today.weekday()) % 7 or 7
        next_monday = today + timedelta(days=days_until_next_monday)
        next_sunday = next_monday + timedelta(days=6)
        return f"next week ({format_date(next_monday)} to {format_date(next_sunday)})"

    # If we don't recognise the value just return it as is
    return date_value

# ---- REQUEST MODEL ----
# Defines the expected shape of the search request from the frontend
# Each search parameter is now its own field rather than bundled into one string
# This is more professional, easier to validate, and clearer to read
class SearchRequest(BaseModel):
    # List of activities because users can select multiple
    # e.g. ["Museums", "Outdoor Activities"]
    activities: list[str]
    # The city to search in
    location: str
    # The date range e.g. "today", "this weekend"
    date: str
    # Age range of the children e.g. "4-7", "all ages"
    age_range: str
    # Budget range e.g. "free", "under £10"
    cost_range: str

# ---- ROUTES ----

# Health check — confirms the backend is alive
@app.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

# Search route — receives structured search parameters and runs the AI agent
# @app.post means it expects a POST request — we're sending data to the server
# SearchRequest tells FastAPI to validate the request body against our model
@app.post("/search")
def search(request: SearchRequest):
    try:
        # Resolve the relative date string to exact dates before passing to the agent
        # This means Claude always receives precise dates rather than having to guess
        # e.g. "this weekend" becomes "this weekend (Saturday 16th May and Sunday 17th May 2026)"
        resolved_date = resolve_date(request.date)

        # Log the full search request including the resolved date
        # Using resolved_date here so we can see exactly what the agent receives
        logger.info(f"Search request: {request.activities} in {request.location} on {resolved_date} for ages {request.age_range} budget {request.cost_range}")

        # Pass all five parameters to the agent
        # date uses resolved_date so the agent gets exact dates not relative terms
        result = run_agent(
            activities=request.activities,   # List of selected activity types
            location=request.location,       # UK city to search in
            date=resolved_date,              # Exact date(s) e.g. "Saturday 16th May 2026"
            age_range=request.age_range,     # Children's age range e.g. "4-7"
            cost_range=request.cost_range    # Budget range e.g. "free", "under £10"
        )

        # Log successful completion so we can monitor the pipeline
        logger.info("Search completed successfully")

        # Return the result as a JSON object the frontend can read
        return {"result": result}

    except ValueError as e:
        # ValueError means something was wrong with the input data
        # 400 Bad Request tells the frontend the problem was with what it sent
        logger.error(f"ValueError in search: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid search parameters. Please try again.")

    except ConnectionError as e:
        # ConnectionError means we couldn't reach one of the external APIs
        # 503 Service Unavailable tells the frontend an external service is down
        logger.error(f"ConnectionError in search: {str(e)}")
        raise HTTPException(status_code=503, detail="Could not connect to external services. Please try again shortly.")

    except Exception as e:
        # Catch all other unexpected errors
        # 500 Internal Server Error is the standard response for unexpected failures
        # We log the full error for debugging but don't expose it to the frontend
        logger.error(f"Unexpected error in search: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")