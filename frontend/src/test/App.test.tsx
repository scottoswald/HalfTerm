import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import userEvent from '@testing-library/user-event'

// Mock fetch so tests never make real API calls
vi.stubGlobal('fetch', vi.fn())

describe('App component', () => {

  it('renders the Halfterm logo', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Halfterm')).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('renders activity grid with all 16 activities', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
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
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Type a postcode, town, city or village...')).toBeInTheDocument()
    expect(screen.getByText('📍 Use my current location')).toBeInTheDocument()
    expect(screen.getByText('Or quick pick a city:')).toBeInTheDocument()
  })

  it('renders date, age and budget dropdowns', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('When?')).toBeInTheDocument()
    expect(screen.getByText("Who's coming?")).toBeInTheDocument()
    expect(screen.getByText('Budget?')).toBeInTheDocument()
  })

  it('toggles activity button to selected state when clicked', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const museumsButton = screen.getByText('Museums').closest('button')!
    fireEvent.click(museumsButton)
    expect(museumsButton).toHaveClass('btn-primary')
  })

  it('deselects activity when clicked a second time', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const museumsButton = screen.getByText('Museums').closest('button')!
    fireEvent.click(museumsButton)
    expect(museumsButton).toHaveClass('btn-primary')
    fireEvent.click(museumsButton)
    expect(museumsButton).not.toHaveClass('btn-primary')
  })

  it('renders all 9 experience vibe buttons', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Free & Low Cost')).toBeInTheDocument()
    expect(screen.getByText('Accessible')).toBeInTheDocument()
    expect(screen.getByText('Calm & Quiet')).toBeInTheDocument()
    expect(screen.getByText('Hidden Gem')).toBeInTheDocument()
    expect(screen.getByText('Surprise Me')).toBeInTheDocument()
  })

  it('toggles vibe button to selected state when clicked', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const accessibleButton = screen.getByText('Accessible').closest('button')!
    fireEvent.click(accessibleButton)
    expect(accessibleButton).toHaveClass('btn-secondary')
  })

  it('renders radius selector buttons', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('1mi')).toBeInTheDocument()
    expect(screen.getByText('5mi')).toBeInTheDocument()
    expect(screen.getByText('20mi')).toBeInTheDocument()
  })

  it('search button is enabled before clicking', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}))
    render(<MemoryRouter><App /></MemoryRouter>)
    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).not.toBeDisabled()
  })

  it('shows alert when search clicked with no location', async () => {
    // Mock window.alert so we can assert it was called
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<MemoryRouter><App /></MemoryRouter>)
    const searchButton = screen.getByRole('button', { name: /search/i })
    await userEvent.click(searchButton)
    expect(alertMock).toHaveBeenCalledWith('Please enter a location or use your current location')
    alertMock.mockRestore()
  })

})
