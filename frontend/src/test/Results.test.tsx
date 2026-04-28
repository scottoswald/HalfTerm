import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Results from '../Results'

// Helper that renders Results with state passed in
// just like React Router would when navigating from App.tsx
const renderWithResult = (result: string) => {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/results', state: { result } }]}
    >
      <Routes>
        <Route path="/results" element={<Results />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Results component', () => {

  it('renders the Halfterm logo', () => {
    renderWithResult('Some activities')
    expect(screen.getByText('Halfterm')).toBeInTheDocument()
  })

  it('renders the result passed in via route state', () => {
    renderWithResult('Science Museum activities for kids')
    expect(screen.getByText('Science Museum activities for kids')).toBeInTheDocument()
  })

  it('renders a fallback message when no result is passed', () => {
    // Render without any state to test the fallback
    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/results" element={<Results />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('No results found.')).toBeInTheDocument()
  })

  it('renders the Search Again button', () => {
    renderWithResult('Some activities')
    expect(screen.getByText('Search Again')).toBeInTheDocument()
  })

})