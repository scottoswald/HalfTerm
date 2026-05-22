import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import type { SearchResults, SearchParams, Event, Venue } from './types'
import EventCard from './components/EventCard'
import VenueCard from './components/VenueCard'
import SearchSummary from './components/SearchSummary'
import FilterPanel from './components/FilterPanel'

// ---- RESULTS PAGE ----
// Thin orchestration layer — all card components live in src/components/
// Filter and sort logic lives here since it affects the whole page layout

// Helper to extract a numeric cost from a cost string for sorting
// e.g. "From £18" -> 18, "Free" -> 0, "Varies" -> 999
function parseCost(cost: string): number {
  if (!cost || cost.toLowerCase() === 'free') return 0
  const match = cost.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 999
}

// Helper to check if a result matches the selected cost filter
function matchesCostFilter(cost: string, filter: string): boolean {
  if (filter === 'any') return true
  const amount = parseCost(cost)
  if (filter === 'free') return amount === 0
  if (filter === 'under_10') return amount < 10
  if (filter === '10_25') return amount >= 10 && amount <= 25
  if (filter === '25_50') return amount >= 25 && amount <= 50
  if (filter === '50_plus') return amount >= 50
  return true
}

// ---- MAIN RESULTS PAGE ----
function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  // Get structured results and search params from App.tsx via React Router state
  const initialData = location.state?.result as SearchResults | undefined
  const initialSearchParams = location.state?.searchParams as SearchParams | undefined

  // Active tab — 'all', 'events' or 'venues'
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues'>('all')

  // Current results — updated when activities are removed via X button
  const [currentData, setCurrentData] = useState<SearchResults | undefined>(initialData)

  // Current search params — updated when activities are removed
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | undefined>(initialSearchParams)

  // Whether a re-search is in progress after removing an activity
  const [searching, setSearching] = useState(false)

  // Filter and sort state
  const [sortBy, setSortBy] = useState('recommended')
  const [costFilter, setCostFilter] = useState('any')

  // Whether the mobile filter drawer is open
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Apply sorting and cost filtering to events and venues
  // useMemo means this only recalculates when the data or filter values change
  const filteredEvents = useMemo(() => {
    if (!currentData) return []
    let results = currentData.events.filter(e => matchesCostFilter(e.cost, costFilter))
    if (sortBy === 'price_asc') results = [...results].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    if (sortBy === 'price_desc') results = [...results].sort((a, b) => parseCost(b.cost) - parseCost(a.cost))
    if (sortBy === 'rating_desc') results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return results
  }, [currentData, sortBy, costFilter])

  const filteredVenues = useMemo(() => {
    if (!currentData) return []
    let results = currentData.venues.filter(v => matchesCostFilter(v.cost, costFilter))
    if (sortBy === 'price_asc') results = [...results].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    if (sortBy === 'price_desc') results = [...results].sort((a, b) => parseCost(b.cost) - parseCost(a.cost))
    if (sortBy === 'rating_desc') results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return results
  }, [currentData, sortBy, costFilter])

  // Handle removing an activity pill and re-searching with remaining activities
  const handleRemoveActivity = async (activityToRemove: string) => {
    if (!currentSearchParams) return

    const newActivities = currentSearchParams.activities.filter(a => a !== activityToRemove)

    // If no activities remain go back to search page
    if (newActivities.length === 0) {
      navigate('/')
      return
    }

    setSearching(true)
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentSearchParams, activities: newActivities }),
      })
      const newData = await response.json()
      setCurrentData(newData)
      const newParams = { ...currentSearchParams, activities: newActivities }
      setCurrentSearchParams(newParams)
      navigate('/results', {
        state: { result: newData, searchParams: newParams },
        replace: true,
      })
    } catch (error) {
      console.error('Re-search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  // Error state — no data or backend error
  if (!currentData || currentData.error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-black text-primary mb-4">Halfterm</h1>
          <p className="text-base-content/70 mb-6">
            {currentData?.error || 'Sorry, something went wrong. Please try again.'}
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            ← Back to search
          </button>
        </div>
      </div>
    )
  }

  const showEvents = activeTab === 'all' || activeTab === 'events'
  const showVenues = activeTab === 'all' || activeTab === 'venues'

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary mb-1">Halfterm</h1>
          <h2 className="text-xl font-semibold text-base-content mb-1">
            Here's what you can do...
          </h2>
        </div>

        {/* Search summary pills */}
        <SearchSummary
          searchParams={currentSearchParams}
          onRemoveActivity={handleRemoveActivity}
        />

        {/* Updating results indicator */}
        {searching && (
          <p className="text-sm text-base-content/40 animate-pulse text-center mb-4">
            Updating results...
          </p>
        )}

        {/* Top controls — update search left, venues/events toggle centre, filter button right (mobile only) */}
        <div className="flex items-center justify-between mb-6 gap-2">

          {/* Update search button */}
          <button onClick={() => navigate('/')} className="btn btn-outline btn-sm">
            ← Update search
          </button>

          {/* Events / Venues / All toggle */}
          <div className="join">
            <button
              className={`join-item btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'venues' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('venues')}
            >
              Venues
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>

          {/* Filter button — mobile only, opens bottom drawer */}
          {/* lg:hidden means this button is hidden on large screens where the sidebar is visible */}
          <button
            className="btn btn-primary btn-sm lg:hidden"
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filters
          </button>

        </div>

        {/* Main content — sidebar layout on desktop, single column on mobile */}
        {/* lg:grid-cols-[240px_1fr] means sidebar is 240px wide on large screens */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">

          {/* ---- SIDEBAR FILTERS (desktop only) ---- */}
          {/* hidden lg:block means hidden on mobile, visible on large screens */}
          <aside className="hidden lg:block">
            <div className="card bg-base-100 shadow-sm border border-base-200 sticky top-6">
              <div className="card-body py-5 px-5">
                <h2 className="font-bold text-base mb-4">Filters</h2>
                <FilterPanel
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    costFilter={costFilter}
                    setCostFilter={setCostFilter}
                    namePrefix="sidebar-"
                />
              </div>
            </div>
          </aside>

          {/* ---- RESULTS COLUMN ---- */}
          <div className="flex flex-col gap-4">

            {/* Venues section */}
            {showVenues && filteredVenues.length > 0 && (
              <>
                {activeTab === 'all' && (
                  <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide mt-2">
                    Venues
                  </h3>
                )}
                {filteredVenues.map((venue: Venue, index: number) => (
                  <VenueCard key={index} venue={venue} />
                ))}
              </>
            )}

            {/* Events section */}
            {showEvents && filteredEvents.length > 0 && (
              <>
                {activeTab === 'all' && (
                  <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide">
                    Events
                  </h3>
                )}
                {filteredEvents.map((event: Event, index: number) => (
                  <EventCard key={index} event={event} />
                ))}
              </>
            )}

            {/* Empty states */}
            {showEvents && filteredEvents.length === 0 && activeTab === 'events' && (
              <div className="text-center py-12 text-base-content/50">
                No events match your filters. Try adjusting the cost filter.
              </div>
            )}

            {showVenues && filteredVenues.length === 0 && activeTab === 'venues' && (
              <div className="text-center py-12 text-base-content/50">
                No venues match your filters. Try adjusting the cost filter.
              </div>
            )}

          </div>
        </div>

        {/* Bottom update search button */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="btn btn-outline">
            ← Update search
          </button>
        </div>

      </div>

      {/* ---- MOBILE FILTER DRAWER ---- */}
      {/* Bottom sheet that slides up on mobile when Filters button is tapped */}
      {filterDrawerOpen && (
        <>
          {/* Dark overlay behind the drawer — clicking it closes the drawer */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setFilterDrawerOpen(false)}
          />
          {/* The drawer itself — slides up from the bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-2xl z-50 p-6 lg:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Filters</h2>
              {/* Close button */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFilterDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <FilterPanel
              sortBy={sortBy}
              setSortBy={setSortBy}
              costFilter={costFilter}
              setCostFilter={setCostFilter}
              namePrefix="drawer-"
            />
            {/* Apply button closes the drawer */}
            <button
              className="btn btn-primary btn-block mt-6"
              onClick={() => setFilterDrawerOpen(false)}
            >
              Apply filters
            </button>
          </div>
        </>
      )}

    </div>
  )
}

export default Results
