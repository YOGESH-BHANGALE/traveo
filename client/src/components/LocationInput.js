'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FiMapPin, FiX, FiNavigation, FiHome, FiShoppingBag, FiCoffee, FiBook, FiHeart, FiFlag, FiMap } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const MapPickerModal = dynamic(() => import('./MapPickerModal'), { ssr: false });

// Key used server-side only via /api/places/* proxy routes
// ── Place type → icon + color ────────────────────────────────────────────────
function getPlaceMeta(types = []) {
  if (types.some(t => ['hospital', 'health', 'pharmacy'].includes(t)))
    return { icon: FiHeart, color: 'text-red-400', tag: 'Health' };
  if (types.some(t => ['school', 'university', 'library'].includes(t)))
    return { icon: FiBook, color: 'text-blue-400', tag: 'Education' };
  if (types.some(t => ['restaurant', 'cafe', 'food', 'bakery'].includes(t)))
    return { icon: FiCoffee, color: 'text-amber-400', tag: 'Food' };
  if (types.some(t => ['store', 'shopping_mall', 'supermarket'].includes(t)))
    return { icon: FiShoppingBag, color: 'text-purple-400', tag: 'Shop' };
  if (types.some(t => ['train_station', 'transit_station', 'bus_station', 'airport'].includes(t)))
    return { icon: FiNavigation, color: 'text-green-400', tag: 'Transit' };
  if (types.some(t => ['locality', 'sublocality', 'neighborhood', 'political'].includes(t)))
    return { icon: FiHome, color: 'text-brand-300', tag: 'Area' };
  return { icon: FiMapPin, color: 'text-accent-400', tag: null };
}

// ── Call Google Places Autocomplete via Next.js proxy ───────────────────────
async function searchGooglePlaces(input, signal) {
  const res = await fetch(
    `/api/places/autocomplete?input=${encodeURIComponent(input)}`,
    { signal }
  );
  const data = await res.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn('Places API:', data.status, data.error_message);
    return [];
  }

  // Return all predictions — server already biases to Maharashtra via location+radius
  return data.predictions || [];
}

// ── Get lat/lng for a place_id ───────────────────────────────────────────────
async function getPlaceDetails(placeId) {
  const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`);
  const data = await res.json();
  return data.result || null;
}

// ── Parse address_components into structured fields ──────────────────────────
function parseComponents(components = []) {
  const get = (type) => components.find(c => c.types.includes(type))?.long_name || '';
  return {
    area: get('sublocality_level_1') || get('sublocality') || get('neighborhood') || get('locality'),
    city: get('locality') || get('administrative_area_level_2'),
    region: get('administrative_area_level_2') || get('administrative_area_level_1'),
    pincode: get('postal_code'),
  };
}

// ── Build structured suggestion from prediction ──────────────────────────────
function buildSuggestion(prediction) {
  const terms = prediction.terms || [];
  const landmark = prediction.structured_formatting?.main_text || terms[0]?.value || '';
  const secondary = prediction.structured_formatting?.secondary_text || '';
  // Extract area from secondary (e.g. "Andheri, Mumbai, Maharashtra, India")
  const secParts = secondary.split(',').map(s => s.trim()).filter(Boolean);
  const area = secParts.slice(0, 2).join(', ');
  const region = secParts.find(p => /maharashtra/i.test(p)) ? 'Maharashtra' : secParts[secParts.length - 2] || '';

  return {
    id: prediction.place_id,
    landmark,
    area,
    region,
    pincode: '',
    address: prediction.description,
    types: prediction.types || [],
    lat: null,
    lng: null,
  };
}

export function formatShortAddress(loc) {
  if (!loc) return '';
  if (loc.landmark && loc.area) return `${loc.landmark}, ${loc.area}`;
  if (loc.address) return loc.address.split(',').slice(0, 2).join(', ');
  return '';
}

export default function LocationInput({
  label, placeholder, value, onChange,
  icon, showCurrentLocation = false, showMapPicker = true,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  // Keep onChange in a ref so map modal callback never has a stale closure
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Sync external value → only update if value has real content
  // Don't wipe confirmed state if value is temporarily null during re-render
  useEffect(() => {
    if (value?.address && value.address !== confirmed?.address) {
      setConfirmed(value);
      setQuery('');
    } else if (!value && confirmed) {
      setConfirmed(null);
      setQuery('');
    }
  }, [value?.address]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) { setSuggestions([]); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setFetching(true);
    try {
      const predictions = await searchGooglePlaces(input, abortRef.current.signal);
      const built = predictions.map(buildSuggestion);
      setSuggestions(built);
      setShowSuggestions(built.length > 0);
    } catch (err) {
      if (err.name !== 'AbortError') setSuggestions([]);
    } finally { setFetching(false); }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = async (place) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setQuery('');
    // Show name immediately, fetch coords in background
    setConfirmed({ ...place, lat: null, lng: null });

    try {
      const details = await getPlaceDetails(place.id);
      if (details) {
        const loc = details.geometry?.location;
        const parsed = parseComponents(details.address_components || []);
        const enriched = {
          address: details.formatted_address || place.address,
          lat: loc?.lat || null,
          lng: loc?.lng || null,
          placeId: place.id,
          landmark: details.name || place.landmark,
          area: parsed.area || place.area,
          region: parsed.region || place.region,
          pincode: parsed.pincode || '',
          city: parsed.city || '',
        };
        setConfirmed(enriched);
        onChange(enriched);
      } else {
        onChange({ address: place.address, lat: null, lng: null, placeId: place.id, landmark: place.landmark, area: place.area, region: place.region, pincode: '' });
      }
    } catch {
      onChange({ address: place.address, lat: null, lng: null, placeId: place.id, landmark: place.landmark, area: place.area, region: place.region, pincode: '' });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          // Reverse geocode via proxy
          const res = await fetch(`/api/places/geocode?latlng=${lat},${lng}`);
          const data = await res.json();
          const result = data.results?.[0];
          if (result) {
            const parsed = parseComponents(result.address_components || []);
            const enriched = {
              address: result.formatted_address,
              lat, lng,
              placeId: result.place_id,
              landmark: result.address_components?.[0]?.long_name || 'Current Location',
              area: parsed.area,
              region: parsed.region,
              pincode: parsed.pincode,
              city: parsed.city,
            };
            setConfirmed(enriched);
            setQuery('');
            onChange(enriched);
          }
        } catch {
          const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const fallback = { address, lat, lng, landmark: 'Current Location', area: '', region: 'Maharashtra', pincode: '' };
          setConfirmed(fallback);
          setQuery('');
          onChange({ address, lat, lng, placeId: null });
        } finally { setLocating(false); }
      },
      () => { setLocating(false); alert('Could not get location. Please allow access.'); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClear = () => {
    setQuery('');
    setConfirmed(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const IconComponent = icon || FiMapPin;

  return (
    <>
    <div ref={wrapperRef} className="relative">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-brand-300">{label}</label>
        <div className="flex items-center gap-2">
          {showMapPicker && (
            <button type="button" onClick={() => setMapOpen(true)}
              className="flex items-center gap-1 text-xs text-brand-400 font-medium hover:text-brand-200 transition-colors">
              <FiMap size={12} /> Pick on map
            </button>
          )}
          {showCurrentLocation && (
            <button type="button" onClick={handleUseCurrentLocation} disabled={locating}
              className="flex items-center gap-1 text-xs text-accent-400 font-medium hover:text-accent-300 disabled:opacity-50 transition-colors">
              {locating
                ? <div className="w-3 h-3 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
                : <FiNavigation size={12} />}
              {locating ? 'Locating...' : 'Use my location'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmed chip */}
      {confirmed ? (
        <div className="bg-brand-800 border border-accent-400/40 rounded-xl px-3 py-2.5 flex items-start gap-3">
          <div className="w-8 h-8 bg-accent-400/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FiMapPin size={15} className="text-accent-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {confirmed.landmark || confirmed.address?.split(',')[0]}
            </p>
            {confirmed.area && (
              <p className="text-xs text-brand-400 truncate mt-0.5">{confirmed.area}{confirmed.city && confirmed.city !== confirmed.area ? `, ${confirmed.city}` : ''}</p>
            )}
            {(confirmed.region || confirmed.pincode) && (
              <p className="text-xs text-brand-500 truncate">
                {[confirmed.region, confirmed.pincode].filter(Boolean).join(' · ')}
              </p>
            )}
            {confirmed.lat === null && (
              <p className="text-[10px] text-accent-400 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 border border-accent-400/50 border-t-accent-400 rounded-full animate-spin inline-block" />
                Fetching coordinates...
              </p>
            )}
          </div>
          <button type="button" onClick={handleClear}
            className="text-brand-500 hover:text-brand-300 flex-shrink-0 mt-0.5 transition-colors">
            <FiX size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="input-field pl-10 pr-10"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            autoComplete="off"
            spellCheck={false}
          />
          {fetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-accent-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-brand-800 rounded-xl shadow-2xl border border-brand-700 overflow-hidden max-h-80 overflow-y-auto">
          {suggestions.map((place, idx) => {
            const { icon: PlaceIcon, color, tag } = getPlaceMeta(place.types || []);
            const IconComponent = PlaceIcon || FiMapPin; // Fallback to FiMapPin if undefined
            return (
              <button
                key={`${place.id}_${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(place)}
                className="w-full text-left px-3 py-3 hover:bg-brand-700 active:bg-brand-600 transition-colors border-b border-brand-700/60 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IconComponent size={14} className={color || 'text-accent-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{place.landmark}</span>
                      {tag && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-600 text-brand-300 flex-shrink-0">{tag}</span>
                      )}
                    </div>
                    {place.area && (
                      <p className="text-xs text-brand-400 truncate mt-0.5">{place.area}</p>
                    )}
                    {place.region && (
                      <p className="text-xs text-brand-500 truncate">{place.region}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          <div className="px-3 py-1.5 border-t border-brand-700 flex items-center justify-end gap-1">
            <span className="text-[10px] text-brand-600">Powered by</span>
            <span className="text-[10px] font-bold text-brand-500">Google Maps</span>
          </div>
        </div>
      )}

    </div>

    {/* Map picker modal — outside wrapperRef so outside-click handler never fires on it */}
    {mapOpen && (
      <MapPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        title={label}
        initialLocation={confirmed}
        onConfirm={(loc) => {
          setConfirmed(loc);
          setQuery('');
          setMapOpen(false);
          onChangeRef.current(loc);
        }}
      />
    )}
    </>
  );
}