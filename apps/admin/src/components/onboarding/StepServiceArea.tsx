import { useState, useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';

interface StepServiceAreaProps {
  onComplete: () => void;
}

export function StepServiceArea({ onComplete }: StepServiceAreaProps) {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(10);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    if (!apiKey) return;

    setOptions({ key: apiKey, v: 'weekly' });

    let cancelled = false;

    const initMaps = async () => {
      try {
        const { Map, Circle } = (await importLibrary('maps')) as google.maps.MapsLibrary;
        const { Autocomplete } = (await importLibrary('places')) as google.maps.PlacesLibrary;

        if (cancelled || !mapDivRef.current) return;

        const map = new Map(mapDivRef.current, {
          center: { lat: 42.36, lng: -71.06 },
          zoom: 10,
        });
        mapRef.current = map;

        const circle = new Circle({
          map,
          center: map.getCenter()!,
          radius: radius * 1609.34,
          fillColor: '#F57C20',
          fillOpacity: 0.15,
          strokeColor: '#F57C20',
          strokeWeight: 2,
        });
        circleRef.current = circle;

        const input = document.getElementById('service-area-address') as HTMLInputElement | null;
        if (!input) return;

        const autocomplete = new Autocomplete(input, {
          types: ['address'],
          fields: ['geometry', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          const newLat = place.geometry.location.lat();
          const newLng = place.geometry.location.lng();
          setLat(newLat);
          setLng(newLng);
          if (place.formatted_address) setAddress(place.formatted_address);
          const position = { lat: newLat, lng: newLng };
          map.setCenter(position);
          map.setZoom(12);
          circle.setCenter(position);
        });
      } catch {
        // Maps failed to load; UI still works without it
      }
    };

    void initMaps();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update circle radius when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1609.34);
    }
  }, [radius]);

  // Pre-populate from existing data
  useEffect(() => {
    apiFetch<{ address: string; radiusMiles: number; lat: number; lng: number }>(
      '/api/v1/admin/service-area',
    )
      .then((data) => {
        setAddress(data.address);
        setRadius(data.radiusMiles);
        setLat(data.lat);
        setLng(data.lng);
      })
      .catch(() => {/* not yet configured */});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/v1/admin/service-area', {
        method: 'PUT',
        body: JSON.stringify({ address, lat, lng, radiusMiles: radius }),
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        Service Area
      </h2>

      <div className="form-group">
        <label className="form-label" htmlFor="service-area-address">
          Home base / depot address
        </label>
        <input
          id="service-area-address"
          className="input"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, Anytown, MA"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="radius-slider">
          Service radius: {radius} miles
        </label>
        <input
          id="radius-slider"
          type="range"
          min={1}
          max={50}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-apex)' }}
        />
      </div>

      <div
        id="service-area-map"
        ref={mapDivRef}
        style={{
          width: '100%',
          height: 280,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-slate-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: 'var(--color-slate-400)',
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        {!apiKey && 'Map preview (add VITE_GOOGLE_MAPS_API_KEY to enable)'}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-status-error)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Continue'}
      </Button>
    </div>
  );
}
