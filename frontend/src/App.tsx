import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SelectedVibe } from './types'
import { decodeSearchParams } from './utils/urlParams'
import LocationAutocomplete from './components/LocationAutocomplete'

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

const EXPERIENCE_VIBES = [
  { emoji: '💸', label: 'Free & Low Cost', value: 'free and low cost, suitable for families on a tight budget' },
  { emoji: '🤝', label: 'Local & Grassroots', value: 'local, community-run, volunteer-led or grassroots' },
  { emoji: '🌍', label: 'Cultural', value: 'celebrating different cultures, heritages or languages' },
  { emoji: '💜', label: 'Accessible', value: 'accessible and inclusive for children with additional needs, disabilities or sensory sensitivities' },
  { emoji: '😴', label: 'Calm & Quiet', value: 'calm, quiet and not overwhelming — good for children who find busy or loud environments difficult' },
  { emoji: '📖', label: 'Strong Learning Focus', value: 'genuinely educational with strong learning value, not just fun' },
  { emoji: '🌱', label: 'Eco & Nature', value: 'environmentally focused, conservation-led or nature-based' },
  { emoji: '✨', label: 'Hidden Gem', value: 'lesser-known, off the beaten track, avoiding tourist crowds' },
  { emoji: '🎲', label: 'Surprise Me', value: 'surprise the family with something unexpected and different' },
]

const QUICK_PICK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh',
  'Glasgow', 'Bristol', 'Cardiff', 'Liverpool', 'Newcastle',
  'Brighton', 'Oxford', 'Cambridge', 'Bath',
]

const RADIUS_OPTIONS = [1, 2, 5, 10, 20]

// Preset date options plus a custom date option
const DATES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Weekend', value: 'this weekend' },
  { label: 'This Week', value: 'this week' },
  { label: 'Next Week', value: 'next week' },
  { label: 'Custom date...', value: 'custom' },
]

// Preset duration options plus a custom option
const DURATIONS = [
  { label: 'Any duration', value: 'any' },
  { label: 'Under 1 hour', value: 'under 1 hour' },
  { label: '1-2 hours', value: '1-2 hours' },
  { label: 'Half a day (2-4 hrs)', value: 'half a day (2-4 hours)' },
  { label: 'Full day (4+ hrs)', value: 'full day (4+ hours)' },
  { label: 'Custom...', value: 'custom' },
]

// Preset time of day options plus a custom range option
const TIMES_OF_DAY = [
  { label: 'Any time', value: 'any' },
  { label: 'Morning (before 12pm)', value: 'morning (before 12pm)' },
  { label: 'Afternoon (12pm-5pm)', value: 'afternoon (12pm-5pm)' },
  { label: 'Evening (after 5pm)', value: 'evening (after 5pm)' },
  { label: 'Custom time range...', value: 'custom' },
]

const AGE_RANGES = [
  { label: 'All Ages', value: 'all ages' },
  { label: 'Babies & Toddlers (0-3)', value: '0-3' },
  { label: 'Young Children (4-7)', value: '4-7' },
  { label: 'Older Children (8-12)', value: '8-12' },
  { label: 'Teenagers (13+)', value: '13+' },
]

const COST_RANGES = [
  { label: 'Any Budget', value: 'any' },
  { label: 'Free only', value: 'free' },
  { label: 'Under £10', value: 'under £10' },
  { label: '£10 - £25', value: '£10 to £25' },
  { label: '£25 - £50', value: '£25 to £50' },
  { label: '£50+', value: 'over £50' },
]

function looksLikePostcode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim())
}

function App() {

  // Read URL params on load — allows pre-filling form from a shared link
  // This runs once on mount; if URL has no params it's a no-op
  // This actually isn't used yet, but I've kept it for later use
  const _urlParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return decodeSearchParams(window.location.search)
    }
    return null
  }, [])

  const navigate = useNavigate()

  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<SelectedVibe[]>([])
  const [locationText, setLocationText] = useState('')
  const [quickPickCity, setQuickPickCity] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(5)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Date state — preset or custom
  const [date, setDate] = useState('today')
  const [customDate, setCustomDate] = useState('')

  // Duration state — preset or custom
  const [duration, setDuration] = useState('any')
  const [customDurationHours, setCustomDurationHours] = useState('')
  const [customDurationMins, setCustomDurationMins] = useState('')

  // Time of day state — preset or custom
  const [timeOfDay, setTimeOfDay] = useState('any')
  const [customTimeFrom, setCustomTimeFrom] = useState('')
  const [customTimeTo, setCustomTimeTo] = useState('')

  const [ageRange, setAgeRange] = useState('all ages')
  const [costRange, setCostRange] = useState('any')
  const [freeText, setFreeText] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleActivity = (value: string) => {
    setSelectedActivities(prev =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    )
  }

  const toggleVibe = (vibe: { label: string; value: string }) => {
    setSelectedVibes(prev =>
      prev.some(v => v.value === vibe.value)
        ? prev.filter(v => v.value !== vibe.value)
        : [...prev, { label: vibe.label, value: vibe.value }]
    )
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('error'); return }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocationText('Current location')
        setLocationStatus('success')
      },
      () => { setLocationStatus('error'); setLatitude(null); setLongitude(null) }
    )
  }

  const lookupPostcode = async (postcode: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
      const data = await response.json()
      if (data.status === 200) return { lat: data.result.latitude, lng: data.result.longitude }
      return null
    } catch { return null }
  }

  const handleLocationChange = async (value: string) => {
    setLocationText(value)
    setLatitude(null); setLongitude(null); setLocationStatus('idle')
    if (looksLikePostcode(value)) {
      const coords = await lookupPostcode(value)
      if (coords) { setLatitude(coords.lat); setLongitude(coords.lng); setLocationStatus('success') }
    }
  }

  const handleQuickPickCity = (city: string) => {
    setLocationText(city)
    setQuickPickCity(city)
    setLatitude(null); setLongitude(null); setLocationStatus('idle')
  }

  // Build the resolved date string to pass to the backend
  const getResolvedDate = (): string => {
    if (date === 'custom' && customDate) {
      // Format custom date as a readable string e.g. "2026-09-22"
      const d = new Date(customDate)
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    return date
  }

  // Build the resolved duration string
  const getResolvedDuration = (): string => {
    if (duration === 'any') return ''
    if (duration === 'custom') {
      const h = customDurationHours || '0'
      const m = customDurationMins || '0'
      if (h === '0' && m === '0') return ''
      return `${h} hours ${m} minutes`
    }
    return duration
  }

  // Build the resolved time of day string
  const getResolvedTimeOfDay = (): string => {
    if (timeOfDay === 'any') return ''
    if (timeOfDay === 'custom') {
      if (!customTimeFrom && !customTimeTo) return ''
      return `between ${customTimeFrom || 'any time'} and ${customTimeTo || 'any time'}`
    }
    return timeOfDay
  }

  const handleSearch = async () => {
    if (!locationText.trim()) {
      alert('Please enter a location or use your current location')
      return
    }

    setLoading(true)

    const searchParams = {
      activities: selectedActivities.length > 0 ? selectedActivities : ['family activities'],
      vibes: selectedVibes,
      location: locationText.trim(),
      latitude,
      longitude,
      radius_miles: radiusMiles,
      date: getResolvedDate(),
      age_range: ageRange,
      cost_range: costRange,
      free_text: freeText.trim() || null,
      duration: getResolvedDuration() || null,
      time_of_day: getResolvedTimeOfDay() || null,
    }

    navigate('/results', { state: { searchParams, loading: true } })
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-base-200 flex items-center justify-center p-6 pb-16">

      {/* About + Contact buttons */}
      <div className="absolute top-4 left-4 flex gap-2">
        <a href="/about" className="btn btn-primary btn-sm">About</a>
        <a href="/contact" className="btn btn-primary btn-sm">Contact</a>
      </div>

      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-primary mb-2">Halfterm</h1>
          <p className="text-base-content/70 text-lg">Find things to do with your kids</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6">

            {/* What */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">What are you looking for?</span>
                <span className="label-text-alt text-base-content/50">Pick one or more</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACTIVITIES.map(activity => (
                  <button key={activity.value} onClick={() => toggleActivity(activity.value)}
                    className={`btn btn-sm flex-col h-auto py-3 gap-0.5 ${selectedActivities.includes(activity.value) ? 'btn-primary' : 'btn-outline'}`}>
                    <span className="text-xl">{activity.emoji}</span>
                    <span className="text-xs font-semibold">{activity.label}</span>
                    <span className="text-[9px] opacity-60 leading-tight text-center">{activity.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Something specific */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Looking for something specific?</span>
                <span className="label-text-alt text-base-content/50">Optional</span>
              </label>
              <input type="text" className="input input-bordered w-full"
                placeholder="e.g. go karting, baking class, dinosaur workshop..."
                value={freeText} onChange={e => setFreeText(e.target.value)} />
            </div>

            {/* What kind of experience */}
            <div>
              <label className="label pb-1">
                <span className="label-text font-semibold text-base">What kind of experience?</span>
                <span className="label-text-alt text-base-content/40 italic">Optional</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_VIBES.map(vibe => (
                  <button key={vibe.value} onClick={() => toggleVibe(vibe)}
                    className={`btn btn-sm flex-col h-auto py-2 gap-0.5 ${selectedVibes.some(v => v.value === vibe.value) ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                    <span className="text-lg">{vibe.emoji}</span>
                    <span className="text-xs font-medium">{vibe.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Where */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Where?</span>
              </label>
              <button className={`btn btn-outline btn-block mb-3 ${locationStatus === 'loading' ? 'loading' : ''}`}
                onClick={handleUseCurrentLocation} disabled={locationStatus === 'loading'}>
                {locationStatus === 'loading' && '⏳ Getting location...'}
                {locationStatus === 'success' && latitude !== null && locationText === 'Current location' && '📍 Using current location ✓'}
                {locationStatus === 'error' && '❌ Location unavailable — please type below'}
                {locationStatus === 'idle' && '📍 Use my current location'}
              </button>
              <LocationAutocomplete
                value={locationText === 'Current location' ? '' : locationText}
                onChange={handleLocationChange}
                onLocationSelect={(location, lat, lng) => {
                  setLocationText(location)
                  setLatitude(lat)
                  setLongitude(lng)
                  setLocationStatus(lat ? 'success' : 'idle')
                }}
              />
              <div className="mb-3" />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-base-content/60 shrink-0">Within (miles):</span>
                <div className="flex gap-1">
                  {RADIUS_OPTIONS.map(miles => (
                    <button key={miles} onClick={() => setRadiusMiles(miles)}
                      className={`btn btn-xs px-1.5 ${radiusMiles === miles ? 'btn-primary' : 'btn-outline'}`}>
                      {miles}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/60 shrink-0">Or quick pick a city:</span>
                <select className="select select-bordered select-sm flex-1" value={quickPickCity}
                  onChange={e => { if (e.target.value) handleQuickPickCity(e.target.value) }}>
                  <option value="" disabled>Select a city...</option>
                  {QUICK_PICK_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>

            {/* Row 1 — Time filters: When / How long / What time */}
            <div className="grid grid-cols-3 gap-3">

              {/* When */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-sm">When?</span>
                </label>
                <select className="select select-bordered w-full select-sm" value={date} onChange={e => setDate(e.target.value)}>
                  {DATES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {date === 'custom' && (
                  <input type="date" className="input input-bordered w-full mt-2 input-sm"
                    value={customDate} onChange={e => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>

              {/* How long */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-sm">How long?</span>
                </label>
                <select className="select select-bordered w-full select-sm" value={duration} onChange={e => setDuration(e.target.value)}>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {duration === 'custom' && (
                  <div className="flex gap-1 mt-2">
                    <input type="number" className="input input-bordered input-sm w-full"
                      placeholder="hrs" min="0" max="24"
                      value={customDurationHours} onChange={e => setCustomDurationHours(e.target.value)} />
                    <input type="number" className="input input-bordered input-sm w-full"
                      placeholder="mins" min="0" max="59"
                      value={customDurationMins} onChange={e => setCustomDurationMins(e.target.value)} />
                  </div>
                )}
              </div>

              {/* What time */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-sm">What time?</span>
                </label>
                <select className="select select-bordered w-full select-sm" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}>
                  {TIMES_OF_DAY.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {timeOfDay === 'custom' && (
                  <div className="flex gap-1 mt-2 items-center">
                    <input type="time" className="input input-bordered input-sm w-full"
                      value={customTimeFrom} onChange={e => setCustomTimeFrom(e.target.value)} />
                    <span className="text-xs text-base-content/50 shrink-0">to</span>
                    <input type="time" className="input input-bordered input-sm w-full"
                      value={customTimeTo} onChange={e => setCustomTimeTo(e.target.value)} />
                  </div>
                )}
              </div>

            </div>

            {/* Row 2 — Who / Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-sm">Ages?</span>
                </label>
                <select className="select select-bordered w-full select-sm" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
                  {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-sm">Budget?</span>
                </label>
                <select className="select select-bordered w-full select-sm" value={costRange} onChange={e => setCostRange(e.target.value)}>
                  {COST_RANGES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-lg mt-2" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default App
