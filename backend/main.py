from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

#  executes the loading of the .env file. Let's Python know the API keys exist.
load_dotenv()

# This creates the actual API application. 
# Everything else hangs off this app object — all the routes, settings...
# Think of it as switching the API on.
app = FastAPI()

# This is CORS — Cross Origin Resource Sharing. 
# It allows certain URLS to talk to eachother.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Our routes...
@app.get("/")
def read_root():
    return {"message": "Halfterm backend is running"}