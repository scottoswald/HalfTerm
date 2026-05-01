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

# CORS — allows our frontend (localhost:5173) to talk to our backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- REQUEST MODEL ----
# Defines the expected shape of the search request from the frontend
# FastAPI automatically validates incoming requests against this model
class SearchRequest(BaseModel):
    activity: str
    location: str
    when: str

# ---- ROUTES ----

# Health check — confirms the backend is alive
@app.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

# Search route — receives search parameters and runs the AI agent
@app.post("/search")
def search(request: SearchRequest):
    try:
        # Log the incoming search so we can see what's being searched in the terminal
        logger.info(f"Search request: {request.activity} in {request.location} on {request.when}")

        # Run the agent with the three search parameters
        result = run_agent(request.activity, request.location, request.when)

        # Log that the search completed successfully
        logger.info("Search completed successfully")

        return {"result": result}

    except ValueError as e:
        # ValueError usually means something was wrong with the input data
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