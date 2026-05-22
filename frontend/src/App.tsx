import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Activity options — each has an emoji, label, subtitle and value to pass to the agent
// Subtitle gives users more context about what each category covers
// 16 categories in a 4x4 grid
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

// UK cities for the location dropdown
const LOCATIONS = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh',
  'Glasgow', 'Bristol', 'Cardiff', 'Liverpool', 'Newcastle',
  'Brighton', 'Oxford', 'Cambridge', 'Bath',
]

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
// 'any' is the default — means no budget restriction
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

function App() {
  const navigate = useNavigate()

  // selectedActivities is an array because users can pick multiple
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [location, setLocation] = useState('London')
  const [date, setDate] = useState('today')
  const [ageRange, setAgeRange] = useState('all ages')
  // Default to 'any' so no budget restriction is applied unless user chooses one
  const [costRange, setCostRange] = useState('any')
  // Optional free text search — works alongside the activity grid
  // User can type anything specific e.g. "go karting" or "baking class"
  const [freeText, setFreeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Toggle an activity on or off when clicked
  // If it's already selected, remove it. If not, add it.
  const toggleActivity = (value: string) => {
    setSelectedActivities(prev =>
      prev.includes(value)
        ? prev.filter(a => a !== value)
        : [...prev, value]
    )
  }

  const handleSearch = async () => {
    setLoading(true)

    // Cycle through loading messages every 2 seconds while the agent works
    let messageIndex = 0
    setLoadingMessage(LOADING_MESSAGES[0])
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 2000)

    // Build the search params object
    // Results.tsx needs these to re-search when the user removes an activity pill
    const searchParams = {
      activities: selectedActivities.length > 0 ? selectedActivities : ['family activities'],
      location,
      date,
      age_range: ageRange,
      cost_range: costRange,
      // Only include free_text if the user typed something
      // null tells the backend to ignore it
      free_text: freeText.trim() || null,
    }

    try {
      // VITE_BACKEND_URL controls which backend URL to use:
      // - Set to '/api' in Docker — routes through nginx reverse proxy
      // - Unset locally — falls back to localhost:8000 directly
      // - Set to a full URL (e.g. for Railway) — uses that URL directly
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      })

      const data = await response.json()

      // Navigate to results page passing both the result and the search params
      // searchParams is needed by Results.tsx to re-search when activities are removed
      navigate('/results', { state: { result: data, searchParams } })

    } catch (error) {
      console.error('Search failed:', error)
      // Navigate to results with a structured error object
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
      // Always clear the interval and reset loading state
      // whether the search succeeded or failed
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  return (
    // min-h-screen makes the background fill the whole screen
    // bg-base-200 is a Daisy UI class for a soft background colour
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-primary mb-2">Halfterm</h1>
          <p className="text-base-content/70 text-lg">Find things to do with your kids</p>
        </div>

        {/* Search card — card and card-body are Daisy UI classes */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6">

            {/* Activity grid — multi select, 4x4 grid */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">
                  What are you looking for?
                </span>
                <span className="label-text-alt text-base-content/50">
                  Pick one or more
                </span>
              </label>
              {/* Grid of clickable activity buttons — selected ones turn primary orange */}
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITIES.map(activity => (
                  <button
                    key={activity.value}
                    onClick={() => toggleActivity(activity.value)}
                    // btn-primary applies when selected, btn-outline when not
                    className={`btn btn-sm flex-col h-auto py-3 gap-0.5 ${
                      selectedActivities.includes(activity.value)
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    <span className="text-xl">{activity.emoji}</span>
                    <span className="text-xs font-semibold">{activity.label}</span>
                    {/* Subtitle gives context about what the category covers */}
                    <span className="text-[9px] opacity-60 leading-tight text-center">
                      {activity.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Free text search — optional, works alongside the activity grid */}
            {/* Claude handles spelling mistakes and interprets the intent */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">
                  Looking for something specific?
                </span>
                <span className="label-text-alt text-base-content/50">
                  Optional
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. go karting, baking class, dinosaur workshop..."
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
              />
            </div>

            {/* Location dropdown */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Where?</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={location}
                onChange={e => setLocation(e.target.value)}
              >
                {LOCATIONS.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Date, age range and cost range in a three column row */}
            <div className="grid grid-cols-3 gap-4">

              {/* Date dropdown */}
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

              {/* Age range dropdown */}
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

              {/* Cost range dropdown */}
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

            {/* Search button — disabled while loading to prevent double submits */}
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
