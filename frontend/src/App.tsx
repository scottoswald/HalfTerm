import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const navigate = useNavigate()

  // loading tracks whether a search is in progress
  const [loading, setLoading] = useState(false)

  // loadingMessage cycles through different messages while the agent works
  // This gives the user a sense of progress rather than just "Searching..."
  const [loadingMessage, setLoadingMessage] = useState('')

  // An array of messages to cycle through while the search runs
  // Each message hints at what the agent is doing behind the scenes
  const loadingMessages = [
    'Searching for activities...',
    'Checking what\'s on today...',
    'Finding the best museums...',
    'Almost there...',
  ]

  const handleSearch = async () => {
    setLoading(true)

    // Start cycling through loading messages every 2 seconds
    // setInterval runs a function repeatedly at a set interval
    // It returns an ID we can use to stop it later
    let messageIndex = 0
    setLoadingMessage(loadingMessages[0])

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length
      setLoadingMessage(loadingMessages[messageIndex])
    }, 2000)

    try {
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity: 'Museum',
          location: 'London',
          when: 'today',
        }),
      })

      const data = await response.json()

      navigate('/results', { state: { result: data.result } })

    } catch (error) {
      console.error('Search failed:', error)
      navigate('/results', {
        state: { result: 'Sorry, something went wrong with your search. Please try again.' }
      })
    } finally {
      // Always clean up the interval when the search finishes
      // If we don't do this the messages would keep cycling forever
      // clearInterval stops the setInterval we started above
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="logo">Halfterm</h1>
      <p className="tagline">Find things to do with your kids</p>

      <div className="search-box">

        {/* Activity type dropdown - only Museum for MVP */}
        <div className="field">
          <label>What type of activity?</label>
          <select>
            <option>Museum</option>
          </select>
        </div>

        {/* Location dropdown - only London for MVP */}
        <div className="field">
          <label>Where abouts?</label>
          <select>
            <option>London</option>
          </select>
        </div>

        {/* Date dropdown - only Today for MVP */}
        <div className="field">
          <label>When?</label>
          <select>
            <option>Today</option>
          </select>
        </div>

        {/* Button is disabled while loading to prevent double clicks */}
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading}
        >
          {/* Show cycling loading message while searching, otherwise show Search */}
          {loading ? loadingMessage : 'Search'}
        </button>
      </div>
    </div>
  )
}

export default App