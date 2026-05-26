import { useState } from 'react'
import type { Event } from '../types'
import StarRating from './StarRating'

// ---- EVENT CARD COMPONENT ----
// Renders a single event card with expandable description
// Events are ticketed, time-specific activities e.g. workshops, shows, performances

interface EventCardProps {
  event: Event
}

// Generate initials from a name for the image fallback
// e.g. "Natural History Museum" -> "NHM", "Paddington Bear Experience" -> "PBE"
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(word => word.length > 2) // Skip short words like "at", "the", "of"
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('')
}

function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Show initials fallback if no image URL or image fails to load
  const showImage = event.image_url && !imageError

  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-3">

        {/* Card header — name, distance badge and cost badge */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="card-title text-lg leading-tight">{event.name}</h2>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {event.distance_miles !== undefined && (
              <span className="badge badge-outline badge-lg">
                {event.distance_miles < 0.1 ? 'Nearby' : `${event.distance_miles.toFixed(1)} mi`}
              </span>
            )}
            <span className={`badge badge-lg ${event.is_free ? 'badge-success' : 'badge-ghost'}`}>
              {event.cost}
            </span>
          </div>
        </div>

        {/* Image — real photo if available, initials fallback if not */}
        {showImage ? (
          <img
            src={event.image_url!}
            alt={event.name}
            className="w-full h-40 object-cover rounded-xl"
            onError={() => setImageError(true)}
          />
        ) : (
          // Initials fallback — shows abbreviated name in a styled placeholder
          <div className="w-full h-40 bg-base-200 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-black text-base-content/20">
              {getInitials(event.name)}
            </span>
          </div>
        )}

        {/* Key details grid */}
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

        {event.rating && <StarRating rating={event.rating} />}

        {event.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.keywords.map(keyword => (
              <span key={keyword} className="badge badge-outline badge-sm">{keyword}</span>
            ))}
          </div>
        )}

        <p className="text-sm text-base-content/80">
          {expanded ? event.expanded_description : event.description}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-sm self-center"
          aria-label={expanded ? 'Show less' : 'Show more'}
        >
          {expanded ? '▲ Show less' : '▼ Show more'}
        </button>

        <div className="flex gap-2 mt-1">
          <a
            href={event.directions_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm flex-1"
          >
            📍 Directions
          </a>
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
