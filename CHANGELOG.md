# Changelog

All notable changes to Halfterm will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-05-12

### Added
- Structured search parameters — activities, location, date, age_range and cost_range now separate fields
- resolve_date function — converts relative dates to exact dates server side before reaching the agent
- pytz library for accurate UK timezone handling
- "Any Budget" option added to cost range filter
- date parameter added to Ticketmaster and Eventbrite tools — date filtering now works correctly
- parse_date_range function in Ticketmaster tool — extracts exact dates from resolved date strings

### Fixed
- "This weekend" on Saturday or Sunday now correctly returns the current weekend
- "This week" on Sunday now correctly returns just today rather than jumping to next Sunday
- Ticketmaster error message was hardcoded to "London" — now uses the actual location parameter
- costRange initial state was "any cost" which didn't exist in the options list
- VITE_BACKEND_URL logic now properly uses the value if set rather than always falling back to localhost
- print() statements in tool files replaced with proper logger calls
- load_dotenv() retained in agent.py for correct test context behaviour

### Changed
- SearchRequest model updated with five structured fields replacing the old bundled string approach
- Agent prompt updated to explicitly pass date to each tool
- Tool docstrings rewritten for better agent decision making
- Agent query now clearly labels each search parameter for Claude

## [2.1.1] - 2026-05-07

### Added
- AWS ECR repositories for frontend and backend Docker images
- AWS ECS cluster (halfterm) in eu-west-2 (London)
- ECS Fargate task definitions for frontend and backend
- ECS services running both containers on AWS
- CloudWatch log groups for container monitoring
- IAM ecsTaskExecutionRole for ECS permissions
- VPC security group with ports 8000 and 80 open

### Fixed
- Docker images rebuilt for linux/amd64 platform (Mac M1 compatibility)
- nginx.conf updated to use backend public IP for AWS ECS deployment

## [2.1.0] - 2026-05-06

### Added
- Eventbrite API integration as a third event data source
- Tools refactored into own files (backend/tools/)
- tools/__init__.py exposes all tools cleanly
- GitHub Actions CI/CD pipeline

### Changed  
- agent.py now imports tools from tools package rather than defining them inline

## [2.0.2] - 2026-05-05

### Added
- Tailwind CSS v3 and DaisyUI v4 installed and configured
- Custom Halfterm orange brand theme
- Activity grid with multi-select (8 activities with emojis)
- UK city locations dropdown (14 cities)
- Date options (Today, Tomorrow, This Weekend, This Week, Next Week)
- Age range filter (0-3, 4-7, 8-12, 13+, All Ages)
- Budget filter (Free, Under £10, £10-£25, £25-£50, £50+)
- Results page styled with Daisy UI and Tailwind typography
- Markdown tables rendering with remark-gfm
- Google Places now uses dynamic city coordinates
- Agent prompt improved to handle age and budget filters
- Docker containerisation for frontend and backend
- Multi-stage Docker build with nginx reverse proxy
- Docker Compose to run entire app with one command
- GitHub Actions CI/CD pipeline — runs on every push to main
- Frontend tests — 12 tests passing
- Backend tests — 8 tests passing

### Fixed
- Google Places hardcoded London coordinates replaced with dynamic city lookup
- CORS updated to allow localhost:3000 for Docker development
- Docker networking fixed using nginx reverse proxy

## [2.0.1] - 2026-05-05

### Fixed
- Docker nginx reverse proxy now correctly routes API calls from frontend to backend
- Simplified VITE_BACKEND_URL logic — empty string triggers proxy, unset uses localhost
- CORS updated to allow localhost:3000 for Docker development

## [1.1.1] - 2026-05-03

### Added
- Deployed backend to Railway (halfterm-production.up.railway.app)
- Deployed frontend to Railway (halfterm.up.railway.app)
- Configured CORS for production URLs
- Added VITE_BACKEND_URL environment variable for frontend
- Fixed global.fetch TypeScript error in tests
- Fresh package-lock.json for Railway compatibility

## [1.1.0] - 2026-05-02

### Added
- Error handling on search_ticketmaster_events — Timeout, ConnectionError, HTTPError, Exception
- Error handling on search_google_places — Timeout, ConnectionError, HTTPError, Exception
- Error handling in main.py — ValueError (400), ConnectionError (503), Exception (500)
- Error handling on frontend — navigates to results page with friendly error message
- Python logging module added to main.py
- timeout=10 added to all external API calls
- raise_for_status() added to all external API calls
- Backend tests updated with mocking — 7 tests, runs in under 1 second
- test_ConnectionError_runs_as_expected — written independently
- 8 frontend tests with Vitest
- 16 tests total across the project
- Cycling loading messages on search button
- Pulse animation on disabled search button
- CHANGELOG.md added
- README.md updated

## [1.0.0] - 2026-04-27

### Added
- Two page React/TypeScript frontend built with Vite
- Homepage with activity, location and date dropdowns
- Results page with markdown rendered agent response
- React Router navigation between pages
- FastAPI backend with health check and search endpoints
- Pydantic request validation with SearchRequest model
- CORS configured for frontend/backend communication
- LangChain + Claude AI agent using create_react_agent
- search_ticketmaster_events tool — live family events data
- search_google_places tool — venue information with ratings and addresses
- Frontend connected to backend via fetch
- Markdown rendering with react-markdown
- Root .gitignore covering venv, Python cache, .env
- Backend virtual environment set up
- All API keys stored safely in .env
- Eventbrite API key obtained (not yet wired up)
- 4 initial backend tests with pytest

