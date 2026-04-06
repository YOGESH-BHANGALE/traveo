'use client';

import { useState, useEffect, useRef } from 'react';
import { FiX, FiMapPin, FiCheck, FiNavigation } from 'react-icons/fi';

const MH_CENTER = [19.7515, 75.7139];
const MH_BOUNDS = [[15.6, 72.6], [22.1, 80.9]];

export default function MapPickerModal({ isOpen, onClose, onConfirm, title, initialLocation }) {
  const [markerPos, setMarkerPos] = useState(null);
  const [geocodedResult, setGeocodedResult] = useState(null); // full structured result
  const [geocoding, setGeocoding] = useState(false);
  const [MapComponents, setMapComponents] = useState(null);
  const mapRef = useRef(null);

  // Load Leaflet dynamically (SSR safe)
  useEffect(() => {
    if (!isOpen) return;
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
    Promise.all([
      import('react-leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl]) => {
      setMapComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        useMapEvents: rl.useMapEvents,
        useMap: rl.useMap,
      });
    });
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialLocation?.lat && initialLocation?.lng) {
      setMarkerPos([initialLocation.lat, initialLocation.lng]);
      setGeocodedResult(initialLocation);
    } else {
      setMarkerPos(null);
      setGeocodedResult(null);
    }
  }, [isOpen]);

  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setGeocodedResult(null);
    try {
      const res = await fetch(`/api/places/geocode?latlng=${lat},${lng}`);
      const data = await res.json();
      const result = data.results?.[0];
      if (result) {
        const comps = result.address_components || [];
        const get = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
        const structured = {
          address: result.formatted_address,
          lat,
          lng,
          placeId: result.place_id,
          landmark: comps[0]?.long_name || result.formatted_address.split(',')[0],
          area: get('sublocality_level_1') || get('sublocality') || get('neighborhood') || get('locality'),
          region: get('administrative_area_level_2') || get('administrative_area_level_1'),
          pincode: get('postal_code'),
          city: get('locality') || get('administrative_area_level_2'),
        };
        setGeocodedResult(structured);
        return structured;
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    } finally {
      setGeocoding(false);
    }
    // Fallback if geocode fails
    const fallback = {
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat, lng, landmark: 'Pinned Location',
      area: '', region: 'Maharashtra', pincode: '', city: '',
    };
    setGeocodedResult(fallback);
    return fallback;
  };

  const handleMapClick = (lat, lng) => {
    setMarkerPos([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Confirm uses the already-geocoded result — no extra fetch
  const handleConfirm = () => {
    if (!geocodedResult) return;
    onConfirm(geocodedResult);
    // onClose is handled by the parent after onConfirm
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setMarkerPos([lat, lng]);
        reverseGeocode(lat, lng);
        if (mapRef.current) mapRef.current.setView([lat, lng], 16);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  const canConfirm = !!geocodedResult && !geocoding;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-brand-950">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300 hover:bg-brand-700 transition-colors">
          <FiX size={20} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{title || 'Pick Location'}</p>
          <p className="text-xs text-brand-400">Tap anywhere on the map to pin</p>
        </div>
        <button onClick={handleMyLocation}
          className="flex items-center gap-1.5 text-xs text-accent-400 font-semibold bg-accent-400/10 px-3 py-2 rounded-xl border border-accent-400/20 active:scale-95 transition-all">
          <FiNavigation size={13} /> My Location
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        {!MapComponents ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-900">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
          </div>
        ) : (
          <MapComponents.MapContainer
            center={markerPos || MH_CENTER}
            zoom={markerPos ? 15 : 7}
            style={{ height: '100%', width: '100%' }}
            maxBounds={MH_BOUNDS}
            maxBoundsViscosity={0.8}
            ref={mapRef}
          >
            <MapComponents.TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ClickHandler onMapClick={handleMapClick} MapEvents={MapComponents.useMapEvents} />
            {markerPos && <MapComponents.Marker position={markerPos} />}
            {markerPos && <PanTo position={markerPos} useMap={MapComponents.useMap} />}
          </MapComponents.MapContainer>
        )}

        {/* Hint overlay when no pin yet */}
        {!markerPos && MapComponents && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
            <div className="bg-brand-900/90 backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-brand-700 shadow-xl">
              <FiMapPin className="text-accent-400 mx-auto mb-2" size={28} />
              <p className="text-sm font-bold text-white">Tap to drop a pin</p>
              <p className="text-xs text-brand-400 mt-1">or use "My Location" above</p>
            </div>
          </div>
        )}

        {/* Geocoding spinner overlay on map */}
        {geocoding && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-brand-900/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-brand-700">
            <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-accent-400 rounded-full animate-spin" />
            <span className="text-xs text-brand-300">Getting address...</span>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-brand-900 border-t border-brand-800 px-4 pt-3 pb-5 flex-shrink-0">
        {/* Address preview */}
        <div className="mb-3 min-h-[44px]">
          {markerPos && !geocoding && geocodedResult && (
            <div className="flex items-start gap-2.5 bg-brand-800 border border-brand-700 rounded-xl px-3 py-2.5">
              <FiMapPin className="text-accent-400 flex-shrink-0 mt-0.5" size={15} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {geocodedResult.landmark}
                </p>
                {geocodedResult.area && (
                  <p className="text-xs text-brand-400 truncate mt-0.5">
                    {[geocodedResult.area, geocodedResult.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                  </p>
                )}
                {(geocodedResult.region || geocodedResult.pincode) && (
                  <p className="text-xs text-brand-500 truncate">
                    {[geocodedResult.region, geocodedResult.pincode].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}
          {!markerPos && (
            <p className="text-xs text-brand-500 text-center pt-2">Pin a location on the map first</p>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-bold py-3.5 rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all text-sm shadow-lg shadow-accent-400/20"
        >
          <FiCheck size={16} />
          {geocoding ? 'Getting address...' : 'Confirm Location'}
        </button>
      </div>
    </div>
  );
}

function ClickHandler({ onMapClick, MapEvents }) {
  MapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function PanTo({ position, useMap }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  }, [position]);
  return null;
}
