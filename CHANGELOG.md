# Changelog

All notable changes to Halfterm will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [3.5.0] - 2026-07-20

### Added
- Skiddle API integration for grassroots UK family events
- Per-category search strategy audit and refinement (all 16 categories)
- About page with project description, tech stack and links to GitHub and LinkedIn
- Contact page with email form powered by Resend
- About and Contact buttons on search and results pages
- Feedback form button on About page
- Opening times from Google Places regularOpeningHours field

### Changed
- Vibe buttons now use btn-primary (orange) for better selected state contrast
- "Update search" renamed to "New search"
- Results scroll to top on load
- Google Places now returns up to 8 results (was 5)
- Fairs & Festivals: Ticketmaster disabled (was returning adult music festivals)
- Music: Ticketmaster disabled (was returning adult concerts)  
- Theatre & Shows: Google Places now enabled to surface children's theatres
- Swimming: query balanced for indoor and outdoor pools
- Outdoors: query updated to surface parks and gardens alongside nature reserves
- Science & Tech: query tightened to reduce overlap with Museums
- Tighter family filtering in events prompt
- Radius false positive bug fixed
- Mobile layout improvements (2-col activity grid, radius buttons, Ages label)

### Fixed
- Contact email kept private via environment variable (not hardcoded)
- Google Places cap increased to 8 results

## [3.4.0] - 2026-05-28

### Added
- GPS location search — "Use my current location" button using browser Geolocation API
- Works on mobile and desktop (Chrome, Safari, Firefox)
- Postcode search — automatically looks up coordinates via Postcodes.io (free, no API key needed)
- Radius selector — 1, 2, 5, 10, 20 miles (default 5 miles)
- Quick pick city dropdown — shortcut to populate location search box
- Free text location input — accepts any postcode, town, city or village
- Radius search across all three APIs — Ticketmaster, Eventbrite and Google Places
- Distance calculation using Haversine formula
- Distance badges on cards showing miles from user location
- Closest first sort option in filter bar (enabled when coordinates available)
- Graceful radius fallback — extends search beyond radius when too few results found, with explanatory message
- "What kind of experience?" section — 9 optional ethos filters (Free & Low Cost, Accessible, Calm & Quiet etc)
- Real images on venue cards from Google Places Photos API
- Real images on event cards from Ticketmaster and Eventbrite
- Initials fallback when no image available (e.g. "NHM" for Natural History Museum)
- Map view — toggle between list and map, Leaflet with CartoDB Positron tiles
- Orange pins for venues/events, blue pin for user location
- Hover/click popups on map pins with mini card styling
- Two-stage loading — venues appear first (~7s), events appear after (~15s)
- Skeleton loading cards pulse while results load
- Separate /search/venues and /search/events backend endpoints

### Changed
- Switched from Claude Opus to Claude Haiku for formatting — 5x speed improvement
- Photo URLs extracted in Python before Claude responds — saves ~400 output tokens per search
- Parallel tool calls — all APIs called simultaneously not sequentially
- Search time reduced from ~90 seconds to ~7 seconds
- Activity grid expanded to 5 results (was 3)
- Google Places uses backend-specific API key (separate from frontend key)
- Google Places frontend key restricted to specific website referrers

### Fixed
- package-lock.json sync issues in CI/CD
- Radio button namePrefix conflicts in FilterPanel
- Ages "All ages" no longer shows redundant "Ages All ages" on cards

## [3.4.0] - 2026-05-22

### Added
- GPS location search — "Use my current location" button using browser Geolocation API
- Works on mobile and desktop (Chrome, Safari, Firefox)
- Postcode search — automatically looks up coordinates via Postcodes.io (free, no API key)
- Radius selector — 1, 2, 5, 10, 20 miles (default 5 miles)
- Quick pick city dropdown — shortcut to populate location search box
- Free text location input — accepts any postcode, town, city or village
- Coordinates passed to Google Places for more accurate radius-based results
- latitude, longitude and radius_miles fields added to SearchRequest model

### Changed
- Location section redesigned — replaces city dropdown with full location search
- google_places.py updated to use coordinates when available
- agent.py updated to pass coordinates and radius to location instructions
- SearchParams interface updated with latitude, longitude and radius_miles fields

### Known limitations
- Ticketmaster and Eventbrite still search by city name — full radius search coming in v3.4.0 part 2
- Closest-to-furthest sort not yet implemented — coming in v3.4.0
- Distance not shown on cards yet — coming in v3.4.0

## [3.3.0] - 2026-05-21

### Added
- Free text search field on homepage — works alongside activity grid
- Users can type anything specific e.g. "go karting", "baking class", "dinosaur workshop"
- Claude handles spelling mistakes and interprets intent naturally
- free_text field added to SearchRequest model (optional, defaults to null)
- Outsavvy developer account created — awaiting extended API access approval
- Activity grid expanded from 8 to 16 categories with subtitles
- New categories: Attractions, Animals, Play & Explore, Thrills & Challenges, Fairs & Festivals, Swimming, Music, Gaming, Learning, Community
- Category subtitles give context e.g. "Heritage, Galleries, Castles" under Museums
- FilterPanel extracted into its own component file

### Changed
- agent.py updated to accept and use free_text parameter
- SearchParams interface updated to include free_text field
- Improved no results handling — Claude returns empty array rather than padding with unrelated results
- Tighter category matching — Claude must only return genuinely matching results
- Venues/Events toggle order swapped — Venues shown first
- SearchSummary now uses searchParams directly instead of parsing Claude's summary string
- Ages display fixed on cards — no longer shows redundant "Ages All ages"
- Stale version references updated in comments

### Fixed
- Radio button conflict in FilterPanel when rendered in both sidebar and drawer
- Search summary pills overflow fixed
- Outdated image placeholder comments corrected

## [3.3.0] - 2026-05-21

### Added
- Free text search field on homepage — works alongside activity grid
- Users can type anything specific e.g. "go karting", "baking class", "dinosaur workshop"
- Claude handles spelling mistakes and interprets intent naturally
- free_text field added to SearchRequest model (optional, defaults to null)
- Outsavvy developer account created — awaiting extended API access approval

### Changed
- agent.py updated to accept and use free_text parameter
- SearchParams interface updated to include free_text field

## [3.2.0] - 2026-05-20

### Added
- Frontend refactored into smaller files:
  - src/types/index.ts — all TypeScript interfaces
  - src/components/EventCard.tsx — event card component
  - src/components/VenueCard.tsx — venue card component
  - src/components/StarRating.tsx — star rating component
  - src/components/SearchSummary.tsx — search summary pills component
- Backend refactored into smaller files:
  - routes/search.py — search and health check routes
  - models/requests.py — SearchRequest Pydantic model
  - utils/date_resolver.py — resolve_date function
  - main.py is now a thin app setup and CORS file
- Filter bar on results page:
  - Sidebar on desktop (sticky, always visible)
  - Bottom drawer on mobile (opened via Filters button)
  - Sort by — Recommended, Price low to high, Price high to low, Rating high to low
  - Cost filter — Any, Free only, Under £10, £10-£25, £25-£50, £50+
  - Filters apply instantly to results

### Changed
- Agent prompt updated with clear event vs venue classification rules
- Ticketed permanent attractions (London Eye, Madame Tussauds etc) now correctly classified as venues
- Filter button styled as primary orange for better visibility

### Fixed
- Radio button conflict when FilterPanel rendered twice (sidebar and drawer)

## [3.2.0] - 2026-05-20

### Changed
- Frontend refactored into smaller files:
  - src/types/index.ts — all TypeScript interfaces
  - src/components/EventCard.tsx — event card component
  - src/components/VenueCard.tsx — venue card component
  - src/components/StarRating.tsx — star rating component
  - src/components/SearchSummary.tsx — search summary pills component
  - Results.tsx and App.tsx are now thin orchestration files
- Backend refactored into smaller files:
  - routes/search.py — search and health check routes
  - models/requests.py — SearchRequest Pydantic model
  - utils/date_resolver.py — resolve_date function
  - main.py is now a thin app setup and CORS file

## [3.1.0] - 2026-05-20

### Added
- Structured JSON responses from agent replacing markdown output
- Separate Event and Venue card components with distinct layouts
- Cost badges — green for free, neutral for paid
- Star rating display on venue cards
- Keywords displayed as tag pills on each card
- Expandable descriptions — one sentence collapsed, full paragraph expanded
- Directions button on every card linking to Google Maps
- Book Now button on event cards, Visit Website button on venue cards
- Events / Venues / All toggle at top of results page
- Search summary displayed as styled pills at top of results page
- Activity pills have X button to remove and trigger a new search
- If all activities removed, user is returned to search page
- Empty state messages when a tab has no results
- Updating results indicator shown during re-search
- 16 frontend tests passing, 8 backend tests passing

### Changed
- Results page fully rebuilt — replaced markdown rendering with structured card components
- Agent now returns structured JSON instead of markdown text
- Backend search route returns JSON object directly instead of wrapping in result field
- App.tsx now passes searchParams alongside result to Results page for re-search support
- Page title changed to "Here's what you can do..."

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

