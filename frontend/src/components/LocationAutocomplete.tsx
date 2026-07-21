import { useState, useEffect, useRef, useCallback } from 'react'

// ---- LOCATION AUTOCOMPLETE COMPONENT ----
// Uses Google Places Autocomplete (New) API to suggest UK locations as the user types.
// Session tokens are used to group autocomplete requests with the final place details
// call — this makes the autocomplete portion free (only the place details call is billed).
//
// Flow:
// 1. User types → debounced request to Google Places Autocomplete API
// 2. Suggestions appear in a dropdown
// 3. User selects a suggestion → fetch place details to get coordinates
// 4. Coordinates passed up to parent via onLocationSelect callback

interface Suggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: string, lat: number | null, lng: number | null) => void
  placeholder?: string
}

interface GoogleSuggestion {
  placePrediction?: {
    placeId: string
    text?: { text: string }
    structuredFormat?: {
      mainText?: { text: string }
      secondaryText?: { text: string }
    }
  }
}

// Generate a random session token — groups autocomplete requests with place details
// so the autocomplete calls are free
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Type a postcode, town, city or village...'
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState(generateSessionToken)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY

  // Fetch autocomplete suggestions from Google Places API
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input,
            sessionToken,
            // Restrict to UK only
            includedRegionCodes: ['gb']
          })
        }
      )

      const data = await response.json()

      if (data.suggestions) {
        const mapped: Suggestion[] = data.suggestions
          .filter((s: GoogleSuggestion) => s.placePrediction)
          .map((s: GoogleSuggestion) => ({
            placeId: s.placePrediction!.placeId,
            description: s.placePrediction!.text?.text || '',
            mainText: s.placePrediction!.structuredFormat?.mainText?.text || s.placePrediction!.text?.text || '',
            secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text || '',
          }))
        setSuggestions(mapped)
        setIsOpen(mapped.length > 0)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Autocomplete error:', err)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, sessionToken])

  // Fetch place details to get coordinates when user selects a suggestion
  const fetchPlaceDetails = async (placeId: string, description: string) => {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'location,displayName',
            // Include session token to terminate the session (makes autocomplete free)
            'X-Goog-SessionToken': sessionToken,
          }
        }
      )

      const data = await response.json()

      if (data.location) {
        onLocationSelect(description, data.location.latitude, data.location.longitude)
      } else {
        onLocationSelect(description, null, null)
      }

      // Generate a new session token for the next autocomplete session
      setSessionToken(generateSessionToken())
    } catch (err) {
      console.error('Place details error:', err)
      onLocationSelect(description, null, null)
    }
  }

  // Debounce the autocomplete requests — wait 300ms after user stops typing
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [value, fetchSuggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.description)
    setIsOpen(false)
    setSuggestions([])
    setHighlightedIndex(-1)
    fetchPlaceDetails(suggestion.placeId, suggestion.description)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="loading loading-spinner loading-xs text-base-content/40" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-base-200 transition-colors ${
                index === highlightedIndex ? 'bg-base-200' : ''
              } ${index < suggestions.length - 1 ? 'border-b border-base-200' : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="text-base-content/40 mt-0.5 shrink-0">📍</span>
              <div>
                <div className="text-sm font-medium text-base-content">{suggestion.mainText}</div>
                {suggestion.secondaryText && (
                  <div className="text-xs text-base-content/50">{suggestion.secondaryText}</div>
                )}
              </div>
            </button>
          ))}
          {/* Google attribution — required by Google's terms */}
          <div className="px-4 py-2 bg-base-200 flex justify-end">
            <span className="text-xs text-base-content/30">Powered by Google</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationAutocomplete
