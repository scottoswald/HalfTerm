import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock the fetch function so tests don't make real API calls
// vi.fn() creates a fake function that we can control in tests
// This means tests run instantly without needing the backend running
vi.stubGlobal('fetch', vi.fn())

// Helper function that sets up a fake successful API response
// We reuse this across multiple tests so it makes sense to define it once
const mockSuccessfulSearch = () => {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ result: 'Some museum activities for kids' }),
  })
}

// describe groups related tests together under a named block
// Makes the test output easier to read
describe('App component', () => {

  it('renders the Halfterm logo', () => {
    // Wrap in MemoryRouter because App uses useNavigate
    // MemoryRouter provides routing context without needing a real browser URL
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // getByText finds an element containing this text
    // If it's not found the test fails
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

  it('renders all three dropdowns', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check all three dropdown options are present
    expect(screen.getByText('Museum')).toBeInTheDocument()
    expect(screen.getByText('London')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('shows Searching... when search button is clicked', async () => {
    mockSuccessfulSearch()

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // fireEvent.click simulates a user clicking the button
    fireEvent.click(screen.getByText('Search'))

    // waitFor waits for the UI to update after the click
    // The button should show 'Searching...' while waiting for the backend
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })
  })

})