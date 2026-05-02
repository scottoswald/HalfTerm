# Halfterm

A website for families to find things to do with their kids during school holidays.

## What it does

Search for kids activities by type, location and date. An AI agent searches 
live data from Ticketmaster and Google Places, and returns relevant results 
tailored to your search.

> **MVP scope:** Currently focused on finding kids activities at London museums 
> today. More locations, activity types and dates coming in future versions.

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- React Router
- React Markdown

**Backend**
- Python + FastAPI
- Uvicorn

**AI Layer**
- LangChain + LangGraph
- Claude API (Anthropic)

**Live Data**
- Ticketmaster API — live family events
- Google Places API — venue information
- Eventbrite API — coming soon

**Testing**
- Vitest (frontend)
- Pytest (backend)

## Project Structure

HalfTerm/
├── frontend/
│   └── src/
│       ├── App.tsx          # Homepage with search form
│       ├── Results.tsx      # Results page
│       ├── App.css          # Styles
│       └── test/
│           ├── App.test.tsx
│           └── Results.test.tsx
├── backend/
│   ├── main.py              # FastAPI routes
│   ├── agent.py             # LangChain AI agent and tools
│   ├── requirements.txt
│   └── tests/
│       └── test_main.py
├── CHANGELOG.md
└── README.md

## Getting Started

### Prerequisites
You'll need API keys for:
- Anthropic: https://console.anthropic.com
- Ticketmaster: https://developer.ticketmaster.com
- Google Places: https://console.cloud.google.com

Create a .env file in the backend folder:

ANTHROPIC_API_KEY=your-key-here
TICKETMASTER_API_KEY=your-key-here
GOOGLE_PLACES_API_KEY=your-key-here

### Frontend

cd frontend
npm install
npm run dev

Visit http://localhost:5173

### Backend

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

Visit http://localhost:8000/docs to explore the API

### Running Tests

Backend:
cd backend
source venv/bin/activate
python -m pytest tests/ -v

Frontend:
cd frontend
npx vitest run

## Status

MVP 1.1 complete and deployed. See [CHANGELOG.md](CHANGELOG.md) for full version history.

**Live URLs:**
- Frontend: https://halfterm.up.railway.app
- Backend API: https://halfterm-production.up.railway.app
- API Docs: https://halfterm-production.up.railway.app/docs