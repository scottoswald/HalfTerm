import type { SearchParams } from '../types/index'

// ---- SEARCH SUMMARY COMPONENT ----
// Displays the search criteria as styled pills at the top of the results page

interface SearchSummaryProps {
  searchParams?: SearchParams
  onRemoveActivity: (activity: string) => void
}

function SearchSummary({ searchParams, onRemoveActivity }: SearchSummaryProps) {
  const activities = searchParams?.activities || []
  const vibes = searchParams?.vibes || []
  const location = searchParams?.location || ''
  const date = searchParams?.date || ''
  const ages = searchParams?.age_range || ''
  const budget = searchParams?.cost_range || ''
  const freeText = searchParams?.free_text || ''
  const duration = searchParams?.duration || ''
  const timeOfDay = searchParams?.time_of_day || ''

    // Show the full resolved date so users know exactly what was searched (and making the first letter capitalised)
  const displayDate = date ? date.charAt(0).toUpperCase() + date.slice(1) : ''

    // Capitalise first letter for display
  const displayBudget = budget ? budget.charAt(0).toUpperCase() + budget.slice(1) : ''
  const displayAges = ages ? ages.charAt(0).toUpperCase() + ages.slice(1) : ''
  const displayDuration = duration ? duration.charAt(0).toUpperCase() + duration.slice(1) : ''
  const displayTimeOfDay = timeOfDay ? timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1) : ''

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
      <div className="card-body py-4 px-5 gap-2">

        {/* Activities */}
        {activities.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0 pt-1">What</span>
            <div className="flex flex-wrap gap-1">
              {activities.map(activity => (
                <span key={activity} className="badge badge-outline gap-1">
                  {activity.charAt(0).toUpperCase() + activity.slice(1)}
                  <button onClick={() => onRemoveActivity(activity)}
                    className="text-base-content/40 hover:text-error ml-1"
                    aria-label={`Remove ${activity}`}>✕</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience vibes */}
        {vibes.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0 pt-1">Experience</span>
            <div className="flex flex-wrap gap-1">
              {vibes.map(vibe => (
                <span key={vibe.value} className="badge badge-outline badge-secondary gap-1">
                  {vibe.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Free text */}
        {freeText && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Search</span>
            <span className="badge badge-outline">{freeText}</span>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Where</span>
            <span className="badge badge-outline">{location}</span>
          </div>
        )}

        {/* Date */}
        {displayDate && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">When</span>
            <span className="badge badge-outline">{displayDate}</span>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">How long</span>
            <span className="badge badge-outline">{displayDuration}</span>
          </div>
        )}

        {/* Time of day */}
        {timeOfDay && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Time</span>
            <span className="badge badge-outline">{displayTimeOfDay}</span>
          </div>
        )}

        {/* Ages */}
        {displayAges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Ages</span>
            <span className="badge badge-outline">{displayAges}</span>
          </div>
        )}

        {/* Budget */}
        {displayBudget && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Budget</span>
            <span className="badge badge-outline">{displayBudget}</span>
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchSummary
