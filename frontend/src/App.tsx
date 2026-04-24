// useNavigate is a React Router hook that lets us navigate to different URLs programmatically
import { useNavigate } from 'react-router-dom'

// Our styles
import './App.css'

function App() {
  // navigate() is a function we call to send the user to a different page
  // e.g. navigate('/results') sends the user to the results page
  const navigate = useNavigate()

  return (
    <div className="container">
      <h1 className="logo">Halfterm</h1>
      <p className="tagline">Find fun things for families to do</p>

      {/* The search form - three dropdowns and a search button */}
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

        {/* On click, navigate to the results page */}
        <button className="search-btn" onClick={() => navigate('/results')}>Search</button>
      </div>
    </div>
  )
}

export default App