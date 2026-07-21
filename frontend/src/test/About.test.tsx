import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '../About'

describe('About page', () => {

  it('renders the Halfterm logo', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getAllByText('Halfterm').length).toBeGreaterThan(0)
  })

  it('renders the about this project heading', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('About this project')).toBeInTheDocument()
  })

  it('renders the built with section', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('Built With')).toBeInTheDocument()
  })

  it('renders tech stack badges', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('FastAPI')).toBeInTheDocument()
  })

  it('renders the links section', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('Links')).toBeInTheDocument()
  })

  it('renders GitHub and LinkedIn links', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('Halfterm on GitHub')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('renders the feedback button', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('Share your feedback')).toBeInTheDocument()
  })

  it('renders the back to search button', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByText('← Back to search')).toBeInTheDocument()
  })

})
