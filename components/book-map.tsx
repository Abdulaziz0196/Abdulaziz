"use client"

import { useEffect, useRef, useState } from 'react'
import type { BookWithOwner } from '@/lib/types'

interface BookMapProps {
  books: BookWithOwner[]
  userLocation: { lat: number; lng: number } | null
  onBookClick?: (bookId: string) => void
  onMapClick?: (lat: number, lng: number) => void
  selectable?: boolean
  selectedLocation?: { lat: number; lng: number } | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletType = any

export function BookMap({
  books,
  userLocation,
  onBookClick,
  onMapClick,
  selectable = false,
  selectedLocation,
}: BookMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletType | null>(null)
  const markersRef = useRef<LeafletType[]>([])
  const selectedMarkerRef = useRef<LeafletType | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<LeafletType | null>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import leaflet only on client
    import('leaflet').then((leaflet) => {
      import('leaflet/dist/leaflet.css')
      setL(leaflet.default)
    })
  }, [])

  useEffect(() => {
    if (!isClient || !L || !mapContainer.current || mapRef.current) return

    // Default Tashkent location
    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [41.3111, 69.2797]

    mapRef.current = L.map(mapContainer.current).setView(defaultCenter, 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current)

    // Click event for selectable map
    if (selectable && onMapClick) {
      mapRef.current.on('click', (e: LeafletType) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient, L, userLocation, selectable, onMapClick])

  // Update markers when books change
  useEffect(() => {
    if (!mapRef.current || !isClient || !L) return

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Create book icon
    const bookIcon = L.divIcon({
      className: 'custom-book-marker',
      html: `<div style="
        background: hsl(250, 60%, 55%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    // Add book markers
    books.forEach((book) => {
      const marker = L.marker([book.location.lat, book.location.lng], {
        icon: bookIcon,
      }).addTo(mapRef.current!)

      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${book.title}</strong>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">${book.author}</p>
          <p style="margin: 4px 0; font-size: 12px;">
            <strong>${book.pricePerDay.toLocaleString()}</strong> so'm/kun
          </p>
          ${book.distance !== undefined ? `<p style="margin: 4px 0; color: #888; font-size: 11px;">${book.distance.toFixed(1)} km</p>` : ''}
        </div>
      `)

      if (onBookClick) {
        marker.on('click', () => {
          onBookClick(book.id)
        })
      }

      markersRef.current.push(marker)
    })

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="
          background: hsl(150, 60%, 45%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      }).addTo(mapRef.current)

      userMarker.bindPopup('Sizning joylashuvingiz')
      markersRef.current.push(userMarker)
    }
  }, [books, userLocation, onBookClick, isClient, L])

  // Update selected location marker
  useEffect(() => {
    if (!mapRef.current || !isClient || !selectable || !L) return

    // Remove old selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove()
      selectedMarkerRef.current = null
    }

    if (selectedLocation) {
      const selectedIcon = L.divIcon({
        className: 'custom-selected-marker',
        html: `<div style="
          background: hsl(25, 80%, 55%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      })

      selectedMarkerRef.current = L.marker(
        [selectedLocation.lat, selectedLocation.lng],
        { icon: selectedIcon }
      ).addTo(mapRef.current)

      selectedMarkerRef.current.bindPopup('Tanlangan joylashuv')

      // Center map on selected location
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15)
    }
  }, [selectedLocation, selectable, isClient, L])

  if (!isClient) {
    return (
      <div className="w-full h-full bg-muted animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Xarita yuklanmoqda...</span>
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  )
}
