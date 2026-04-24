// React's strict mode wrapper - highlights potential problems during development
import { StrictMode } from 'react'

// createRoot is how React attaches itself to the HTML page
import { createRoot } from 'react-dom/client'

// BrowserRouter - gives the app URL awareness
// Routes - the container that holds all our routes
// Route - defines a single route (a URL and which component to show)
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Our two pages
import App from './App'
import Results from './Results'

// Global styles
import './index.css'

// Find the <div id="root"> in index.html and mount the React app inside it
createRoot(document.getElementById('root')!).render(
  // StrictMode runs extra checks in development to catch bugs early
  <StrictMode>
    {/* BrowserRouter gives all child components access to the current URL */}
    <BrowserRouter>
      <Routes>
        {/* When URL is "/" show the homepage */}
        <Route path="/" element={<App />} />
        {/* When URL is "/results" show the results page */}
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)