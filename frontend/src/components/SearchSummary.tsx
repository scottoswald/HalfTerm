import type { SearchParams } from '../types/index'

// ---- SEARCH SUMMARY COMPONENT ----
// Displays the search criteria as styled pills at the top of the results page
// Uses searchParams directly rather than parsing Claude's summary string
// This is more reliable since Claude's summary format can vary
// Activity pills have an X button to remove them and trigger a new search
// Other criteria (location, date, ages, budget) are display only for now
// X + dropdown swap for non-activity filters comes in v3.3.0

interface SearchSummaryProps {
  searchParams?: SearchParams
  onRemoveActivity: (activity: string) => void
}

function SearchSummary({ searchParams, onRemoveActivity }: SearchSummaryProps) {
  // Use searchParams directly for reliable field extraction
  // Falls back gracefully if searchParams not provided
  const activities = searchParams?.activities || []
  const location = searchParams?.location || ''
  const date = searchParams?.date || ''
  const ages = searchParams?.age_range || ''
  const budget = searchParams?.cost_range || ''
  const freeText = searchParams?.free_text || ''

  // Format the date for display — remove the resolved part in brackets if present
  // e.g. "today (Wednesday 21st May 2026)" becomes "today (Wednesday 21st May 2026)"
  // We show the full resolved date so users know exactly what was searched
  const displayDate = date

  // Format budget for display — capitalise first letter
  const displayBudget = budget
    ? budget.charAt(0).toUpperCase() + budget.slice(1)
    : ''

  // Format ages for display
  const displayAges = ages
    ? ages.charAt(0).toUpperCase() + ages.slice(1)
    : ''

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
                  {/* X button — removes this activity and triggers a new search */}
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

        {/* Free text row — only shown if user typed a specific search */}
        {freeText && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">
              Search
            </span>
            <span className="badge badge-outline">{freeText}</span>
          </div>
        )}

        {/* Location row — display only, no X until v3.3.0 */}
        {location && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">
              Where
            </span>
            <span className="badge badge-outline">{location}</span>
          </div>
        )}

        {/* Date row — display only */}
        {displayDate && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">
              When
            </span>
            <span className="badge badge-outline">{displayDate}</span>
          </div>
        )}

        {/* Ages row — display only */}
        {displayAges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">
              Ages
            </span>
            <span className="badge badge-outline">{displayAges}</span>
          </div>
        )}

        {/* Budget row — display only */}
        {displayBudget && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">
              Budget
            </span>
            <span className="badge badge-outline">{displayBudget}</span>
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchSummary
