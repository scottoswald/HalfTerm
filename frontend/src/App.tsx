import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Activity options — each has an emoji, label and value to pass to the agent
const ACTIVITIES = [
  { emoji: '🏛️', label: 'Museums', value: 'Museums' },
  { emoji: '🎡', label: 'Theme Parks', value: 'Theme Parks' },
  { emoji: '🌳', label: 'Outdoor', value: 'Outdoor Activities' },
  { emoji: '⚽', label: 'Sports', value: 'Sports Events' },
  { emoji: '🎭', label: 'Theatre', value: 'Theatre and Shows' },
  { emoji: '🎨', label: 'Arts & Crafts', value: 'Arts and Crafts' },
  { emoji: '🔬', label: 'Science', value: 'Science and Technology' },
  { emoji: '🦁', label: 'Zoos', value: 'Zoos and Wildlife' },
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
const COST_RANGES = [
  { label: 'Free only', value: 'free' },
  { label: 'Under £10', value: 'under £10' },
  { label: '£10 - £25', value: '£10 to £25' },
  { label: '£25 - £50', value: '£25 to £50' },
  { label: '£50+', value: 'over £50' },
]

// Loading messages to cycle through while the agent works
const LOADING_MESSAGES = [
  'Searching for activities...',
  'Checking what\'s on...',
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
  const [costRange, setCostRange] = useState('any cost')
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
    // If no activities selected, default to all activities
    const activities = selectedActivities.length > 0
      ? selectedActivities.join(', ')
      : 'family activities'

    setLoading(true)

    // Cycle through loading messages every 2 seconds
    let messageIndex = 0
    setLoadingMessage(LOADING_MESSAGES[0])
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 2000)

    try {
      // In Docker, API calls go through nginx reverse proxy at /api/
      // Nginx then forwards them to the backend container internally
      // Locally with Vite, we still hit localhost:8000 directly
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const apiUrl = backendUrl === 'http://localhost:8000' 
        ? 'http://localhost:8000' 
        : '/api'

      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass all five search parameters to the backend
        body: JSON.stringify({
          activity: activities,
          location,
          when: `${date}, suitable for ages ${ageRange}, cost range: ${costRange}`,
        }),
      })

      const data = await response.json()
      navigate('/results', { state: { result: data.result } })

    } catch (error) {
      console.error('Search failed:', error)
      navigate('/results', {
        state: { result: 'Sorry, something went wrong. Please try again.' }
      })
    } finally {
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

            {/* Activity grid — multi select */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">
                  What are you looking for?
                </span>
                <span className="label-text-alt text-base-content/50">
                  Pick one or more
                </span>
              </label>
              {/* Grid of clickable activity cards */}
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITIES.map(activity => (
                  <button
                    key={activity.value}
                    onClick={() => toggleActivity(activity.value)}
                    // btn is a Daisy UI class — btn-primary applies when selected
                    // btn-outline is the unselected state
                    className={`btn btn-sm flex-col h-auto py-3 gap-1 ${
                      selectedActivities.includes(activity.value)
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    <span className="text-xl">{activity.emoji}</span>
                    <span className="text-xs">{activity.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location dropdown */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Where?</span>
              </label>
              {/* select and select-bordered are Daisy UI classes */}
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

            {/* Date, age range and cost range in a row */}
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

            {/* Search button — btn-primary and btn-block are Daisy UI classes */}
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