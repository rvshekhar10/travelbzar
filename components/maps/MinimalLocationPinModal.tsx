'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LocationCoordinate } from '@/types';
import { MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import type * as LType from 'leaflet';

interface Props {
  location: LocationCoordinate;
  onChange: (loc: LocationCoordinate) => void;
  label?: string;
  pinColor?: string; // hex, e.g. '#078A32' or '#F0441D'
  height?: string;
}

export const MinimalLocationPinModal: React.FC<Props> = ({
  location,
  onChange,
  label = 'Adjust Pin Location',
  pinColor = '#078A32',
  height = 'h-52 sm:h-60',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: location.latitude || 23.7957,
    lng: location.longitude || 86.4304,
  });
  const [resolvedAddress, setResolvedAddress] = useState<string>(location.address || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'TravelBzarApp/1.0',
          },
        }
      );
      if (!res.ok) return location.address;
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name.split(',').slice(0, 4).join(', ');
      }
    } catch {
      // ignore
    }
    return `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // Leaflet initialization
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = location.latitude || 23.7957;
      const initialLng = location.longitude || 86.4304;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_3xtv_1_581bfd0ab9ab4c3122f849b3';
      const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;

      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-minimal-marker',
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${pinColor}; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${pinColor};"></div>
          </div>
        `,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        setIsGeocoding(true);
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setIsGeocoding(false);
        setResolvedAddress(addr);
        onChange({
          address: addr,
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });

      map.on('click', async (e: LType.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        setIsGeocoding(true);
        const addr = await reverseGeocode(lat, lng);
        setIsGeocoding(false);
        setResolvedAddress(addr);
        onChange({
          address: addr,
          latitude: lat,
          longitude: lng,
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when location prop coordinates change
  useEffect(() => {
    if (markerRef.current && location.latitude && location.longitude) {
      markerRef.current.setLatLng([location.latitude, location.longitude]);
      mapInstanceRef.current?.panTo([location.latitude, location.longitude]);
      setCurrentCoords({ lat: location.latitude, lng: location.longitude });
      if (location.address) setResolvedAddress(location.address);
    }
  }, [location.latitude, location.longitude]);

  // GPS centering
  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current?.flyTo([lat, lng], 16, { duration: 0.8 });
        setCurrentCoords({ lat, lng });
        setIsGeocoding(true);
        const addr = await reverseGeocode(lat, lng);
        setIsGeocoding(false);
        setResolvedAddress(addr);
        onChange({
          address: addr,
          latitude: lat,
          longitude: lng,
        });
      },
      () => setIsGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 shadow-inner mt-2 space-y-0 animate-fade-in">
      {/* Map Header Bar */}
      <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" style={{ color: pinColor }} />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            (Tap or drag marker to set driver GPS pin)
          </span>
        </span>

        <button
          type="button"
          onClick={handleGPS}
          disabled={isGpsLoading}
          className="text-[11px] font-bold text-[#078A32] hover:text-[#056B27] flex items-center gap-1 cursor-pointer"
        >
          {isGpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          <span>GPS Pin</span>
        </button>
      </div>

      {/* Real Interactive Map Canvas */}
      <div className={`relative w-full ${height}`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Coordinate Pill */}
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-xl text-[10px] flex items-center justify-between font-mono shadow-md border border-slate-700">
            <span className="truncate max-w-[200px] text-slate-200">
              {isGeocoding ? 'Detecting street address...' : resolvedAddress || 'Map pin selected'}
            </span>
            <span className="text-emerald-400 font-bold shrink-0 ml-2">
              {currentCoords.lat.toFixed(4)}°N, {currentCoords.lng.toFixed(4)}°E
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

