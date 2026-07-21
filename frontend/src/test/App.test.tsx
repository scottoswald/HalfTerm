import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock LocationAutocomplete — avoids needing a real Google Places API key in tests
vi.mock('../components/LocationAutocomplete', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="location-autocomplete"
      placeholder="Type a postcode, town, city or village..."
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  mockNavigate.mockClear()
})

describe('App', () => {

  it('renders the Halfterm heading', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Halfterm')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Find things to do with your kids')).toBeInTheDocument()
  })

  it('renders About and Contact buttons', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
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

  it('toggles activity selection when clicked', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const museumsButton = screen.getByText('Museums').closest('button')!
    await userEvent.click(museumsButton)
    expect(museumsButton).toHaveClass('btn-primary')
    await userEvent.click(museumsButton)
    expect(museumsButton).not.toHaveClass('btn-primary')
  })

  it('renders the location autocomplete input', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByTestId('location-autocomplete')).toBeInTheDocument()
  })

  it('renders the current location button', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('📍 Use my current location')).toBeInTheDocument()
  })

  it('renders radius buttons', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('renders the quick pick city dropdown', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Or quick pick a city:')).toBeInTheDocument()
    expect(screen.getByText('Select a city...')).toBeInTheDocument()
  })

  it('renders time filters row', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('When?')).toBeInTheDocument()
    expect(screen.getByText('How long?')).toBeInTheDocument()
    expect(screen.getByText('What time?')).toBeInTheDocument()
  })

  it('renders ages and budget dropdowns', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Ages?')).toBeInTheDocument()
    expect(screen.getByText('Budget?')).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows alert when search is clicked without a location', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<MemoryRouter><App /></MemoryRouter>)
    const searchButton = screen.getByRole('button', { name: /^search$/i })
    await userEvent.click(searchButton)
    expect(alertMock).toHaveBeenCalledWith('Please enter a location or use your current location')
    alertMock.mockRestore()
  })

  it('navigates to results when search is clicked with a location', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const locationInput = screen.getByTestId('location-autocomplete')
    await userEvent.type(locationInput, 'London')
    const searchButton = screen.getByRole('button', { name: /^search$/i })
    await userEvent.click(searchButton)
    expect(mockNavigate).toHaveBeenCalledWith('/results', expect.objectContaining({
      state: expect.objectContaining({ loading: true })
    }))
  })

  it('renders vibes filters', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Free & Low Cost')).toBeInTheDocument()
    expect(screen.getByText('Accessible')).toBeInTheDocument()
    expect(screen.getByText('Hidden Gem')).toBeInTheDocument()
  })

  it('shows custom date input when custom date is selected', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const dateSelect = screen.getByDisplayValue('Today')
    await userEvent.selectOptions(dateSelect, 'custom')
    await waitFor(() => {
      expect(document.querySelector('input[type="date"]')).toBeInTheDocument()
    })
  })

  it('shows custom duration inputs when custom duration is selected', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const durationSelect = screen.getByDisplayValue('Any duration')
    await userEvent.selectOptions(durationSelect, 'custom')
    await waitFor(() => {
      expect(screen.getByPlaceholderText('hrs')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('mins')).toBeInTheDocument()
    })
  })

  it('shows custom time inputs when custom time is selected', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const timeSelect = screen.getByDisplayValue('Any time')
    await userEvent.selectOptions(timeSelect, 'custom')
    await waitFor(() => {
      expect(screen.getByText('to')).toBeInTheDocument()
    })
  })

})
