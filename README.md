# Halfterm

A website for families to find things to do with their kids during school holidays.

## What it does

Search for kids activities by type, location, date, age range and budget. An AI agent
searches live data from Ticketmaster, Google Places and Eventbrite, and returns relevant
results tailored to your search.

> **Current scope:** UK cities only. Supports 8 activity types, 14 cities,
> date ranges from today through next week, age ranges from 0-3 to teenagers,
> and budget filters from free to £50+.

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS v3 + DaisyUI v4
- React Router
- React Markdown + remark-gfm

**Backend**
- Python + FastAPI
- Uvicorn
- pytz (UK timezone handling)

**AI Layer**
- LangChain + LangGraph
- Claude API (Anthropic) — claude-opus-4-5

**Live Data**
- Ticketmaster API — live family events with date filtering
- Google Places API — venue information with ratings and addresses
- Eventbrite API — community events, workshops and classes

**Testing**
- Vitest (frontend) — 12 tests
- Pytest (backend) — 8 tests

**Infrastructure**
- Docker + Docker Compose (local containerisation)
- nginx reverse proxy
- GitHub Actions CI/CD pipeline
- Railway (production deployment)
- AWS ECS + Fargate (portfolio deployment)
- AWS ECR (container registry)

## Project Structure
HalfTerm/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Homepage with search form
│   │   ├── Results.tsx         # Results page
│   │   ├── App.css             # Global styles
│   │   └── test/
│   │       ├── App.test.tsx
│   │       └── Results.test.tsx
│   ├── Dockerfile.local        # Frontend Docker image (local use)
│   ├── nginx.conf              # nginx config with reverse proxy
│   ├── railway.json            # Railway deployment config
│   └── tailwind.config.js      # Tailwind + DaisyUI config
├── backend/
│   ├── tools/
│   │   ├── init.py
│   │   ├── ticketmaster.py     # Ticketmaster API tool
│   │   ├── google_places.py    # Google Places API tool
│   │   └── eventbrite.py       # Eventbrite API tool
│   ├── tests/
│   │   └── test_main.py
│   ├── main.py                 # FastAPI routes + date resolution
│   ├── agent.py                # LangChain AI agent
│   ├── Dockerfile              # Backend Docker image
│   └── requirements.txt
├── docker-compose.yml          # Run entire app with one command
├── CHANGELOG.md
└── README.md

## Getting Started

### Prerequisites

You will need API keys for:
- [Anthropic](https://console.anthropic.com) — Claude AI
- [Ticketmaster](https://developer.ticketmaster.com) — live events
- [Google Places](https://console.cloud.google.com) — venue information
- [Eventbrite](https://www.eventbrite.com/account-settings/apps) — community events

Create a `.env` file in the `backend` folder:
ANTHROPIC_API_KEY=your-key-here
TICKETMASTER_API_KEY=your-key-here
GOOGLE_PLACES_API_KEY=your-key-here
EVENTBRITE_API_KEY=your-key-here

### Option 1 — Local Development (recommended for day to day work)

**Backend**
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

**Frontend**
cd frontend
npm install
npm run dev

Visit `http://localhost:5173`

### Option 2 — Docker (recommended for testing production build)
docker-compose up --build

Visit `http://localhost:3000`

### Running Tests

**Backend**
cd backend
source venv/bin/activate
python -m pytest tests/ -v

**Frontend**
cd frontend
npx vitest run

### API Documentation

Visit `http://localhost:8000/docs` to explore the backend API via Swagger UI.

## Deployment

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Local Vite | http://localhost:5173 | http://localhost:8000 |
| Local Docker | http://localhost:3000 | http://localhost:8000 |
| Railway (production) | https://halfterm.up.railway.app | https://halfterm-production.up.railway.app |
| AWS ECS (portfolio) | http://16.60.112.240 | http://16.60.157.219:8000 |

> Note: AWS IP addresses may change if containers restart. Railway is the stable production URL.

## Status

v3.1.0 complete. See [CHANGELOG.md](CHANGELOG.md) for full version history.

**Live URL:** https://halfterm.up.railway.app