import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock the fetch function so tests don't make real API calls
// vi.fn() creates a fake function we can control in tests
vi.stubGlobal('fetch', vi.fn())

// Helper function that sets up a fake successful API response
const mockSuccessfulSearch = () => {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ result: 'Some museum activities for kids' }),
  })
}

describe('App component', () => {

  it('renders the Halfterm logo', () => {
    // MemoryRouter provides routing context without needing a real browser URL
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Halfterm')).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('renders activity grid with all 8 activities', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check all 8 activity buttons are present in the grid
    expect(screen.getByText('Museums')).toBeInTheDocument()
    expect(screen.getByText('Theme Parks')).toBeInTheDocument()
    expect(screen.getByText('Outdoor')).toBeInTheDocument()
    expect(screen.getByText('Sports')).toBeInTheDocument()
    expect(screen.getByText('Theatre')).toBeInTheDocument()
    expect(screen.getByText('Arts & Crafts')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
    expect(screen.getByText('Zoos')).toBeInTheDocument()
  })

  it('renders all location options in the dropdown', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check a selection of cities are present
    expect(screen.getByText('London')).toBeInTheDocument()
    expect(screen.getByText('Manchester')).toBeInTheDocument()
    expect(screen.getByText('Birmingham')).toBeInTheDocument()
    expect(screen.getByText('Edinburgh')).toBeInTheDocument()
  })

  it('renders date, age and budget dropdowns', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check all three dropdown labels are present
    expect(screen.getByText('When?')).toBeInTheDocument()
    expect(screen.getByText('Ages?')).toBeInTheDocument()
    expect(screen.getByText('Budget?')).toBeInTheDocument()
  })

  it('toggles activity button to selected state when clicked', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Find the Museums button and click it
    const museumsButton = screen.getByText('Museums').closest('button')!
    fireEvent.click(museumsButton)

    // After clicking, the button should have the btn-primary class (selected state)
    expect(museumsButton).toHaveClass('btn-primary')
  })

  it('shows loading message when search button is clicked', async () => {
    mockSuccessfulSearch()

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Search'))

    // The first loading message should appear after clicking
    await waitFor(() => {
      expect(screen.getByText('Searching for activities...')).toBeInTheDocument()
    })
  })

  it('disables search button while loading', async () => {
    mockSuccessfulSearch()

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)

    // Button should be disabled while the search is in progress
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
    })
  })

})