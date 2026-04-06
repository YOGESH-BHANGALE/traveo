'use client';

import { useEffect, useRef } from 'react';

/**
 * LiveTrackingMap — shows real-time positions of both ride participants.
 * Uses Leaflet + OpenStreetMap (no API key needed).
 * Props:
 *   myLocation      { lat, lng }  — current user's live position
 *   companionLocation { lat, lng, name } — companion's live position
 *   myName          string
 *   height          string  (default '320px')
 */
export default function LiveTrackingMap({ myLocation, companionLocation, myName = 'You', height = '320px' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const myMarkerRef = useRef(null);
  const companionMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ltm-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'ltm-pulse-style';
      style.textContent = `
        @keyframes ltmpulse{0%,100%{box-shadow:0 0 0 5px rgba(59,130,246,0.3)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0.08)}}
        @keyframes ltmpulse2{0%,100%{box-shadow:0 0 0 5px rgba(245,158,11,0.3)}50%{box-shadow:0 0 0 12px rgba(245,158,11,0.08)}}
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Init map once
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      if (!mapInstanceRef.current) {
        const center = myLocation
          ? [myLocation.lat, myLocation.lng]
          : [20.5937, 78.9629];
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
          .setView(center, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
      }
    });
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        myMarkerRef.current = null;
        companionMarkerRef.current = null;
        polylineRef.current = null;
      }
    };
  }, []);

  // Update MY marker
  useEffect(() => {
    if (!myLocation || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="background:#3b82f6;color:white;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${myName}</div>
          <div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;animation:ltmpulse 1.5s infinite;box-shadow:0 0 0 5px rgba(59,130,246,0.3)"></div>
        </div>`,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
      });
      if (myMarkerRef.current) {
        myMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng]);
      } else {
        myMarkerRef.current = L.marker([myLocation.lat, myLocation.lng], { icon }).addTo(map);
      }
      updatePolyline(L, map);
    });
  }, [myLocation]);

  // Update COMPANION marker
  useEffect(() => {
    if (!companionLocation || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const name = companionLocation.name || 'Buddy';
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="background:#f59e0b;color:#1a1a1a;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${name}</div>
          <div style="width:14px;height:14px;background:#f59e0b;border:3px solid white;border-radius:50%;animation:ltmpulse2 1.5s infinite;box-shadow:0 0 0 5px rgba(245,158,11,0.3)"></div>
        </div>`,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
      });
      if (companionMarkerRef.current) {
        companionMarkerRef.current.setLatLng([companionLocation.lat, companionLocation.lng]);
      } else {
        companionMarkerRef.current = L.marker([companionLocation.lat, companionLocation.lng], { icon }).addTo(map);
      }
      updatePolyline(L, map);
    });
  }, [companionLocation]);

  const updatePolyline = (L, map) => {
    const my = myMarkerRef.current?.getLatLng();
    const comp = companionMarkerRef.current?.getLatLng();
    if (!my || !comp) return;
    const coords = [my, comp];
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(coords);
    } else {
      polylineRef.current = L.polyline(coords, {
        color: '#6366f1', weight: 2.5, dashArray: '6,5', opacity: 0.7,
      }).addTo(map);
    }
    // Fit both markers in view
    map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 17 });
  };

  return (
    <div ref={mapRef} style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden', zIndex: 0 }} />
  );
}
