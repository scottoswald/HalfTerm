import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import userEvent from '@testing-library/user-event'

// Mock the fetch function so tests don't make real API calls
// vi.fn() creates a fake function we can control in tests
vi.stubGlobal('fetch', vi.fn())

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

  it('renders activity grid with all 16 activities', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    // Check a sample of the 16 activity buttons are present
    expect(screen.getByText('Museums')).toBeInTheDocument()
    expect(screen.getByText('Attractions')).toBeInTheDocument()
    expect(screen.getByText('Outdoors')).toBeInTheDocument()
    expect(screen.getByText('Sports')).toBeInTheDocument()
    expect(screen.getByText('Animals')).toBeInTheDocument()
    expect(screen.getByText('Swimming')).toBeInTheDocument()
    expect(screen.getByText('Gaming')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })

  it('renders the location section correctly', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    // Check the location input and current location button are present
    expect(screen.getByPlaceholderText('Type a postcode, town, city or village...')).toBeInTheDocument()
    expect(screen.getByText('📍 Use my current location')).toBeInTheDocument()
    // Check the quick pick dropdown is present
    expect(screen.getByText('Or quick pick a city:')).toBeInTheDocument()
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
    // Mock fetch to return a pending promise that never resolves
    // This keeps the loading state active so we can check it
    ;(fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const locationInput = screen.getByPlaceholderText('Type a postcode, town, city or village...')
    await userEvent.type(locationInput, 'London')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await userEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('Searching for activities...')).toBeInTheDocument()
    })
  })

  it('disables search button while loading', async () => {
    // Mock fetch to return a pending promise that never resolves
    // This keeps the loading state active so we can check the button is disabled
    ;(fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const locationInput = screen.getByPlaceholderText('Type a postcode, town, city or village...')
    await userEvent.type(locationInput, 'London')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await userEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
    })
  })

})