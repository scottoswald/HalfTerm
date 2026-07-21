import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ---- CONTACT PAGE ----
// Allows users to send Scott a message via the Resend email API.
// The message is sent to Scott's email with reply-to set to the sender's address
// so Scott can reply directly from his email client.

function Contact() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('Please fill in all fields before sending.')
      return
    }

    setStatus('sending')

    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })

      if (response.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-black text-primary mb-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            Halfterm
          </h1>
          <p className="text-base-content/60">Get in touch</p>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">

            {status === 'success' ? (
              // Success state
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Message sent!</h2>
                <p className="text-base-content/70 mb-6">
                  Thanks for getting in touch. I'll get back to you as soon as I can.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('/')} className="btn btn-primary">
                    Back to search
                  </button>
                  <button
                    onClick={() => { setStatus('idle'); setName(''); setEmail(''); setMessage('') }}
                    className="btn btn-outline"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              // Form state
              <>
                <h2 className="text-xl font-bold mb-1">Send a message</h2>
                <p className="text-base-content/60 text-sm mb-6">
                  Whether you have feedback, a question, or just want to say hello, I'd love to hear from you.
                </p>

                {status === 'error' && (
                  <div className="alert alert-error mb-4 text-sm">
                    <span>Something went wrong sending your message. Please try again.</span>
                  </div>
                )}

                {/* Name */}
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Your name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. Jane Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={status === 'sending'}
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Your email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="e.g. jane@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={status === 'sending'}
                  />
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-semibold">Message</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-32"
                    placeholder="What's on your mind?"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={status === 'sending'}
                  />
                </div>

                {/* Submit */}
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleSubmit}
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending...' : 'Send'}
                </button>

              </>
            )}

          </div>
        </div>

        {/* Back links */}
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => navigate('/')} className="btn btn-outline btn-sm">
            ← Back to search
          </button>
          <button onClick={() => navigate('/about')} className="btn btn-outline btn-sm">
            About
          </button>
        </div>

      </div>
    </div>
  )
}

export default Contact
