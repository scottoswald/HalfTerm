// ---- STAR RATING COMPONENT ----
// Renders a star rating visually e.g. ★★★★½ for 4.5
// Used on both EventCard and VenueCard when a rating is available

interface StarRatingProps {
  rating: number
}

function StarRating({ rating }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <span className="text-warning text-sm">
      {'★'.repeat(fullStars)}
      {hasHalf ? '½' : ''}
      {'☆'.repeat(emptyStars)}
      <span className="text-base-content/60 ml-1">{rating}</span>
    </span>
  )
}

export default StarRating