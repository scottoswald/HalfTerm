import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import type { SearchResults, SearchParams, Event, Venue } from './types'
import EventCard from './components/EventCard'
import VenueCard from './components/VenueCard'
import SearchSummary from './components/SearchSummary'
import FilterPanel from './components/FilterPanel'
import SkeletonCard from './components/SkeletonCard'
import 'leaflet/dist/leaflet.css'
import FeedbackBanner from './components/FeedbackBanner'

const MapView = lazy(() => import('./components/MapView'))

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function parseCost(cost: string): number {
  if (!cost || cost.toLowerCase() === 'free') return 0
  const match = cost.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 999
}

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

// Number of results shown initially before "Show more" is clicked
const INITIAL_RESULTS_COUNT = 3

function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  const initialData = location.state?.result as SearchResults | undefined
  const initialSearchParams = location.state?.searchParams as SearchParams | undefined
  const isLoadingMode = location.state?.loading as boolean | undefined

  const [currentSearchParams] = useState<SearchParams | undefined>(initialSearchParams)

  const [venues, setVenues] = useState<Venue[]>(initialData?.venues || [])
  const [events, setEvents] = useState<Event[]>(initialData?.events || [])
  const [searchExtended, setSearchExtended] = useState(initialData?.search_extended || false)
  const [searchExtendedMessage, setSearchExtendedMessage] = useState(initialData?.search_extended_message || '')
  const [error, setError] = useState(initialData?.error || '')

  const [venuesLoading, setVenuesLoading] = useState(!!isLoadingMode)
  const [eventsLoading, setEventsLoading] = useState(!!isLoadingMode)

  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues'>('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [costFilter, setCostFilter] = useState('any')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searching, setSearching] = useState(false)

  // Show more state — tracks whether venues/events are expanded
  const [venuesExpanded, setVenuesExpanded] = useState(false)
  const [eventsExpanded, setEventsExpanded] = useState(false)

  const hasCoordinates = !!(currentSearchParams?.latitude && currentSearchParams?.longitude)

  // ---- TWO-STAGE SEARCH ----
  useEffect(() => {
    if (!isLoadingMode || !currentSearchParams) return

    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const body = JSON.stringify(currentSearchParams)
    const headers = { 'Content-Type': 'application/json' }

    fetch(`${apiUrl}/search/venues`, { method: 'POST', headers, body })
      .then(r => r.json())
      .then(data => {
        setVenues(data.venues || [])
        if (data.search_extended) setSearchExtended(true)
        if (data.search_extended_message) setSearchExtendedMessage(data.search_extended_message)
        if (data.error) setError(data.error)
        setVenuesLoading(false)
      })
      .catch(err => { console.error('Venues search failed:', err); setVenuesLoading(false) })

    fetch(`${apiUrl}/search/events`, { method: 'POST', headers, body })
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || [])
        if (data.search_extended) setSearchExtended(true)
        if (data.search_extended_message) setSearchExtendedMessage(data.search_extended_message)
        setEventsLoading(false)
      })
      .catch(err => { console.error('Events search failed:', err); setEventsLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const eventsWithDistance = useMemo(() => {
    if (!hasCoordinates || !currentSearchParams?.latitude || !currentSearchParams?.longitude) return events
    return events.map(event => {
      if (event.latitude != null && event.longitude != null) {
        return { ...event, distance_miles: haversineDistance(currentSearchParams.latitude!, currentSearchParams.longitude!, event.latitude, event.longitude) }
      }
      return event
    })
  }, [events, currentSearchParams, hasCoordinates])

  const venuesWithDistance = useMemo(() => {
    if (!hasCoordinates || !currentSearchParams?.latitude || !currentSearchParams?.longitude) return venues
    return venues.map(venue => {
      if (venue.latitude != null && venue.longitude != null) {
        return { ...venue, distance_miles: haversineDistance(currentSearchParams.latitude!, currentSearchParams.longitude!, venue.latitude, venue.longitude) }
      }
      return venue
    })
  }, [venues, currentSearchParams, hasCoordinates])

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

  // Slice results for display — show INITIAL_RESULTS_COUNT unless expanded
  const visibleVenues = venuesExpanded ? filteredVenues : filteredVenues.slice(0, INITIAL_RESULTS_COUNT)
  const visibleEvents = eventsExpanded ? filteredEvents : filteredEvents.slice(0, INITIAL_RESULTS_COUNT)
  const hasMoreVenues = filteredVenues.length > INITIAL_RESULTS_COUNT
  const hasMoreEvents = filteredEvents.length > INITIAL_RESULTS_COUNT

  const handleRemoveActivity = async (activityToRemove: string) => {
    if (!currentSearchParams) return
    const newActivities = currentSearchParams.activities.filter(a => a !== activityToRemove)
    if (newActivities.length === 0) { navigate('/'); return }

    setSearching(true)
    setVenuesLoading(true)
    setEventsLoading(true)
    setVenues([])
    setEvents([])
    setVenuesExpanded(false)
    setEventsExpanded(false)

    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const newParams = { ...currentSearchParams, activities: newActivities }
    const body = JSON.stringify(newParams)
    const headers = { 'Content-Type': 'application/json' }

    fetch(`${apiUrl}/search/venues`, { method: 'POST', headers, body })
      .then(r => r.json()).then(data => { setVenues(data.venues || []); setVenuesLoading(false) })
      .catch(() => setVenuesLoading(false))

    fetch(`${apiUrl}/search/events`, { method: 'POST', headers, body })
      .then(r => r.json()).then(data => { setEvents(data.events || []); setEventsLoading(false) })
      .catch(() => setEventsLoading(false))

    setSearching(false)
  }

  if (error && !venues.length && !events.length && !venuesLoading && !eventsLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-black text-primary mb-4">Halfterm</h1>
          <p className="text-base-content/70 mb-6">{error || 'Sorry, something went wrong. Please try again.'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">← Back to search</button>
        </div>
      </div>
    )
  }

  const showEvents = activeTab === 'all' || activeTab === 'events'
  const showVenues = activeTab === 'all' || activeTab === 'venues'

  return (
    <div className="min-h-screen bg-base-200 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-6">

        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary mb-1">Halfterm</h1>
          <h2 className="text-xl font-semibold text-base-content mb-1">
            {venuesLoading && eventsLoading ? 'Finding the best options...' : "Here's what you can do..."}
          </h2>
        </div>

        <SearchSummary searchParams={currentSearchParams} onRemoveActivity={handleRemoveActivity} />

        {searchExtended && searchExtendedMessage && (
          <div className="alert alert-info mb-4 text-sm">
            <span>ℹ️ {searchExtendedMessage}</span>
          </div>
        )}

        {searching && <p className="text-sm text-base-content/40 animate-pulse text-center mb-4">Updating results...</p>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-2">
          <button onClick={() => navigate('/')} className="btn btn-outline btn-sm">← Update search</button>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="join">
              <button className={`join-item btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('all')}>All</button>
              <button className={`join-item btn btn-sm ${activeTab === 'venues' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('venues')}>Venues</button>
              <button className={`join-item btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('events')}>Events</button>
            </div>
            <div className="join">
              <button className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('list')} aria-label="List view">☰ List</button>
              <button className={`join-item btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('map')} aria-label="Map view">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline', marginRight:'4px'}}>
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/>
                  <line x1="15" y1="6" x2="15" y2="21"/>
                </svg>Map
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-sm lg:hidden" onClick={() => setFilterDrawerOpen(true)}>Filters</button>
        </div>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">

          {viewMode === 'list' && (
            <aside className="hidden lg:block">
              <div className="card bg-base-100 shadow-sm border border-base-200 sticky top-6">
                <div className="card-body py-5 px-5">
                  <h2 className="font-bold text-base mb-4">Filters</h2>
                  <FilterPanel sortBy={sortBy} setSortBy={setSortBy} costFilter={costFilter} setCostFilter={setCostFilter} namePrefix="sidebar-" hasCoordinates={hasCoordinates} />
                </div>
              </div>
            </aside>
          )}

          <div className={viewMode === 'map' ? 'lg:col-span-2' : ''}>

            {viewMode === 'map' && (
              <Suspense fallback={<div className="w-full h-[500px] bg-base-200 rounded-xl flex items-center justify-center"><span className="text-base-content/40 animate-pulse">Loading map...</span></div>}>
                <MapView
                  events={showEvents ? filteredEvents : []}
                  venues={showVenues ? filteredVenues : []}
                  userLatitude={currentSearchParams?.latitude}
                  userLongitude={currentSearchParams?.longitude}
                />
                <div className="mt-3 flex items-center gap-4 text-sm text-base-content/60">
                  <span>🔵 Your location</span>
                  <span>🟠 Venues & Events</span>
                  <span className="text-xs">Click a pin for details</span>
                </div>
              </Suspense>
            )}

            {viewMode === 'list' && (
              <div className="flex flex-col gap-4">

                {/* Venues section */}
                {showVenues && (
                  <>
                    {activeTab === 'all' && (
                      <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide mt-2">
                        Venues
                        {venuesLoading && <span className="text-base-content/30 normal-case font-normal text-xs ml-2">loading...</span>}
                      </h3>
                    )}
                    {venuesLoading ? (
                      <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                    ) : filteredVenues.length > 0 ? (
                      <>
                        {visibleVenues.map((venue: Venue, index: number) => (
                          <VenueCard key={index} venue={venue} />
                        ))}
                        {/* Show more / show less for venues */}
                        {hasMoreVenues && (
                          <button
                            className="btn btn-outline btn-sm self-center mt-1"
                            onClick={() => setVenuesExpanded(!venuesExpanded)}
                          >
                            {venuesExpanded
                              ? '▲ Show less'
                              : `▼ Show ${filteredVenues.length - INITIAL_RESULTS_COUNT} more venue${filteredVenues.length - INITIAL_RESULTS_COUNT > 1 ? 's' : ''}`
                            }
                          </button>
                        )}
                      </>
                    ) : activeTab === 'venues' ? (
                      <div className="text-center py-12 text-base-content/50">No venues match your filters.</div>
                    ) : null}
                  </>
                )}

                {/* Events section */}
                {showEvents && (
                  <>
                    {activeTab === 'all' && (
                      <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide">
                        Events
                        {eventsLoading && <span className="text-base-content/30 normal-case font-normal text-xs ml-2">loading...</span>}
                      </h3>
                    )}
                    {eventsLoading ? (
                      <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                    ) : filteredEvents.length > 0 ? (
                      <>
                        {visibleEvents.map((event: Event, index: number) => (
                          <EventCard key={index} event={event} />
                        ))}
                        {/* Show more / show less for events */}
                        {hasMoreEvents && (
                          <button
                            className="btn btn-outline btn-sm self-center mt-1"
                            onClick={() => setEventsExpanded(!eventsExpanded)}
                          >
                            {eventsExpanded
                              ? '▲ Show less'
                              : `▼ Show ${filteredEvents.length - INITIAL_RESULTS_COUNT} more event${filteredEvents.length - INITIAL_RESULTS_COUNT > 1 ? 's' : ''}`
                            }
                          </button>
                        )}
                      </>
                    ) : activeTab === 'events' ? (
                      <div className="text-center py-12 text-base-content/50">No events match your filters.</div>
                    ) : null}
                  </>
                )}

              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="btn btn-outline">← Update search</button>
        </div>

      </div>

      {filterDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setFilterDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-2xl z-50 p-6 lg:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Filters</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterDrawerOpen(false)}>✕</button>
            </div>
            <FilterPanel sortBy={sortBy} setSortBy={setSortBy} costFilter={costFilter} setCostFilter={setCostFilter} namePrefix="drawer-" hasCoordinates={hasCoordinates} />
            <button className="btn btn-primary btn-block mt-6" onClick={() => setFilterDrawerOpen(false)}>Apply filters</button>
          </div>
        </>
      )}
      <FeedbackBanner />
    </div>
  )
}

export default Results
