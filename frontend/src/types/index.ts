// ---- TYPE DEFINITIONS ----
// All TypeScript interfaces for the Halfterm application
// Centralising types here means they can be imported by any component
// rather than being duplicated across files

// Represents a live ticketed event e.g. a show, workshop or performance
export interface Event {
  type: 'event'
  name: string
  image_url: string | null
  location: string
  date: string
  time: string
  age_range: string
  cost: string
  is_free: boolean
  categories: string[]
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  booking_url: string | null
  directions_url: string
}

// Represents a permanent venue e.g. a museum, park or attraction
export interface Venue {
  type: 'venue'
  name: string
  image_url: string | null
  location: string
  opening_times: string
  age_range: string
  cost: string
  is_free: boolean
  categories: string[]
  rating: number | null
  keywords: string[]
  description: string
  expanded_description: string
  website_url: string | null
  directions_url: string
}

// The full structured response returned by the backend search endpoint
export interface SearchResults {
  search_summary: string
  events: Event[]
  venues: Venue[]
  error?: string
}

// The search parameters passed from App.tsx to Results.tsx via React Router state
// Results.tsx needs these to re-trigger a search when the user removes an activity pill
export interface SearchParams {
  activities: string[]
  location: string
  // Optional GPS or postcode-derived coordinates
  // Used for radius search — more accurate than city name alone
  latitude: number | null
  longitude: number | null
  // Search radius in miles — default 5
  radius_miles: number
  date: string
  age_range: string
  cost_range: string
  free_text: string | null
}
