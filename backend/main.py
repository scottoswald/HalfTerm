from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from agent import run_agent

# Load environment variables from .env file before anything else runs
load_dotenv()

# Creates the actual API application
# Everything else hangs off this app object — all routes, all settings
app = FastAPI()

# CORS — allows our frontend (localhost:5173) to talk to our backend (localhost:8000)
# Without this the browser would block requests between the two
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- REQUEST MODEL ----
# Pydantic is a data validation library that comes with FastAPI
# BaseModel lets us define exactly what shape of data we expect
# When the frontend sends a search request, it must match this structure
# If any field is missing or the wrong type, FastAPI automatically returns an error
class SearchRequest(BaseModel):
    activity: str
    location: str
    when: str

# ---- ROUTES ----
# Health check — confirms the backend is alive
@app.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}

# Search route — this is what the frontend will call when the user hits Search
# @app.post means it expects a POST request — we're sending data to the server
# SearchRequest tells FastAPI to expect and validate the request body
@app.post("/search")
def search(request: SearchRequest):
    # Pass the three search parameters to the agent and get a response back
    result = run_agent(request.activity, request.location, request.when)
    # Return the result as a JSON object the frontend can read
    return {"result": result}