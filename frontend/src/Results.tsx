import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// ---- TYPE DEFINITIONS ----
// These define the shape of the data we receive from the backend
// TypeScript uses these to catch errors at compile time

interface Event {
  type: 'event'
  name: string
  image_url: string | null
  location: string
  date: string
  time: string
  age_range: string
  cost: string
  is_free: boolean
  categories: string[]
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  booking_url: string | null
  directions_url: string
}

interface Venue {
  type: 'venue'
  name: string
  image_url: string | null
  location: string
  opening_times: string
  age_range: string
  cost: string
  is_free: boolean
  categories: string[]
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  website_url: string | null
  directions_url: string
}

interface SearchResults {
  search_summary: string
  events: Event[]
  venues: Venue[]
  error?: string
}

// ---- STAR RATING COMPONENT ----
// Renders a star rating visually e.g. ★★★★½ for 4.5
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <span className="text-warning text-sm">
      {'★'.repeat(fullStars)}
      {hasHalf ? '½' : ''}
      {'☆'.repeat(emptyStars)}
      <span className="text-base-content/60 ml-1">{rating}</span>
    </span>
  )
}

// ---- EVENT CARD COMPONENT ----
// Renders a single event card with expandable description
function EventCard({ event }: { event: Event }) {
  // Track whether this card is expanded or collapsed
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-3">

        {/* Card header — name and cost badge */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="card-title text-lg leading-tight">{event.name}</h2>
          {/* Cost badge — green for free, neutral for paid */}
          <span className={`badge badge-lg shrink-0 ${event.is_free ? 'badge-success' : 'badge-ghost'}`}>
            {event.cost}
          </span>
        </div>

        {/* Placeholder image — replaced with real images in v3.2.0 */}
        <div className="w-full h-40 bg-base-200 rounded-xl flex items-center justify-center">
          <span className="text-base-content/30 text-sm">📷 Image coming soon</span>
        </div>

        {/* Key details grid — location left, date/time right */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex items-start gap-1">
            <span>📍</span>
            <span className="text-base-content/70">{event.location}</span>
          </div>
          <div className="flex items-start gap-1">
            <span>📅</span>
            <span className="text-base-content/70">{event.date}</span>
          </div>
          <div className="flex items-start gap-1">
            <span>👶</span>
            <span className="text-base-content/70">Ages {event.age_range}</span>
          </div>
          <div className="flex items-start gap-1">
            <span>🕐</span>
            <span className="text-base-content/70">{event.time}</span>
          </div>
        </div>

        {/* Star rating if available */}
        {event.rating && <StarRating rating={event.rating} />}

        {/* Keywords — small tag pills */}
        {event.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.keywords.map(keyword => (
              <span key={keyword} className="badge badge-outline badge-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Description — one sentence collapsed, full paragraph expanded */}
        <p className="text-sm text-base-content/80">
          {expanded ? event.expanded_description : event.description}
        </p>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-sm self-center"
          aria-label={expanded ? 'Show less' : 'Show more'}
        >
          {expanded ? '▲ Show less' : '▼ Show more'}
        </button>

        {/* Action buttons — directions and booking */}
        {/* Opens in a new tab so the user doesn't lose their results */}
        <div className="flex gap-2 mt-1">
          <a
            href={event.directions_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm flex-1"
          >
            📍 Directions
          </a>
          {/* Only show booking button if a booking URL exists */}
          {event.booking_url && (
            <a
              href={event.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm flex-1"
            >
              Book Now →
            </a>
          )}
        </div>

      </div>
    </div>
  )
}

// ---- VENUE CARD COMPONENT ----
// Renders a single venue card with expandable description
function VenueCard({ venue }: { venue: Venue }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-3">

        {/* Card header — name and cost badge */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="card-title text-lg leading-tight">{venue.name}</h2>
          <span className={`badge badge-lg shrink-0 ${venue.is_free ? 'badge-success' : 'badge-ghost'}`}>
            {venue.cost}
          </span>
        </div>

        {/* Placeholder image — replaced with real images in v3.2.0 */}
        <div className="w-full h-40 bg-base-200 rounded-xl flex items-center justify-center">
          <span className="text-base-content/30 text-sm">📷 Image coming soon</span>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex items-start gap-1">
            <span>📍</span>
            <span className="text-base-content/70">{venue.location}</span>
          </div>
          <div className="flex items-start gap-1">
            <span>🕐</span>
            <span className="text-base-content/70">{venue.opening_times}</span>
          </div>
          <div className="flex items-start gap-1">
            <span>👶</span>
            <span className="text-base-content/70">Ages {venue.age_range}</span>
          </div>
        </div>

        {/* Star rating if available */}
        {venue.rating && <StarRating rating={venue.rating} />}

        {/* Keywords */}
        {venue.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {venue.keywords.map(keyword => (
              <span key={keyword} className="badge badge-outline badge-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-base-content/80">
          {expanded ? venue.expanded_description : venue.description}
        </p>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-sm self-center"
          aria-label={expanded ? 'Show less' : 'Show more'}
        >
          {expanded ? '▲ Show less' : '▼ Show more'}
        </button>

        {/* Action buttons — directions and website */}
        {/* Opens in a new tab so the user doesn't lose their results */}
        <div className="flex gap-2 mt-1">
          <a
            href={venue.directions_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm flex-1"
          >
            📍 Directions
          </a>
          {/* Only show website button if a website URL exists */}
          {venue.website_url && (
            <a
              href={venue.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm flex-1"
            >
              Visit Website →
            </a>
          )}
        </div>

      </div>
    </div>
  )
}

// ---- MAIN RESULTS PAGE ----
function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  // Get the structured results passed from App.tsx via React Router state
  const data = location.state?.result as SearchResults | undefined

  // Active tab — 'all', 'events' or 'venues'
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues'>('all')

  // Handle error state — either a backend error or no data at all
  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-black text-primary mb-4">Halfterm</h1>
          <p className="text-base-content/70 mb-6">
            {data?.error || 'Sorry, something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            ← Back to search
          </button>
        </div>
      </div>
    )
  }

  // Decide which results to show based on active tab
  const showEvents = activeTab === 'all' || activeTab === 'events'
  const showVenues = activeTab === 'all' || activeTab === 'venues'

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary mb-1">Halfterm</h1>
          <h2 className="text-xl font-semibold text-base-content mb-1">
            Here's what you can do...
          </h2>
          {/* Search summary — shows what was searched */}
          <p className="text-sm text-base-content/60">{data.search_summary}</p>
        </div>

        {/* Top controls — update search left, events/venues toggle centre */}
        <div className="flex items-center justify-between mb-6 gap-2">

          {/* Update search button — takes user back to the homepage */}
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline btn-sm"
          >
            ← Update search
          </button>

          {/* Events / Venues toggle — filters which card type is shown */}
          <div className="join">
            <button
              className={`join-item btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'venues' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('venues')}
            >
              Venues
            </button>
          </div>

        </div>

        {/* Results — events first then venues */}
        <div className="flex flex-col gap-4">

          {/* Events section */}
          {showEvents && data.events.length > 0 && (
            <>
              {/* Section label — only shown in 'all' tab */}
              {activeTab === 'all' && (
                <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide">
                  Events
                </h3>
              )}
              {data.events.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </>
          )}

          {/* Venues section */}
          {showVenues && data.venues.length > 0 && (
            <>
              {/* Section label — only shown in 'all' tab */}
              {activeTab === 'all' && (
                <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide mt-2">
                  Venues
                </h3>
              )}
              {data.venues.map((venue, index) => (
                <VenueCard key={index} venue={venue} />
              ))}
            </>
          )}

          {/* Empty states — shown when a tab has no results */}
          {showEvents && data.events.length === 0 && activeTab === 'events' && (
            <div className="text-center py-12 text-base-content/50">
              No events found for your search. Try updating your search criteria.
            </div>
          )}

          {showVenues && data.venues.length === 0 && activeTab === 'venues' && (
            <div className="text-center py-12 text-base-content/50">
              No venues found for your search. Try updating your search criteria.
            </div>
          )}

        </div>

        {/* Bottom update search button — so user doesn't have to scroll back up */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            ← Update search
          </button>
        </div>

      </div>
    </div>
  )
}

export default Results
