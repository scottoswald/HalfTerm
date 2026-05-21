from fastapi import APIRouter, HTTPException
from models.requests import SearchRequest
from utils.date_resolver import resolve_date
from agent import run_agent
import logging

# APIRouter is like a mini FastAPI app
# It lets us define routes in separate files and register them in main.py
# prefix="/search" means all routes here are under /search
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

        # Log the full search request so we can monitor usage
        logger.info(f"Search request: {request.activities} in {request.location} on {resolved_date} for ages {request.age_range} budget {request.cost_range}")

        # Run the AI agent with all five structured parameters
        result = run_agent(
            activities=request.activities,
            location=request.location,
            date=resolved_date,
            age_range=request.age_range,
            cost_range=request.cost_range,
            free_text=request.free_text
        )

        logger.info("Search completed successfully")

        # Return the structured JSON result directly to the frontend
        return result

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
        logger.error(f"Unexpected error in search: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")