from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.search import router
import logging

# Load environment variables from .env file before anything else runs
load_dotenv()

# Set up logging so we can see INFO and ERROR messages in the terminal
logging.basicConfig(level=logging.INFO)

# ---- APP SETUP ----
# Creates the FastAPI application
# All routes and business logic live in separate files
# main.py is just the entry point that wires everything together
app = FastAPI()

# ---- CORS ----
# Allows our frontend to talk to our backend
# Without this the browser would block requests from a different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",               # Local Vite dev server
        "http://localhost:3000",               # Local Docker frontend container
        "https://halfterm.up.railway.app",     # Deployed Railway frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- ROUTES ----
# Register the search router — this adds all routes from routes/search.py
# include_router wires the APIRouter into the main FastAPI app
app.include_router(router)