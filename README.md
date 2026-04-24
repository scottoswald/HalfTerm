# Halfterm

A website for families to find things to do with their kids.

## What it does

Search for kids activities by type, location and date. An AI agent searches live data and returns relevant results tailored to your search.

MVP - Currently, it's focusing on finding kids activities to do in London Museums today, so that's all it can sertch for at the moment.

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS

**Backend**
- Python + FastAPI
- Uvicorn

**AI Layer**
- LangChain
- Claude API (Anthropic)

**Live Data**
- Eventbrite API
- Google Places API

## Project Structure

HalfTerm/
├── frontend/         # React TypeScript app
│   └── src/
│       ├── App.tsx        # Homepage with search form
│       └── Results.tsx    # Results page
├── backend/          # Python FastAPI server
└── README.md

## Getting Started

**Frontend**
cd frontend
npm install
npm run dev

Visit http://localhost:5173

**Backend**
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

## Status

MVP in progress. Currently building the AI agent layer.