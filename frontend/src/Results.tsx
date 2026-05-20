import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { SearchResults, SearchParams } from './types'
import EventCard from './components/EventCard'
import VenueCard from './components/VenueCard'
import SearchSummary from './components/SearchSummary'

// ---- RESULTS PAGE ----
// This file is now a thin orchestration layer
// All card components and types live in their own files under src/components/ and src/types/
// This makes each piece easier to find, read and test independently

function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  // Get the structured results passed from App.tsx via React Router state
  const initialData = location.state?.result as SearchResults | undefined

  // Get the original search parameters — needed to re-search when activities are removed
  const initialSearchParams = location.state?.searchParams as SearchParams | undefined

  // Active tab — 'all', 'events' or 'venues'
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues'>('all')

  // Track current results as state so they update when activities are removed
  const [currentData, setCurrentData] = useState<SearchResults | undefined>(initialData)

  // Track current search params as state so they update when activities are removed
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | undefined>(initialSearchParams)

  // Track whether a re-search is in progress after removing an activity
  const [searching, setSearching] = useState(false)

  // Handle removing an activity pill and re-searching with the remaining activities
  // Called when user clicks X on an activity pill in the SearchSummary component
  const handleRemoveActivity = async (activityToRemove: string) => {
    if (!currentSearchParams) return

    // Remove the selected activity from the list
    const newActivities = currentSearchParams.activities.filter(a => a !== activityToRemove)

    // If no activities remain navigate back to search page
    if (newActivities.length === 0) {
      navigate('/')
      return
    }

    // Trigger a new search with the updated activities list
    setSearching(true)
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Spread the existing params but override activities with the new list
        body: JSON.stringify({
          ...currentSearchParams,
          activities: newActivities,
        }),
      })
      const newData = await response.json()

      // Update displayed results and search params in state
      setCurrentData(newData)
      const newParams = { ...currentSearchParams, activities: newActivities }
      setCurrentSearchParams(newParams)

      // Replace the current history entry so the back button still works correctly
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

  // Handle error state — either a backend error or no data at all
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

  // Decide which results to show based on active tab
  const showEvents = activeTab === 'all' || activeTab === 'events'
  const showVenues = activeTab === 'all' || activeTab === 'venues'

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary mb-1">Halfterm</h1>
          <h2 className="text-xl font-semibold text-base-content mb-1">
            Here's what you can do...
          </h2>
        </div>

        {/* Search summary pills — activity pills have X to remove and re-search */}
        <SearchSummary
          data={currentData}
          onRemoveActivity={handleRemoveActivity}
        />

        {/* Updating results indicator — shown while re-search is in progress */}
        {searching && (
          <p className="text-sm text-base-content/40 animate-pulse text-center mb-4">
            Updating results...
          </p>
        )}

        {/* Top controls — update search left, events/venues toggle right */}
        <div className="flex items-center justify-between mb-6 gap-2">
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
              className={`join-item btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'venues' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('venues')}
            >
              Venues
            </button>
          </div>
        </div>

        {/* Results — events first then venues */}
        <div className="flex flex-col gap-4">

          {/* Events section */}
          {showEvents && currentData.events.length > 0 && (
            <>
              {activeTab === 'all' && (
                <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide">
                  Events
                </h3>
              )}
              {currentData.events.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </>
          )}

          {/* Venues section */}
          {showVenues && currentData.venues.length > 0 && (
            <>
              {activeTab === 'all' && (
                <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide mt-2">
                  Venues
                </h3>
              )}
              {currentData.venues.map((venue, index) => (
                <VenueCard key={index} venue={venue} />
              ))}
            </>
          )}

          {/* Empty states */}
          {showEvents && currentData.events.length === 0 && activeTab === 'events' && (
            <div className="text-center py-12 text-base-content/50">
              No events found for your search. Try updating your search criteria.
            </div>
          )}

          {showVenues && currentData.venues.length === 0 && activeTab === 'venues' && (
            <div className="text-center py-12 text-base-content/50">
              No venues found for your search. Try updating your search criteria.
            </div>
          )}

        </div>

        {/* Bottom update search button */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="btn btn-outline">
            ← Update search
          </button>
        </div>

      </div>
    </div>
  )
}

export default Results