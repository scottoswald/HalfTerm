import { useState } from 'react'
import type { Venue } from '../types'
import StarRating from './StarRating'
import { getInitials } from './cardUtils'

interface VenueCardProps {
  venue: Venue
}

function VenueCard({ venue }: VenueCardProps) {
  const [expanded, setExpanded] = useState(false)

  const costBadge = () => {
    if (venue.is_free || venue.cost?.toLowerCase() === 'free') {
      return (
        <span className="badge text-xs font-bold px-3 py-2 bg-success text-success-content border-0">
          Free
        </span>
      )
    }
    return (
      <span className="badge badge-outline text-xs font-semibold px-3 py-2">
        {venue.cost}
      </span>
    )
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 border-l-[6px] border-l-[#1A4FBF] overflow-hidden">
      <div className="card-body p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-lg leading-tight">{venue.name}</h3>
          {costBadge()}
        </div>

        {/* Image */}
        {venue.image_url ? (
          <div className="w-full h-48 rounded-lg overflow-hidden mb-3 bg-base-200">
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg mb-3 bg-base-200 flex items-center justify-center">
            <span className="text-4xl font-black text-base-content/20">{getInitials(venue.name)}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70 mb-3">
          {venue.location && (
            <span className="flex items-center gap-1">
              <span>📍</span> {venue.location}
            </span>
          )}
          {venue.opening_times && (
            <span className="flex items-center gap-1">
              <span>🕐</span> {venue.opening_times}
            </span>
          )}
        </div>

        {/* Age and rating */}
        <div className="flex items-center gap-3 mb-3">
          {venue.age_range && (
            <span className="text-sm flex items-center gap-1">
              <span>👶</span> {venue.age_range}
            </span>
          )}
          {venue.distance_miles !== undefined && (
            <span className="badge badge-outline text-xs">
              {venue.distance_miles.toFixed(1)} mi
            </span>
          )}
          {venue.rating && <StarRating rating={venue.rating} />}
        </div>

        {/* Keywords */}
        {venue.keywords && venue.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {venue.keywords.map((kw, i) => (
              <span key={i} className="badge badge-outline badge-sm text-xs">{kw}</span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-base-content/80 mb-1">{venue.description}</p>

        {/* Expanded description */}
        {expanded && venue.expanded_description && (
          <p className="text-sm text-base-content/70 mt-2 mb-1">{venue.expanded_description}</p>
        )}

        {/* Show more toggle */}
        {venue.expanded_description && (
          <button
            className="text-sm text-primary font-semibold mt-1 mb-3 text-left hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Show less' : '▼ Show more'}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          {venue.directions_url && (
            <a
              href={venue.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm flex-1"
            >
              📍 Directions
            </a>
          )}
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

export default VenueCard
