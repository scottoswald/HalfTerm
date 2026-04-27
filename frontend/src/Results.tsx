import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import './App.css'

function Results() {
  // useLocation gives us access to the state passed from the previous page
  const location = useLocation()
  const navigate = useNavigate()

  // Extract the result from location state
  // Falls back to a default message if someone navigates here directly
  const result = location.state?.result || 'No results found.'

  return (
    <div className="container">
      <h1 className="logo">Halfterm</h1>
      <p className="tagline">Here's what we found for you</p>

      {/* ReactMarkdown renders the agent's markdown response as proper HTML */}
      <div className="results-box">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      {/* Back button to return to the homepage for a new search */}
      <button
        className="search-btn back-btn"
        onClick={() => navigate('/')}
      >
        Search Again
      </button>
    </div>
  )
}

export default Results