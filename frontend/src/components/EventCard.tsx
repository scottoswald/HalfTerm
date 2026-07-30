import { useState } from 'react'
import type { Event } from '../types'
import StarRating from './StarRating'
import { getInitials } from './cardUtils'

interface EventCardProps {
  event: Event
}

function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)

  const costBadge = () => {
    if (event.is_free || event.cost?.toLowerCase() === 'free') {
      return (
        <span className="badge text-xs font-bold px-3 py-2 bg-success text-success-content border-0">
          Free
        </span>
      )
    }
    return (
      <span className="badge badge-outline text-xs font-semibold px-3 py-2">
        {event.cost}
      </span>
    )
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 border-l-[6px] border-l-[#D42B2B] overflow-hidden">
      <div className="card-body p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-lg leading-tight">{event.name}</h3>
          {costBadge()}
        </div>

        {/* Image */}
        {event.image_url ? (
          <div className="w-full h-48 rounded-lg overflow-hidden mb-3 bg-base-200">
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg mb-3 bg-base-200 flex items-center justify-center">
            <span className="text-4xl font-black text-base-content/20">{getInitials(event.name)}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70 mb-3">
          {event.location && (
            <span className="flex items-center gap-1">
              <span>📍</span> {event.location}
            </span>
          )}
          {event.date && (
            <span className="flex items-center gap-1">
              <span>📅</span> {event.date}
            </span>
          )}
          {event.time && (
            <span className="flex items-center gap-1">
              <span>🕐</span> {event.time}
            </span>
          )}
        </div>

        {/* Age, distance and rating */}
        <div className="flex items-center gap-3 mb-3">
          {event.age_range && (
            <span className="text-sm flex items-center gap-1">
              <span>👶</span> {event.age_range}
            </span>
          )}
          {event.distance_miles !== undefined && (
            <span className="badge badge-outline text-xs">
              {event.distance_miles.toFixed(1)} mi
            </span>
          )}
          {event.rating && <StarRating rating={event.rating} />}
        </div>

        {/* Keywords */}
        {event.keywords && event.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.keywords.map((kw, i) => (
              <span key={i} className="badge badge-outline badge-sm text-xs">{kw}</span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-base-content/80 mb-1">{event.description}</p>

        {/* Expanded description */}
        {expanded && event.expanded_description && (
          <p className="text-sm text-base-content/70 mt-2 mb-1">{event.expanded_description}</p>
        )}

        {/* Show more toggle */}
        {event.expanded_description && (
          <button
            className="text-sm text-primary font-semibold mt-1 mb-3 text-left hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Show less' : '▼ Show more'}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          {event.directions_url && (
            <a
              href={event.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm flex-1"
            >
              📍 Directions
            </a>
          )}
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
