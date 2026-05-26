import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import type { SearchResults, SearchParams, Event, Venue } from './types'
import EventCard from './components/EventCard'
import VenueCard from './components/VenueCard'
import SearchSummary from './components/SearchSummary'
import FilterPanel from './components/FilterPanel'

// ---- RESULTS PAGE ----
// Thin orchestration layer — all card components live in src/components/

// ---- HAVERSINE DISTANCE FORMULA ----
// Calculates the distance in miles between two GPS coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Helper to extract a numeric cost for sorting
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

  const initialData = location.state?.result as SearchResults | undefined
  const initialSearchParams = location.state?.searchParams as SearchParams | undefined

  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues'>('all')
  const [currentData, setCurrentData] = useState<SearchResults | undefined>(initialData)
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | undefined>(initialSearchParams)
  const [searching, setSearching] = useState(false)
  const [sortBy, setSortBy] = useState('recommended')
  const [costFilter, setCostFilter] = useState('any')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const hasCoordinates = !!(currentSearchParams?.latitude && currentSearchParams?.longitude)

  // Add distance_miles to each result using Haversine formula
  const eventsWithDistance = useMemo(() => {
    if (!currentData) return []
    return currentData.events.map(event => {
      if (
        hasCoordinates &&
        event.latitude != null &&
        event.longitude != null &&
        currentSearchParams?.latitude != null &&
        currentSearchParams?.longitude != null
      ) {
        return {
          ...event,
          distance_miles: haversineDistance(
            currentSearchParams.latitude,
            currentSearchParams.longitude,
            event.latitude,
            event.longitude
          )
        }
      }
      return event
    })
  }, [currentData, currentSearchParams, hasCoordinates])

  const venuesWithDistance = useMemo(() => {
    if (!currentData) return []
    return currentData.venues.map(venue => {
      if (
        hasCoordinates &&
        venue.latitude != null &&
        venue.longitude != null &&
        currentSearchParams?.latitude != null &&
        currentSearchParams?.longitude != null
      ) {
        return {
          ...venue,
          distance_miles: haversineDistance(
            currentSearchParams.latitude,
            currentSearchParams.longitude,
            venue.latitude,
            venue.longitude
          )
        }
      }
      return venue
    })
  }, [currentData, currentSearchParams, hasCoordinates])

  // Apply cost filtering and sorting
  const filteredEvents = useMemo(() => {
    let results = eventsWithDistance.filter(e => matchesCostFilter(e.cost, costFilter))
    if (sortBy === 'price_asc') results = [...results].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    if (sortBy === 'price_desc') results = [...results].sort((a, b) => parseCost(b.cost) - parseCost(a.cost))
    if (sortBy === 'rating_desc') results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'distance_asc') results = [...results].sort((a, b) => (a.distance_miles ?? 999) - (b.distance_miles ?? 999))
    return results
  }, [eventsWithDistance, sortBy, costFilter])

  const filteredVenues = useMemo(() => {
    let results = venuesWithDistance.filter(v => matchesCostFilter(v.cost, costFilter))
    if (sortBy === 'price_asc') results = [...results].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    if (sortBy === 'price_desc') results = [...results].sort((a, b) => parseCost(b.cost) - parseCost(a.cost))
    if (sortBy === 'rating_desc') results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'distance_asc') results = [...results].sort((a, b) => (a.distance_miles ?? 999) - (b.distance_miles ?? 999))
    return results
  }, [venuesWithDistance, sortBy, costFilter])

  // Handle removing an activity pill and re-searching
  const handleRemoveActivity = async (activityToRemove: string) => {
    if (!currentSearchParams) return
    const newActivities = currentSearchParams.activities.filter(a => a !== activityToRemove)
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

  // Error state
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

        {/* Extended search notice — shown when Claude went beyond the requested radius */}
        {/* Uses a soft info style so it's visible but not alarming */}
        {currentData.search_extended && currentData.search_extended_message && (
          <div className="alert alert-info mb-4 text-sm">
            <span>ℹ️ {currentData.search_extended_message}</span>
          </div>
        )}

        {/* Updating results indicator */}
        {searching && (
          <p className="text-sm text-base-content/40 animate-pulse text-center mb-4">
            Updating results...
          </p>
        )}

        {/* Top controls */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <button onClick={() => navigate('/')} className="btn btn-outline btn-sm">
            ← Update search
          </button>

          {/* Venues / Events / All toggle */}
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

          {/* Filter button — mobile only */}
          <button
            className="btn btn-primary btn-sm lg:hidden"
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filters
          </button>
        </div>

        {/* Main content — sidebar on desktop, single column on mobile */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">

          {/* Sidebar filters — desktop only */}
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
                  hasCoordinates={hasCoordinates}
                />
              </div>
            </div>
          </aside>

          {/* Results column */}
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

      {/* Mobile filter drawer */}
      {filterDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-2xl z-50 p-6 lg:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Filters</h2>
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
              hasCoordinates={hasCoordinates}
            />
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
