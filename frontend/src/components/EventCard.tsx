import { useState } from 'react'
import type { Event } from '../types'
import StarRating from './StarRating'

// ---- EVENT CARD COMPONENT ----
// Renders a single event card with expandable description
// Events are ticketed, time-specific activities e.g. workshops, shows, performances
// Distinct from venues which are permanent places families can visit

interface EventCardProps {
  event: Event
}

function EventCard({ event }: EventCardProps) {
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

        {/* Placeholder image — real images coming in a future version */}
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
            <span className="text-base-content/70">{event.age_range}</span>
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

export default EventCard
