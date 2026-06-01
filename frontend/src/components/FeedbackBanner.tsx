// ---- FEEDBACK BANNER COMPONENT ----
// Shown during early user testing to invite feedback
// Subtle — sits at the bottom of the page, doesn't interrupt the experience
// Remove or hide this component once early testing is complete

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScuE7Xd5o8EbB9OpxKn073oLGNpk5iL5WtVth8rAbFYSuMgqw/viewform?usp=dialog'

function FeedbackBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-primary text-primary-content py-2 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          🧪 We're in early testing and your feedback shapes what we build next!
        </p>
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm bg-white text-primary hover:bg-white/90 border-none shrink-0"
        >
          Share feedback →
        </a>
      </div>
    </div>
  )
}

export default FeedbackBanner
