import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Results from '../Results'

// Helper to render Results with mock route state
// The Results component reads data from React Router location state
const renderResults = (state?: object) => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/results', state }]}>
      <Routes>
        <Route path="/results" element={<Results />} />
      </Routes>
    </MemoryRouter>
  )
}

// Valid mock result matching the new structured JSON format
const MOCK_RESULT = {
  search_summary: 'Museums in London, Tuesday 19th May 2026, All ages, Any budget',
  events: [
    {
      type: 'event',
      name: 'Paddington Bear Experience',
      image_url: null,
      location: 'County Hall, London SE1 7PB',
      date: 'Tuesday 19th May 2026',
      time: '10:00 AM',
      age_range: 'All ages',
      cost: 'From £22',
      is_free: false,
      categories: ['Family Entertainment'],
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
      opening_times: 'Daily 10:00 AM - 5:50 PM',
      age_range: 'All ages',
      cost: 'Free',
      is_free: true,
      categories: ['Museum', 'Science'],
      rating: 4.6,
      keywords: ['indoor', 'accessible', 'café on site'],
      description: 'One of London\'s greatest free museums.',
      expanded_description: 'The Natural History Museum is home to over 80 million specimens.',
      website_url: 'https://www.nhm.ac.uk',
      directions_url: 'https://www.google.com/maps/dir/?api=1&destination=Cromwell+Rd+London',
    }
  ]
}

describe('Results component', () => {

  it('renders the Halfterm logo', () => {
    renderResults({ result: MOCK_RESULT })
    // The logo appears in both the results page and the error state
    expect(screen.getAllByText('Halfterm').length).toBeGreaterThan(0)
  })

  it('renders the search summary pills', () => {
    renderResults({ result: MOCK_RESULT })
    // Check the summary labels are present
    expect(screen.getByText('What')).toBeInTheDocument()
    expect(screen.getByText('Where')).toBeInTheDocument()
    expect(screen.getByText('When')).toBeInTheDocument()
    expect(screen.getByText('Ages')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()
    // Check the activity pill with X button is present
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

  it('renders a fallback message when no result is passed', () => {
    renderResults()
    // When no data is passed the error state shows this message
    expect(screen.getByText('Sorry, something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('renders the update search button', () => {
    renderResults({ result: MOCK_RESULT })
    // There are two update search buttons — top and bottom
    const buttons = screen.getAllByText('← Update search')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders the free badge on free venues', () => {
    renderResults({ result: MOCK_RESULT })
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders the events and venues tab toggles', () => {
    renderResults({ result: MOCK_RESULT })
    // 'Events' and 'Venues' appear multiple times — as tab buttons and section headings
    // getAllByText handles multiple matches, getByText would throw an error
    expect(screen.getAllByText('Events').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Venues').length).toBeGreaterThan(0)
  })

})