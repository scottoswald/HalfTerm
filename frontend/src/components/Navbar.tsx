// ---- NAVBAR COMPONENT ----
// Fixed top navigation bar for Halfterm.
// Contains: Halfterm logo (links home), About/Contact links, dark mode toggle.
// Dark mode preference is saved to localStorage.

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Navbar() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('halfterm-theme') === 'dark'
  })

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.setAttribute('data-theme', 'dark')
      localStorage.setItem('halfterm-theme', 'dark')
    } else {
      html.setAttribute('data-theme', 'light')
      localStorage.setItem('halfterm-theme', 'light')
    }
  }, [isDark])

  // Apply saved theme on first load
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('halfterm-theme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-base-100 border-b-2 border-black flex items-center px-4">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">

        {/* Logo — links home */}
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-black text-primary hover:opacity-80 transition-opacity"
        >
          Halfterm
        </button>

        {/* Right side — nav links and dark mode toggle */}
        <div className="flex items-center gap-1">
          <a
            href="/about"
            className="btn btn-ghost btn-sm font-semibold"
          >
            About
          </a>
          <a
            href="/contact"
            className="btn btn-ghost btn-sm font-semibold"
          >
            Contact
          </a>

          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="btn btn-ghost btn-sm btn-square ml-1"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
