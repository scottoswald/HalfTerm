import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Contact from '../Contact'

vi.stubGlobal('fetch', vi.fn())

describe('Contact page', () => {

  it('renders the Halfterm logo', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByText('Halfterm')).toBeInTheDocument()
  })

  it('renders the get in touch heading', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByText('Get in touch')).toBeInTheDocument()
  })

  it('renders the name input', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByPlaceholderText('e.g. Jane Smith')).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByPlaceholderText('e.g. jane@example.com')).toBeInTheDocument()
  })

  it('renders the message textarea', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
  })

  it('renders the send button', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByText('Send message →')).toBeInTheDocument()
  })

  it('shows alert when submitted with empty fields', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<MemoryRouter><Contact /></MemoryRouter>)
    fireEvent.click(screen.getByText('Send message →'))
    expect(alertMock).toHaveBeenCalledWith('Please fill in all fields before sending.')
    alertMock.mockRestore()
  })

  it('renders back to search button', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByText('← Back to search')).toBeInTheDocument()
  })

})
