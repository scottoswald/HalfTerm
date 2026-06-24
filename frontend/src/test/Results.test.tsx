import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Results from '../Results'

// Helper to render Results with mock route state
const renderResults = (state?: object) => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/results', state }]}>
      <Routes>
        <Route path="/results" element={<Results />} />
      </Routes>
    </MemoryRouter>
  )
}

// Valid mock result matching the SearchResults interface
// latitude and longitude are included on both event and venue (required by interface)
const MOCK_RESULT = {
  search_summary: 'Museums in London, Tuesday 19th May 2026, All ages, Any budget',
  search_extended: false,
  search_extended_message: null,
  events: [
    {
      type: 'event',
      name: 'Paddington Bear Experience',
      image_url: null,
      location: 'County Hall, London SE1 7PB',
      latitude: 51.5014,
      longitude: -0.1196,
      date: 'Tuesday 19th May 2026',
      time: '10:00 AM',
      age_range: 'All ages',
      cost: 'From £22',
      is_free: false,
      rating: null,
      keywords: ['indoor', 'book in advance'],
      description: 'An immersive Paddington Bear adventure.',
      expanded_description: 'Step into Paddington\'s world with interactive sets and live characters.',
      booking_url: 'https://ticketmaster.co.uk/paddington',
      directions_url: 'https://www.google.com/maps/dir/?api=1&destination=County+Hall+London',
    }
  ],
  venues: [
    {
      type: 'venue',
      name: 'Natural History Museum',
      image_url: null,
      location: 'Cromwell Rd, London SW7 5BD',
      latitude: 51.4967,
      longitude: -0.1764,
      opening_times: 'Daily 10:00 AM - 5:50 PM',
      age_range: 'All ages',
      cost: 'Free',
      is_free: true,
      rating: 4.6,
      keywords: ['indoor', 'accessible', 'café on site'],
      description: 'One of London\'s greatest free museums.',
      expanded_description: 'The Natural History Museum is home to over 80 million specimens.',
      website_url: 'https://www.nhm.ac.uk',
      directions_url: 'https://www.google.com/maps/dir/?api=1&destination=Cromwell+Rd+London',
    }
  ]
}

// Valid searchParams for tests that need the summary to render
const MOCK_SEARCH_PARAMS = {
  activities: ['Museums'],
  location: 'London',
  date: 'today',
  age_range: 'all ages',
  cost_range: 'any',
  free_text: null,
  vibes: [],
  latitude: null,
  longitude: null,
  radius_miles: 5
}

describe('Results component', () => {

  it('renders the Halfterm logo', () => {
    renderResults({ result: MOCK_RESULT })
    expect(screen.getAllByText('Halfterm').length).toBeGreaterThan(0)
  })

  it('renders the search summary pills', () => {
    renderResults({ result: MOCK_RESULT, searchParams: MOCK_SEARCH_PARAMS })
    expect(screen.getByText('What')).toBeInTheDocument()
    expect(screen.getByText('Where')).toBeInTheDocument()
    expect(screen.getByText('When')).toBeInTheDocument()
    expect(screen.getByLabelText('Remove Museums')).toBeInTheDocument()
  })

  it('renders event cards from the result', () => {
    renderResults({ result: MOCK_RESULT })
    expect(screen.getByText('Paddington Bear Experience')).toBeInTheDocument()
  })

  it('renders venue cards from the result', () => {
    renderResults({ result: MOCK_RESULT })
    expect(screen.getByText('Natural History Museum')).toBeInTheDocument()
  })

  it('renders without crashing when no result is passed', () => {
    // With two-stage loading, no data renders empty sections not an error
    renderResults()
    expect(screen.getAllByText('Halfterm').length).toBeGreaterThan(0)
  })

  it('renders the update search button', () => {
    renderResults({ result: MOCK_RESULT })
    // Two buttons exist — top and bottom of the page
    const buttons = screen.getAllByText('← New search')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders the free cost badge on free venues', () => {
    renderResults({ result: MOCK_RESULT })
    // Scope to the badge element specifically — not "Free only" filter label
    const freeBadge = screen.getByText('Free', { selector: '.badge' })
    expect(freeBadge).toBeInTheDocument()
  })

  it('renders the events and venues tab buttons', () => {
    renderResults({ result: MOCK_RESULT })
    // Tab buttons have role="button" so we can target them specifically
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Venues' })).toBeInTheDocument()
  })

  it('shows only venues when Venues tab is clicked', () => {
    renderResults({ result: MOCK_RESULT })
    fireEvent.click(screen.getByRole('button', { name: 'Venues' }))
    expect(screen.getByText('Natural History Museum')).toBeInTheDocument()
    expect(screen.queryByText('Paddington Bear Experience')).not.toBeInTheDocument()
  })

  it('shows only events when Events tab is clicked', () => {
    renderResults({ result: MOCK_RESULT })
    fireEvent.click(screen.getByRole('button', { name: 'Events' }))
    expect(screen.getByText('Paddington Bear Experience')).toBeInTheDocument()
    expect(screen.queryByText('Natural History Museum')).not.toBeInTheDocument()
  })

  it('shows the extended search alert when search_extended is true', () => {
    renderResults({
      result: {
        ...MOCK_RESULT,
        search_extended: true,
        search_extended_message: "We couldn't find enough results within 5 miles so we've included some nearby options too."
      }
    })
    expect(screen.getByText(/couldn't find enough results/)).toBeInTheDocument()
  })

  it('renders the error state when error is set and no results', () => {
    renderResults({
      result: {
        search_summary: '',
        search_extended: false,
        search_extended_message: null,
        events: [],
        venues: [],
        error: 'Sorry, something went wrong. Please try again.'
      }
    })
    expect(screen.getByText('Sorry, something went wrong. Please try again.')).toBeInTheDocument()
  })

})
