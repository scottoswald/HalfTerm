import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationAutocomplete from '../components/LocationAutocomplete'

// Mock fetch for Google Places API calls
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockSuggestions = {
  suggestions: [
    {
      placePrediction: {
        placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
        text: { text: 'London, UK' },
        structuredFormat: {
          mainText: { text: 'London' },
          secondaryText: { text: 'UK' }
        }
      }
    },
    {
      placePrediction: {
        placeId: 'ChIJ2dGMjMMbdkgRvBCj3nv6qHo',
        text: { text: 'London Heathrow Airport, Longford, UK' },
        structuredFormat: {
          mainText: { text: 'London Heathrow Airport' },
          secondaryText: { text: 'Longford, UK' }
        }
      }
    }
  ]
}

const mockPlaceDetails = {
  location: { latitude: 51.5074, longitude: -0.1278 },
  displayName: { text: 'London' }
}

beforeEach(() => {
  mockFetch.mockClear()
})

describe('LocationAutocomplete', () => {

  it('renders the input with correct placeholder', () => {
    render(
      <LocationAutocomplete
        value=""
        onChange={() => {}}
        onLocationSelect={() => {}}
      />
    )
    expect(screen.getByPlaceholderText('Type a postcode, town, city or village...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(
      <LocationAutocomplete
        value=""
        onChange={() => {}}
        onLocationSelect={() => {}}
        placeholder="Search location..."
      />
    )
    expect(screen.getByPlaceholderText('Search location...')).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    const onChange = vi.fn()
    render(
      <LocationAutocomplete
        value=""
        onChange={onChange}
        onLocationSelect={() => {}}
      />
    )
    const input = screen.getByPlaceholderText('Type a postcode, town, city or village...')
    await userEvent.type(input, 'L')
    expect(onChange).toHaveBeenCalledWith('L')
  })

  it('shows suggestions dropdown when API returns results', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => mockSuggestions
    })

    const onChange = vi.fn()
    render(
      <LocationAutocomplete
        value="Lon"
        onChange={onChange}
        onLocationSelect={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('does not fetch when input is less than 2 characters', async () => {
    render(
      <LocationAutocomplete
        value="L"
        onChange={() => {}}
        onLocationSelect={() => {}}
      />
    )
    // Wait for debounce
    await new Promise(r => setTimeout(r, 400))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls onLocationSelect with coordinates when suggestion is clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => mockSuggestions })
      .mockResolvedValueOnce({ json: async () => mockPlaceDetails })

    const onLocationSelect = vi.fn()
    render(
      <LocationAutocomplete
        value="Lon"
        onChange={() => {}}
        onLocationSelect={onLocationSelect}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    }, { timeout: 500 })

    fireEvent.click(screen.getByText('London'))

    await waitFor(() => {
      expect(onLocationSelect).toHaveBeenCalledWith(
        'London, UK',
        51.5074,
        -0.1278
      )
    })
  })

  it('shows powered by Google attribution', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => mockSuggestions
    })

    render(
      <LocationAutocomplete
        value="Lon"
        onChange={() => {}}
        onLocationSelect={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Powered by Google')).toBeInTheDocument()
    }, { timeout: 500 })
  })

})
