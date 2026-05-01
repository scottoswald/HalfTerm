import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  // useNavigate lets us programmatically navigate to different pages
  const navigate = useNavigate()

  // useState tracks whether the search is in progress
  // We use this to disable the button while waiting for the backend
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    // Set loading to true so the button shows "Searching..."
    setLoading(true)

    try {
      // Send a POST request to our FastAPI backend
      // fetch() is the browser's built in way of making HTTP requests
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        // Tell the backend we're sending JSON
        headers: {
          'Content-Type': 'application/json',
        },
        // The body is the data we're sending — must match SearchRequest in main.py
        // JSON.stringify converts the JavaScript object into a JSON string
        body: JSON.stringify({
          activity: 'Museum',
          location: 'London',
          when: 'today',
        }),
      })

      // Parse the JSON response from the backend into a JavaScript object
      const data = await response.json()

      // Navigate to the results page, passing the result as state
      // This is how we pass data between pages in React Router
      navigate('/results', { state: { result: data.result } })

    } catch (error) {
      // Log the error for debugging
      console.error('Search failed:', error)
  
      // Navigate to results page with an error message
      // This way the user sees something helpful rather than a blank page
      navigate('/results', { 
        state: { result: 'Sorry, something went wrong with your search. Please try again.' } 
      })
    } finally {
      // Whether it succeeded or failed, turn off the loading state
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

        {/* Button shows "Searching..." while waiting for the backend response */}
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  )
}

export default App