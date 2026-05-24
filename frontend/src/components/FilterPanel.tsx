// ---- FILTER PANEL COMPONENT ----
// Renders the sort and cost filter controls
// Used in two places in Results.tsx:
// 1. The sticky sidebar on desktop (always visible)
// 2. The bottom drawer on mobile (opened via the Filters button)
// namePrefix ensures radio button groups don't conflict when rendered twice
// e.g. sidebar uses "sidebar-sort" and drawer uses "drawer-sort"

// Sort options available in the filter panel
// "Closest first" is only enabled when the user has provided coordinates
const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
  { label: 'Rating: high to low', value: 'rating_desc' },
  { label: 'Closest first', value: 'distance_asc' },
]

// Cost filter options available in the filter panel
const COST_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Free only', value: 'free' },
  { label: 'Under £10', value: 'under_10' },
  { label: '£10 - £25', value: '10_25' },
  { label: '£25 - £50', value: '25_50' },
  { label: '£50+', value: '50_plus' },
]

interface FilterPanelProps {
  sortBy: string
  setSortBy: (value: string) => void
  costFilter: string
  setCostFilter: (value: string) => void
  // namePrefix prevents radio button conflicts when FilterPanel is rendered twice
  namePrefix?: string
  // hasCoordinates controls whether "Closest first" is enabled
  // It's greyed out when no location coordinates are available
  hasCoordinates?: boolean
}

function FilterPanel({ sortBy, setSortBy, costFilter, setCostFilter, namePrefix = '', hasCoordinates = false }: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* Sort by section */}
      <div>
        <h3 className="font-semibold text-sm text-base-content mb-3">Sort by</h3>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map(option => {
            // "Closest first" is disabled when no coordinates are available
            const isDisabled = option.value === 'distance_asc' && !hasCoordinates
            return (
              <label
                key={option.value}
                className={`flex items-center gap-2 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Radio input — namePrefix ensures uniqueness across sidebar and drawer */}
                <input
                  type="radio"
                  name={`${namePrefix}sort`}
                  className="radio radio-primary radio-sm"
                  checked={sortBy === option.value}
                  onChange={() => !isDisabled && setSortBy(option.value)}
                  disabled={isDisabled}
                />
                <span className="text-sm">
                  {option.label}
                  {/* Show hint when closest first is disabled */}
                  {isDisabled && (
                    <span className="text-xs text-base-content/40 ml-1">
                      (use current location or postcode)
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="divider my-0" />

      {/* Cost filter section */}
      <div>
        <h3 className="font-semibold text-sm text-base-content mb-3">Cost</h3>
        <div className="flex flex-col gap-2">
          {COST_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              {/* Radio input — namePrefix ensures uniqueness across sidebar and drawer */}
              <input
                type="radio"
                name={`${namePrefix}cost`}
                className="radio radio-primary radio-sm"
                checked={costFilter === option.value}
                onChange={() => setCostFilter(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  )
}

export default FilterPanel
