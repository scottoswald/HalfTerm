import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SelectedVibe } from './types'

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

const DATES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Weekend', value: 'this weekend' },
  { label: 'This Week', value: 'this week' },
  { label: 'Next Week', value: 'next week' },
]

const AGE_RANGES = [
  { label: 'Babies & Toddlers (0-3)', value: '0-3' },
  { label: 'Young Children (4-7)', value: '4-7' },
  { label: 'Older Children (8-12)', value: '8-12' },
  { label: 'Teenagers (13+)', value: '13+' },
  { label: 'All Ages', value: 'all ages' },
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
  const navigate = useNavigate()

  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<SelectedVibe[]>([])
  const [locationText, setLocationText] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(5)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [date, setDate] = useState('today')
  const [ageRange, setAgeRange] = useState('all ages')
  const [costRange, setCostRange] = useState('any')
  const [freeText, setFreeText] = useState('')
  const [quickPickCity, setQuickPickCity] = useState('')

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
    setLatitude(null)
    setLongitude(null)
    setLocationStatus('idle')
  }

  const handleSearch = async () => {
    if (!locationText.trim()) {
      alert('Please enter a location or use your current location')
      return
    }

    const searchParams = {
      activities: selectedActivities.length > 0 ? selectedActivities : ['family activities'],
      vibes: selectedVibes,
      location: locationText.trim(),
      latitude,
      longitude,
      radius_miles: radiusMiles,
      date,
      age_range: ageRange,
      cost_range: costRange,
      free_text: freeText.trim() || null,
    }

    // Navigate immediately to results page with loading state
    // Results page will call both /search/venues and /search/events independently
    // Venues will appear first (~5-8s), events will follow (~15-25s)
    navigate('/results', { state: { searchParams, loading: true } })
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
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
              <div className="grid grid-cols-4 gap-2">
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
                    className={`btn btn-sm flex-col h-auto py-2 gap-0.5 ${selectedVibes.some(v => v.value === vibe.value) ? 'btn-secondary' : 'btn-ghost border border-base-300'}`}>
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
              <input type="text" className="input input-bordered w-full mb-3"
                placeholder="Type a postcode, town, city or village..."
                value={locationText === 'Current location' ? '' : locationText}
                onChange={e => handleLocationChange(e.target.value)} />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-base-content/60 shrink-0">Within:</span>
                <div className="flex gap-1 flex-wrap">
                  {RADIUS_OPTIONS.map(miles => (
                    <button key={miles} onClick={() => setRadiusMiles(miles)}
                      className={`btn btn-xs ${radiusMiles === miles ? 'btn-primary' : 'btn-outline'}`}>
                      {miles}mi
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

            {/* When / Who / Budget */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label"><span className="label-text font-semibold">When?</span></label>
                <select className="select select-bordered w-full" value={date} onChange={e => setDate(e.target.value)}>
                  {DATES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text font-semibold">Who's coming?</span></label>
                <select className="select select-bordered w-full" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
                  {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text font-semibold">Budget?</span></label>
                <select className="select select-bordered w-full" value={costRange} onChange={e => setCostRange(e.target.value)}>
                  {COST_RANGES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-lg mt-2" onClick={handleSearch}>
              Search
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default App
