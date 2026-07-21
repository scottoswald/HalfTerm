// ---- URL PARAMETER UTILITIES ----
// Encodes search params into URL query string and decodes them back.
// Allows searches to be shared as links e.g.
// halfterm.up.railway.app/results?activities=Museums,Outdoors&location=London&date=today

import type { SearchParams, SelectedVibe } from '../types'

// All available vibes — needed to reconstruct SelectedVibe objects from URL labels
const VIBE_OPTIONS = [
  { emoji: '💸', label: 'Free & Low Cost', value: 'free and low cost, suitable for families on a tight budget' },
  { emoji: '🤝', label: 'Local & Grassroots', value: 'local, community-run, volunteer-led or grassroots' },
  { emoji: '🌍', label: 'Cultural', value: 'celebrating different cultures, heritages or languages' },
  { emoji: '💜', label: 'Accessible', value: 'accessible and inclusive for children with additional needs, disabilities or sensory sensitivities' },
  { emoji: '😴', label: 'Calm & Quiet', value: 'calm, quiet and not overwhelming — good for children who find busy or loud environments difficult' },
  { emoji: '📖', label: 'Strong Learning Focus', value: 'genuinely educational with strong learning value, not just fun' },
  { emoji: '🌱', label: 'Eco & Nature', value: 'environmentally focused, conservation-led or nature-based' },
  { emoji: '✨', label: 'Hidden Gem', value: 'lesser-known, off the beaten track, avoiding tourist crowds' },
  { emoji: '🎲', label: 'Surprise Me', value: 'surprise the family with something unexpected and different' },
]

/**
 * Encode search params into a URL query string.
 * Only includes non-default values to keep URLs short.
 */
export function encodeSearchParams(params: SearchParams): string {
  const query = new URLSearchParams()

  if (params.activities.length > 0) {
    query.set('activities', params.activities.join(','))
  }

  if (params.location) {
    query.set('location', params.location)
  }

  if (params.date && params.date !== 'today') {
    query.set('date', params.date)
  }

  if (params.age_range && params.age_range !== 'all ages') {
    query.set('ages', params.age_range)
  }

  if (params.cost_range && params.cost_range !== 'any') {
    query.set('budget', params.cost_range)
  }

  if (params.radius_miles && params.radius_miles !== 5) {
    query.set('radius', String(params.radius_miles))
  }

  if (params.latitude && params.longitude) {
    query.set('lat', String(params.latitude))
    query.set('lng', String(params.longitude))
  }

  if (params.vibes && params.vibes.length > 0) {
    query.set('vibes', params.vibes.map(v => v.label).join(','))
  }

  if (params.free_text) {
    query.set('q', params.free_text)
  }

  if (params.duration && params.duration !== 'any') {
    query.set('duration', params.duration)
  }

  if (params.time_of_day && params.time_of_day !== 'any') {
    query.set('time', params.time_of_day)
  }

  return query.toString()
}

/**
 * Decode URL query string back into SearchParams.
 * Missing params fall back to sensible defaults.
 */
export function decodeSearchParams(search: string): SearchParams | null {
  const query = new URLSearchParams(search)

  const activitiesStr = query.get('activities')
  if (!activitiesStr && !query.get('location')) return null

  const vibeLabels = query.get('vibes')?.split(',') || []
  const vibes: SelectedVibe[] = vibeLabels
    .map(label => VIBE_OPTIONS.find(v => v.label === label.trim()))
    .filter((v): v is typeof VIBE_OPTIONS[0] => v !== undefined)
    .map(v => ({ label: v.label, value: v.value }))

  return {
    activities: activitiesStr ? activitiesStr.split(',').map(a => a.trim()) : ['family activities'],
    location: query.get('location') || '',
    date: query.get('date') || 'today',
    age_range: query.get('ages') || 'all ages',
    cost_range: query.get('budget') || 'any',
    radius_miles: parseInt(query.get('radius') || '5'),
    latitude: query.get('lat') ? parseFloat(query.get('lat')!) : null,
    longitude: query.get('lng') ? parseFloat(query.get('lng')!) : null,
    vibes,
    free_text: query.get('q') || null,
    duration: query.get('duration') || null,
    time_of_day: query.get('time') || null,
  }
}
