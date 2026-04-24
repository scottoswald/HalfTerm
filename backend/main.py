from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Executes the loading of the .env file
# Lets Python know the API keys exist before anything else runs
load_dotenv()

# Creates the actual API application
# Everything else hangs off this app object — all routes, all settings
# Think of it as switching the API on
app = FastAPI()

# CORS — Cross Origin Resource Sharing
# By default browsers block requests between different URLs for security
# Our frontend (localhost:5173) and backend (localhost:8000) are different URLs
# This tells the backend to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Our first route — a health check
# @app.get("/") means: when a GET request hits "/", run the function below
# Returns a simple message to confirm the backend is alive
@app.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}