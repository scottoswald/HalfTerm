from fastapi import APIRouter, HTTPException
from models.requests import SearchRequest
from utils.date_resolver import resolve_date
from agent import run_agent, run_venues_search, run_events_search
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ---- HEALTH CHECK ----
@router.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

# ---- VENUES SEARCH ----
# Fast endpoint — Google Places only (~5-8 seconds)
# Called first by the frontend so venue cards appear quickly
@router.post("/search/venues")
def search_venues(request: SearchRequest):
    try:
        resolved_date = resolve_date(request.date)
        vibe_values = [v.value for v in request.vibes]
        logger.info(f"Venues search: {request.activities} in {request.location}")

        result = run_venues_search(
            activities=request.activities,
            vibes=vibe_values,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_miles=request.radius_miles or 5,
            date=resolved_date,
            age_range=request.age_range,
            cost_range=request.cost_range,
            free_text=request.free_text
        )
        logger.info("Venues search complete")
        return result

    except Exception as e:
        logger.error(f"Error in venues search: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")

# ---- EVENTS SEARCH ----
# Slower endpoint — Ticketmaster + Eventbrite (~15-25 seconds)
# Called second by the frontend — events appear after venues
@router.post("/search/events")
def search_events(request: SearchRequest):
    try:
        resolved_date = resolve_date(request.date)
        vibe_values = [v.value for v in request.vibes]
        logger.info(f"Events search: {request.activities} in {request.location}")

        result = run_events_search(
            activities=request.activities,
            vibes=vibe_values,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_miles=request.radius_miles or 5,
            date=resolved_date,
            age_range=request.age_range,
            cost_range=request.cost_range,
            free_text=request.free_text
        )
        logger.info("Events search complete")
        return result

    except Exception as e:
        logger.error(f"Error in events search: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")

# ---- COMBINED SEARCH (legacy) ----
# Kept for backward compatibility with existing tests
# Runs both searches and merges results
@router.post("/search")
def search(request: SearchRequest):
    try:
        resolved_date = resolve_date(request.date)
        vibe_values = [v.value for v in request.vibes]
        logger.info(f"Combined search: {request.activities} in {request.location}")

        result = run_agent(
            activities=request.activities,
            vibes=vibe_values,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_miles=request.radius_miles or 5,
            date=resolved_date,
            age_range=request.age_range,
            cost_range=request.cost_range,
            free_text=request.free_text
        )
        logger.info("Combined search complete")
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
