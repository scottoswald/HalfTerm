import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function Results() {
  // useLocation gives us access to the state passed from the previous page
  const location = useLocation()
  const navigate = useNavigate()

  // Extract the result from location state
  // Falls back to a default message if someone navigates here directly
  const result = location.state?.result || 'No results found.'

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-primary mb-2">Halfterm</h1>
          <p className="text-base-content/70 text-lg">Here's what we found for you</p>
        </div>

        {/* Results card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            {/* prose is a Tailwind class that styles markdown content beautifully */}
            {/* It adds proper spacing, headings, list styles etc to rendered markdown */}
            <div className="prose prose-sm max-w-none">
              {/* remarkGfm adds GitHub Flavoured Markdown support */}
              {/* This enables tables, strikethrough and other extended markdown features */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => navigate('/')}
        >
          Search Again
        </button>

      </div>
    </div>
  )
}

export default Results