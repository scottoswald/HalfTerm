import type { SearchParams } from '../types/index'

// ---- SEARCH SUMMARY COMPONENT ----
// Displays the search criteria as styled pills at the top of the results page
// Uses searchParams directly rather than parsing Claude's summary string
// Activity pills have an X button to remove them and trigger a new search
// Other criteria are display only for now

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

  // Show the full resolved date so users know exactly what was searched (and making the first letter capitalised)
  const displayDate = date ? date.charAt(0).toUpperCase() + date.slice(1) : ''

  // Capitalise first letter for display
  const displayBudget = budget ? budget.charAt(0).toUpperCase() + budget.slice(1) : ''
  const displayAges = ages ? ages.charAt(0).toUpperCase() + ages.slice(1) : ''

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
      <div className="card-body py-4 px-5 gap-2">

        {/* Activities row — pills have X button to remove and re-search */}
        {activities.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0 pt-1">
              What
            </span>
            <div className="flex flex-wrap gap-1">
              {activities.map(activity => (
                <span key={activity} className="badge badge-outline gap-1">
                  {activity}
                  <button
                    onClick={() => onRemoveActivity(activity)}
                    className="text-base-content/40 hover:text-error ml-1"
                    aria-label={`Remove ${activity}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience row — shows selected vibes using their short label */}
        {/* Display only — no X button for now */}
        {vibes.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0 pt-1">
              Experience
            </span>
            <div className="flex flex-wrap gap-1">
              {vibes.map(vibe => (
                <span key={vibe.value} className="badge badge-outline badge-secondary gap-1">
                  {vibe.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Free text row */}
        {freeText && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Search</span>
            <span className="badge badge-outline">{freeText}</span>
          </div>
        )}

        {/* Location row */}
        {location && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Where</span>
            <span className="badge badge-outline">{location}</span>
          </div>
        )}

        {/* Date row */}
        {displayDate && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">When</span>
            <span className="badge badge-outline">{displayDate}</span>
          </div>
        )}

        {/* Ages row */}
        {displayAges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Ages</span>
            <span className="badge badge-outline">{displayAges}</span>
          </div>
        )}

        {/* Budget row */}
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
