import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Activity options — each has an emoji, label, subtitle and value to pass to the agent
const ACTIVITIES = [
  { emoji: '🏛️', label: 'Museums', subtitle: 'Heritage, Galleries, Castles', value: 'Museums' },
  { emoji: '🎢', label: 'Attractions', subtitle: 'Theme Parks, Visitor Centres, Rides', value: 'Attractions' },
  { emoji: '🌳', label: 'Outdoors', subtitle: 'Parks, Nature, Beaches', value: 'Outdoors' },
  { emoji: '⚽', label: 'Sports', subtitle: 'Matches, Classes, Activities', value: 'Sports' },
  { emoji: '🎭', label: 'Theatre & Shows', subtitle: 'Performances, Pantomime, Circus', value: 'Theatre and Shows' },
  { emoji: '🎨', label: 'Arts & Crafts', subtitle: 'Making, Painting, Pottery', value: 'Arts and Crafts' },
  { emoji: '🔬', label: 'Science & Tech', subtitle: 'Experiments, Coding, Robots', value: 'Science and Technology' },
  { emoji: '🦁', label: 'Animals', subtitle: 'Zoos, Farms, Aquariums', value: 'Animals' },
  { emoji: '🛝', label: 'Play & Explore', subtitle: 'Playgrounds, Soft Play, Trampolines', value: 'Play and Explore' },
  { emoji: '🏁', label: 'Thrills & Challenges', subtitle: 'Go Karting, Climbing, Escape Rooms', value: 'Thrills and Challenges' },
  { emoji: '🎪', label: 'Fairs & Festivals', subtitle: 'Fairs, Markets, Carnivals', value: 'Fairs and Festivals' },
  { emoji: '🏊', label: 'Swimming', subtitle: 'Pools, Lidos, Water Parks', value: 'Swimming' },
  { emoji: '🎵', label: 'Music', subtitle: 'Concerts, Workshops, Sing-alongs', value: 'Music' },
  { emoji: '🎮', label: 'Gaming', subtitle: 'Arcades, VR, Board Game Cafés', value: 'Gaming' },
  { emoji: '📚', label: 'Learning', subtitle: 'Workshops, Discovery Centres, Educational Visits', value: 'Learning' },
  { emoji: '🤝', label: 'Community', subtitle: 'Local Clubs, Youth Groups, Volunteering', value: 'Community' },
]

// Quick pick cities — shown as a dropdown shortcut below the location search box
const QUICK_PICK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh',
  'Glasgow', 'Bristol', 'Cardiff', 'Liverpool', 'Newcastle',
  'Brighton', 'Oxford', 'Cambridge', 'Bath',
]

// Radius options in miles — shown as toggle buttons below the location search box
const RADIUS_OPTIONS = [1, 2, 5, 10, 20]

// Date options to pass to the agent
const DATES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Weekend', value: 'this weekend' },
  { label: 'This Week', value: 'this week' },
  { label: 'Next Week', value: 'next week' },
]

// Age range options — passed to the agent to filter results
const AGE_RANGES = [
  { label: 'Babies & Toddlers (0-3)', value: '0-3' },
  { label: 'Young Children (4-7)', value: '4-7' },
  { label: 'Older Children (8-12)', value: '8-12' },
  { label: 'Teenagers (13+)', value: '13+' },
  { label: 'All Ages', value: 'all ages' },
]

// Cost range options — passed to the agent to filter results
const COST_RANGES = [
  { label: 'Any Budget', value: 'any' },
  { label: 'Free only', value: 'free' },
  { label: 'Under £10', value: 'under £10' },
  { label: '£10 - £25', value: '£10 to £25' },
  { label: '£25 - £50', value: '£25 to £50' },
  { label: '£50+', value: 'over £50' },
]

// Loading messages to cycle through while the agent works
const LOADING_MESSAGES = [
  'Searching for activities...',
  "Checking what's on...",
  'Finding the best options...',
  'Almost there...',
]

// Check if a string looks like a UK postcode
// Used to decide whether to look up coordinates via Postcodes.io
function looksLikePostcode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim())
}

function App() {
  const navigate = useNavigate()

  const [selectedActivities, setSelectedActivities] = useState<string[]>([])

  // Location state — text input, optional GPS coordinates, and radius
  const [locationText, setLocationText] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(5)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [date, setDate] = useState('today')
  const [ageRange, setAgeRange] = useState('all ages')
  const [costRange, setCostRange] = useState('any')
  const [freeText, setFreeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const toggleActivity = (value: string) => {
    setSelectedActivities(prev =>
      prev.includes(value)
        ? prev.filter(a => a !== value)
        : [...prev, value]
    )
  }

  // Request GPS location from the browser
  // Works on mobile and desktop — browser will ask for permission
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // GPS success — store coordinates and update display text
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocationText('Current location')
        setLocationStatus('success')
      },
      () => {
        // GPS failed — user denied permission or location unavailable
        setLocationStatus('error')
        setLatitude(null)
        setLongitude(null)
      }
    )
  }

  // Look up postcode coordinates via Postcodes.io (free UK postcode API, no key needed)
  // Called when user types something that looks like a UK postcode
  const lookupPostcode = async (postcode: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
      const data = await response.json()
      if (data.status === 200) {
        return { lat: data.result.latitude, lng: data.result.longitude }
      }
      return null
    } catch {
      return null
    }
  }

  // Handle location text input changes
  // If it looks like a postcode, look up coordinates automatically
  const handleLocationChange = async (value: string) => {
    setLocationText(value)
    // Clear GPS coordinates when user types manually
    setLatitude(null)
    setLongitude(null)
    setLocationStatus('idle')

    // Auto-lookup if it looks like a postcode
    if (looksLikePostcode(value)) {
      const coords = await lookupPostcode(value)
      if (coords) {
        setLatitude(coords.lat)
        setLongitude(coords.lng)
        setLocationStatus('success')
      }
    }
  }

  // Handle quick pick city selection — populates text box and clears GPS
  const handleQuickPickCity = (city: string) => {
    setLocationText(city)
    setLatitude(null)
    setLongitude(null)
    setLocationStatus('idle')
  }

  const handleSearch = async () => {
    // Require at least a location before searching
    if (!locationText.trim()) {
      alert('Please enter a location or use your current location')
      return
    }

    setLoading(true)
    let messageIndex = 0
    setLoadingMessage(LOADING_MESSAGES[0])
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 2000)

    const searchParams = {
      activities: selectedActivities.length > 0 ? selectedActivities : ['family activities'],
      location: locationText.trim(),
      // Pass coordinates if available (GPS or postcode lookup)
      // Backend uses these for radius search instead of just city name
      latitude: latitude,
      longitude: longitude,
      radius_miles: radiusMiles,
      date,
      age_range: ageRange,
      cost_range: costRange,
      free_text: freeText.trim() || null,
    }

    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      })
      const data = await response.json()
      navigate('/results', { state: { result: data, searchParams } })
    } catch (error) {
      console.error('Search failed:', error)
      navigate('/results', {
        state: {
          result: {
            search_summary: '',
            events: [],
            venues: [],
            error: 'Sorry, something went wrong. Please try again.'
          },
          searchParams,
        }
      })
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-primary mb-2">Halfterm</h1>
          <p className="text-base-content/70 text-lg">Find things to do with your kids</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6">

            {/* Activity grid */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">
                  What are you looking for?
                </span>
                <span className="label-text-alt text-base-content/50">
                  Pick one or more
                </span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITIES.map(activity => (
                  <button
                    key={activity.value}
                    onClick={() => toggleActivity(activity.value)}
                    className={`btn btn-sm flex-col h-auto py-3 gap-0.5 ${
                      selectedActivities.includes(activity.value)
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    <span className="text-xl">{activity.emoji}</span>
                    <span className="text-xs font-semibold">{activity.label}</span>
                    <span className="text-[9px] opacity-60 leading-tight text-center">
                      {activity.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Free text search */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">
                  Looking for something specific?
                </span>
                <span className="label-text-alt text-base-content/50">Optional</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. go karting, baking class, dinosaur workshop..."
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
              />
            </div>

            {/* Location section */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Where?</span>
              </label>

              {/* Use current location button */}
              {/* Browser Geolocation API works on both mobile and desktop */}
              <button
                className={`btn btn-outline btn-block mb-3 ${locationStatus === 'loading' ? 'loading' : ''}`}
                onClick={handleUseCurrentLocation}
                disabled={locationStatus === 'loading'}
              >
                {locationStatus === 'loading' && '⏳ Getting location...'}
                {locationStatus === 'success' && latitude !== null && locationText === 'Current location' && '📍 Using current location ✓'}
                {locationStatus === 'error' && '❌ Location unavailable — please type below'}
                {locationStatus === 'idle' && '📍 Use my current location'}
              </button>

              {/* Location text input — accepts postcode, town, city or village */}
              {/* Automatically looks up coordinates when a valid postcode is entered */}
              <input
                type="text"
                className="input input-bordered w-full mb-3"
                placeholder="Type a postcode, town, city or village..."
                value={locationText === 'Current location' ? '' : locationText}
                onChange={e => handleLocationChange(e.target.value)}
              />

              {/* Radius selector — shown as toggle buttons */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-base-content/60 shrink-0">Within:</span>
                <div className="flex gap-1 flex-wrap">
                  {RADIUS_OPTIONS.map(miles => (
                    <button
                      key={miles}
                      onClick={() => setRadiusMiles(miles)}
                      className={`btn btn-xs ${radiusMiles === miles ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {miles}mi
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick pick city dropdown — shortcut to populate the text box */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/60 shrink-0">
                  Or quick pick a city:
                </span>
                <select
                  className="select select-bordered select-sm flex-1"
                  value=""
                  onChange={e => {
                    if (e.target.value) handleQuickPickCity(e.target.value)
                  }}
                >
                  <option value="" disabled>Select a city...</option>
                  {QUICK_PICK_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Date, age range and cost range */}
            <div className="grid grid-cols-3 gap-4">

              <div>
                <label className="label">
                  <span className="label-text font-semibold">When?</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                >
                  {DATES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Ages?</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={ageRange}
                  onChange={e => setAgeRange(e.target.value)}
                >
                  {AGE_RANGES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Budget?</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={costRange}
                  onChange={e => setCostRange(e.target.value)}
                >
                  {COST_RANGES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search button */}
            <button
              className="btn btn-primary btn-block btn-lg mt-2"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? loadingMessage : 'Search'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default App
