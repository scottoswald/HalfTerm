// ---- TYPE DEFINITIONS ----
// All TypeScript interfaces for the Halfterm application

export interface Event {
  type: 'event'
  name: string
  image_url: string | null
  location: string
  latitude: number | null
  longitude: number | null
  date: string
  time: string
  age_range: string
  cost: string
  is_free: boolean
  // categories removed — never displayed on cards, was wasting output tokens
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  booking_url: string | null
  directions_url: string
  distance_miles?: number
}

export interface Venue {
  type: 'venue'
  name: string
  image_url: string | null
  location: string
  latitude: number | null
  longitude: number | null
  opening_times: string
  age_range: string
  cost: string
  is_free: boolean
  // categories removed — never displayed on cards, was wasting output tokens
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  website_url: string | null
  directions_url: string
  distance_miles?: number
}

export interface SearchResults {
  search_summary: string
  events: Event[]
  venues: Venue[]
  error?: string
  // True when Claude extended the search beyond the requested radius
  search_extended?: boolean
  // Friendly message explaining why the search was extended
  search_extended_message?: string
}

// A selected vibe stores both the display label (shown in the UI)
// and the full value string (passed to the agent for context)
export interface SelectedVibe {
  label: string
  value: string
}

export interface SearchParams {
  activities: string[]
  vibes: SelectedVibe[]
  location: string
  latitude: number | null
  longitude: number | null
  radius_miles: number
  date: string
  age_range: string
  cost_range: string
  free_text: string | null
}
