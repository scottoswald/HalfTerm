from fastapi import APIRouter, HTTPException
from models.requests import SearchRequest
from utils.date_resolver import resolve_date
from agent import run_agent
import logging

# APIRouter lets us define routes in separate files and register them in main.py
# Routes are defined with their full paths via decorators e.g. @router.post("/search")
router = APIRouter()

logger = logging.getLogger(__name__)

# ---- HEALTH CHECK ROUTE ----
# GET / — confirms the backend is alive
# Used by Railway and AWS to check the service is running
@router.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

# ---- SEARCH ROUTE ----
# POST /search — receives structured search parameters and runs the AI agent
# SearchRequest tells FastAPI to validate the request body against our model
@router.post("/search")
def search(request: SearchRequest):
    try:
        # Resolve the relative date string to exact dates before passing to the agent
        # e.g. "this weekend" becomes "this weekend (Saturday 23rd May and Sunday 24th May 2026)"
        resolved_date = resolve_date(request.date)

        logger.info(f"Search request: {request.activities} in {request.location} on {resolved_date} for ages {request.age_range} budget {request.cost_range}")

        # Run the AI agent with all search parameters
        # Pass coordinates if available — tools use these for radius search
        result = run_agent(
            activities=request.activities,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_miles=request.radius_miles or 5,
            date=resolved_date,
            age_range=request.age_range,
            cost_range=request.cost_range,
            free_text=request.free_text
        )

        logger.info("Search completed successfully")
        return result

    except ValueError as e:
        logger.error(f"ValueError in search: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid search parameters. Please try again.")

    except ConnectionError as e:
        logger.error(f"ConnectionError in search: {str(e)}")
        raise HTTPException(status_code=503, detail="Could not connect to external services. Please try again shortly.")

    except Exception as e:
        logger.error(f"Unexpected error in search: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")
