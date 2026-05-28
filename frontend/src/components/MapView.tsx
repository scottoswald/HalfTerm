import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event, Venue } from '../types'

// ---- LEAFLET ICON FIX ----
// Leaflet's default marker icons break with Vite because image paths get mangled
// during bundling. We fix this by setting the icon URLs manually from CDN.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Orange marker for venues and events — matches Halfterm primary colour
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Blue marker for user's current location
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
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

// ---- HOVER MARKER ----
// A marker that opens its popup on hover (mouseover) as well as click
// On mobile, click still works as normal
interface HoverMarkerProps {
  position: [number, number]
  icon: L.Icon
  children: React.ReactNode
}

function HoverMarker({ position, icon, children }: HoverMarkerProps) {
  const markerRef = useRef<L.Marker>(null)

  return (
    <Marker
      position={position}
      icon={icon}
      ref={markerRef}
      eventHandlers={{
        // Open popup on mouse hover for desktop users
        mouseover: () => markerRef.current?.openPopup(),
      }}
    >
      <Popup>
        {children}
      </Popup>
    </Marker>
  )
}

// ---- MAP VIEW COMPONENT ----
interface MapViewProps {
  events: Event[]
  venues: Venue[]
  userLatitude?: number | null
  userLongitude?: number | null
}

function MapView({ events, venues, userLatitude, userLongitude }: MapViewProps) {
  const defaultCenter: [number, number] = [51.5074, -0.1278]

  const resultPositions: [number, number][] = [
    ...events
      .filter(e => e.latitude != null && e.longitude != null)
      .map(e => [e.latitude!, e.longitude!] as [number, number]),
    ...venues
      .filter(v => v.latitude != null && v.longitude != null)
      .map(v => [v.latitude!, v.longitude!] as [number, number]),
  ]

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
        {/* CartoDB Positron tiles — clean, minimal, free */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* User location marker — blue, no hover needed */}
        {userLatitude != null && userLongitude != null && (
          <Marker position={[userLatitude, userLongitude]} icon={blueIcon}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>📍 Your location</div>
            </Popup>
          </Marker>
        )}

        {/* Venue markers — styled mini card popup */}
        {venues
          .filter(v => v.latitude != null && v.longitude != null)
          .map((venue, index) => (
            <HoverMarker
              key={`venue-${index}`}
              position={[venue.latitude!, venue.longitude!]}
              icon={orangeIcon}
            >
              {/* Mini card — styled to match the list cards */}
              <div style={{ minWidth: '200px', fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', lineHeight: '1.3' }}>
                  {venue.name}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                  📍 {venue.location}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                  🕐 {venue.opening_times}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: venue.is_free ? '#dcfce7' : '#f3f4f6',
                    color: venue.is_free ? '#166534' : '#374151',
                  }}>
                    {venue.cost}
                  </span>
                  {venue.distance_miles !== undefined && (
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {venue.distance_miles < 0.1 ? 'Nearby' : `${venue.distance_miles.toFixed(1)} mi`}
                    </span>
                  )}
                  {venue.rating && (
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      ★ {venue.rating}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={venue.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}
                  >
                    📍 Directions
                  </a>
                  {venue.website_url && (
                    <a
                      href={venue.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>
            </HoverMarker>
          ))}

        {/* Event markers — styled mini card popup */}
        {events
          .filter(e => e.latitude != null && e.longitude != null)
          .map((event, index) => (
            <HoverMarker
              key={`event-${index}`}
              position={[event.latitude!, event.longitude!]}
              icon={orangeIcon}
            >
              <div style={{ minWidth: '200px', fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', lineHeight: '1.3' }}>
                  {event.name}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                  📍 {event.location}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                  📅 {event.date} at {event.time}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: event.is_free ? '#dcfce7' : '#f3f4f6',
                    color: event.is_free ? '#166534' : '#374151',
                  }}>
                    {event.cost}
                  </span>
                  {event.distance_miles !== undefined && (
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {event.distance_miles < 0.1 ? 'Nearby' : `${event.distance_miles.toFixed(1)} mi`}
                    </span>
                  )}
                  {event.rating && (
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      ★ {event.rating}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={event.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}
                  >
                    📍 Directions
                  </a>
                  {event.booking_url && (
                    <a
                      href={event.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Book Now →
                    </a>
                  )}
                </div>
              </div>
            </HoverMarker>
          ))}

      </MapContainer>
    </div>
  )
}

export default MapView
