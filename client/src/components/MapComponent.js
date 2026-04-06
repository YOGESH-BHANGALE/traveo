'use client';

import { useEffect, useRef } from 'react';

export default function MapComponent({
  source,
  destination,
  userLocation,
  nearbyTrips = [],
  height = '400px',
  showRoute = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inject leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject pulse animation CSS once
    if (!document.getElementById('lf-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'lf-pulse-style';
      style.textContent = `@keyframes lfpulse{0%,100%{box-shadow:0 0 0 6px rgba(59,130,246,0.25)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0.1)}}`;
      document.head.appendChild(style);
    }

    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const center = userLocation
          ? [userLocation.lat, userLocation.lng]
          : source
          ? [source.lat, source.lng]
          : [20.5937, 78.9629];

        const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // User live location — blue pulsing dot
      if (userLocation) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.25);animation:lfpulse 1.5s infinite"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        markersRef.current.push(L.marker([userLocation.lat, userLocation.lng], { icon }).addTo(map).bindPopup('You'));
        map.setView([userLocation.lat, userLocation.lng], map.getZoom());

        // 1.5 km radius circle
        markersRef.current.push(
          L.circle([userLocation.lat, userLocation.lng], {
            radius: 1500, color: '#3b82f6', fillColor: '#3b82f6',
            fillOpacity: 0.05, weight: 1.5, dashArray: '6,4',
          }).addTo(map)
        );
      }

      // Source marker
      if (source) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#22c55e;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍 ${source.address?.split(',')[0] || 'Pickup'}</div>`,
          iconAnchor: [0, 24],
        });
        markersRef.current.push(L.marker([source.lat, source.lng], { icon }).addTo(map));
      }

      // Destination marker
      if (destination) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#ef4444;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏁 ${destination.address?.split(',')[0] || 'Drop'}</div>`,
          iconAnchor: [0, 24],
        });
        markersRef.current.push(L.marker([destination.lat, destination.lng], { icon }).addTo(map));
      }

      // Route line
      if (showRoute && source && destination) {
        const line = L.polyline(
          [[source.lat, source.lng], [destination.lat, destination.lng]],
          { color: '#22c55e', weight: 3, dashArray: '8,6', opacity: 0.8 }
        ).addTo(map);
        markersRef.current.push(line);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
      }

      // Nearby trip markers
      nearbyTrips.forEach((trip) => {
        if (!trip.source?.lat) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#f59e0b;color:#1a1a1a;padding:3px 7px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🚗 ${trip.user?.name?.split(' ')[0] || 'Rider'}</div>`,
          iconAnchor: [0, 20],
        });
        markersRef.current.push(
          L.marker([trip.source.lat, trip.source.lng], { icon })
            .addTo(map)
            .bindPopup(`<b>${trip.user?.name}</b><br/>${trip.source.address?.split(',')[0]} → ${trip.destination?.address?.split(',')[0]}<br/>🕐 ${trip.time}`)
        );
      });
    });
  }, [source, destination, userLocation, nearbyTrips, showRoute]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden', zIndex: 0 }}
    />
  );
}
