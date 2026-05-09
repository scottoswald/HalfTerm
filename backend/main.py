from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from agent import run_agent
import logging

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
        # Log the incoming search so we can see what's being searched in the terminal
        # This is useful for debugging and monitoring usage patterns
        logger.info(f"Search request: {request.activities} in {request.location} on {request.date} for ages {request.age_range} budget {request.cost_range}")

        # Pass all five parameters separately to the agent
        # Previously these were bundled into one string — now each param is explicit
        # This makes the agent's job clearer and results more accurate
        result = run_agent(
            activities=request.activities,
            location=request.location,
            date=request.date,
            age_range=request.age_range,
            cost_range=request.cost_range
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