import type { SearchResults } from '../types/index'

// ---- SEARCH SUMMARY COMPONENT ----
// Displays the search criteria as styled pills at the top of the results page
// Activity pills have an X button to remove them and trigger a new search
// Other criteria (location, date, ages, budget) are display only for now
// X + dropdown swap for non-activity filters comes in v3.2.0

interface SearchSummaryProps {
  data: SearchResults
  onRemoveActivity: (activity: string) => void
}

function SearchSummary({ data, onRemoveActivity }: SearchSummaryProps) {
  // Parse the search summary string into individual fields
  // Summary format: "Museums, Outdoor in London, Tuesday 20th May 2026, Ages all ages, Any budget"
  const inIndex = data.search_summary.indexOf(' in ')

  // Extract activities — everything before " in "
  const activitiesStr = inIndex > -1
    ? data.search_summary.substring(0, inIndex)
    : data.search_summary
  const activities = activitiesStr.split(',').map(s => s.trim()).filter(Boolean)

  // Extract remaining fields — everything after " in ", split by comma
  const afterIn = inIndex > -1 ? data.search_summary.substring(inIndex + 4) : ''
  const location = afterIn.split(',')[0]?.trim() || ''
  const date = afterIn.split(',')[1]?.trim() || ''
  const ages = afterIn.split(',')[2]?.trim() || ''
  const budget = afterIn.split(',')[3]?.trim() || ''

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
      <div className="card-body py-4 px-5 gap-2">

        {/* Activities row — pills have X button to remove and re-search */}
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

        {/* Location row — display only, no X until v3.2.0 */}
        {location && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Where</span>
            <span className="badge badge-outline">{location}</span>
          </div>
        )}

        {/* Date row — display only */}
        {date && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">When</span>
            <span className="badge badge-outline">{date}</span>
          </div>
        )}

        {/* Ages row — display only */}
        {ages && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Ages</span>
            <span className="badge badge-outline">{ages}</span>
          </div>
        )}

        {/* Budget row — display only */}
        {budget && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/50 w-36 shrink-0">Budget</span>
            <span className="badge badge-outline">{budget}</span>
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchSummary
