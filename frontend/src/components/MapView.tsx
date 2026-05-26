import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event, Venue } from '../types'

// ---- LEAFLET ICON FIX ----
// Leaflet's default marker icons break with Vite/webpack because the image
// paths get mangled during bundling. We fix this by setting the icon URLs manually.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom orange marker icon for venues and events
// Matches Halfterm's primary brand colour
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Blue marker icon for the user's current location
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// ---- MAP BOUNDS FITTER ----
// Automatically adjusts the map view to fit all markers when results change
interface FitBoundsProps {
  positions: [number, number][]
}

function FitBounds({ positions }: FitBoundsProps) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

// ---- MAP VIEW COMPONENT ----
interface MapViewProps {
  events: Event[]
  venues: Venue[]
  userLatitude?: number | null
  userLongitude?: number | null
}

function MapView({ events, venues, userLatitude, userLongitude }: MapViewProps) {
  // Default centre — central London
  // This is used before the map fits to the actual results
  const defaultCenter: [number, number] = [51.5074, -0.1278]

  // Collect all result positions for fitting the map bounds
  // Only include results that have valid coordinates
  const resultPositions: [number, number][] = [
    ...events
      .filter(e => e.latitude != null && e.longitude != null)
      .map(e => [e.latitude!, e.longitude!] as [number, number]),
    ...venues
      .filter(v => v.latitude != null && v.longitude != null)
      .map(v => [v.latitude!, v.longitude!] as [number, number]),
  ]

  // Include user location in bounds if available
  const allPositions: [number, number][] = userLatitude != null && userLongitude != null
    ? [[userLatitude, userLongitude], ...resultPositions]
    : resultPositions

  return (
    <div className="rounded-xl overflow-hidden border border-base-200 shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap tiles — free, no API key needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fit map to show all markers */}
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* User location marker — blue pin */}
        {userLatitude != null && userLongitude != null && (
          <Marker position={[userLatitude, userLongitude]} icon={blueIcon}>
            <Popup>
              <div className="text-sm font-semibold">📍 Your location</div>
            </Popup>
          </Marker>
        )}

        {/* Venue markers — orange pins */}
        {venues
          .filter(v => v.latitude != null && v.longitude != null)
          .map((venue, index) => (
            <Marker
              key={`venue-${index}`}
              position={[venue.latitude!, venue.longitude!]}
              icon={orangeIcon}
            >
              <Popup>
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <span className="font-semibold text-sm">{venue.name}</span>
                  <span className="text-xs text-gray-500">{venue.location}</span>
                  {venue.distance_miles !== undefined && (
                    <span className="text-xs text-gray-500">
                      {venue.distance_miles < 0.1 ? 'Nearby' : `${venue.distance_miles.toFixed(1)} miles away`}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${venue.is_free ? 'text-green-600' : 'text-gray-700'}`}>
                    {venue.cost}
                  </span>
                  <a
                    href={venue.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline mt-1"
                  >
                    Get directions
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Event markers — orange pins */}
        {events
          .filter(e => e.latitude != null && e.longitude != null)
          .map((event, index) => (
            <Marker
              key={`event-${index}`}
              position={[event.latitude!, event.longitude!]}
              icon={orangeIcon}
            >
              <Popup>
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <span className="font-semibold text-sm">{event.name}</span>
                  <span className="text-xs text-gray-500">{event.location}</span>
                  <span className="text-xs text-gray-500">{event.date} at {event.time}</span>
                  {event.distance_miles !== undefined && (
                    <span className="text-xs text-gray-500">
                      {event.distance_miles < 0.1 ? 'Nearby' : `${event.distance_miles.toFixed(1)} miles away`}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${event.is_free ? 'text-green-600' : 'text-gray-700'}`}>
                    {event.cost}
                  </span>
                  <a
                    href={event.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline mt-1"
                  >
                    Get directions
                  </a>
                  {event.booking_url && (
                    <a
                      href={event.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      Book now
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

      </MapContainer>
    </div>
  )
}

export default MapView
