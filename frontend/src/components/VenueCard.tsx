import { useState } from 'react'
import type { Venue } from '../types'
import StarRating from './StarRating'

// ---- VENUE CARD COMPONENT ----
// Renders a single venue card with expandable description
// Venues are permanent places families can visit e.g. museums, parks, zoos
// Distinct from events which are time-specific ticketed activities

interface VenueCardProps {
  venue: Venue
}

function VenueCard({ venue }: VenueCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-3">

        {/* Card header — name and cost badge */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="card-title text-lg leading-tight">{venue.name}</h2>
          {/* Cost badge — green for free, neutral for paid */}
          <span className={`badge badge-lg shrink-0 ${venue.is_free ? 'badge-success' : 'badge-ghost'}`}>
            {venue.cost}
          </span>
        </div>

        {/* Placeholder image — real images coming in a future version */}
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
            <span className="text-base-content/70">{venue.age_range}</span>
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

        {/* Description — one sentence collapsed, full paragraph expanded */}
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

export default VenueCard
