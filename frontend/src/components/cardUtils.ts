// ---- CARD UTILITY FUNCTIONS ----
// Shared utilities used by EventCard and VenueCard

/**
 * Generate initials from a venue or event name for the image fallback.
 * Skips short words like "at", "the", "of" and takes up to 3 initials.
 * e.g. "Natural History Museum" -> "NHM"
 * e.g. "Paddington Bear Experience" -> "PBE"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('')
}