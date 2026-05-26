from fastapi import APIRouter, HTTPException
from models.requests import SearchRequest
from utils.date_resolver import resolve_date
from agent import run_agent
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

@router.post("/search")
def search(request: SearchRequest):
    try:
        resolved_date = resolve_date(request.date)

        # Extract just the value strings from vibes for the agent
        # The agent only needs the descriptive value, not the display label
        vibe_values = [v.value for v in request.vibes]

        logger.info(f"Search request: {request.activities} in {request.location} on {resolved_date} vibes {vibe_values}")

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
