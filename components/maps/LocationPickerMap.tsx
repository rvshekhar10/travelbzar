'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LocationCoordinate } from '@/types';
import { MapPin, Navigation, Crosshair, Sparkles, Check, Compass } from 'lucide-react';

interface Props {
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  onSelectPickup: (loc: LocationCoordinate) => void;
  onSelectDrop: (loc: LocationCoordinate) => void;
  activeTarget: 'pickup' | 'drop';
  setActiveTarget: (target: 'pickup' | 'drop') => void;
}

// Regional Popular Transit Hubs in and around Dhanbad
const REGIONAL_LANDMARKS: { name: string; area: string; lat: number; lng: number }[] = [
  { name: 'Dhanbad Junction Station', area: 'Station Road', lat: 23.7957, lng: 86.4304 },
  { name: 'Bank More Hub', area: 'Commercial Centre', lat: 23.7915, lng: 86.4255 },
  { name: 'IIT (ISM) Main Gate', area: 'Sardar Patel Nagar', lat: 23.8144, lng: 86.4412 },
  { name: 'Saraidhela / Steel Gate', area: 'Koyla Nagar Road', lat: 23.8219, lng: 86.4589 },
  { name: 'Memco More', area: 'NH-19 Junction', lat: 23.8341, lng: 86.4418 },
  { name: 'Govindpur GT Road', area: 'Highway Corridor', lat: 23.8385, lng: 86.5192 },
  { name: 'Ranchi Airport (IXR)', area: 'Hinoo, Ranchi', lat: 23.3143, lng: 85.3216 },
  { name: 'Deoghar Airport (DGH)', area: 'Kunda, Deoghar', lat: 24.4439, lng: 86.7081 },
  { name: 'Durgapur Airport (RDP)', area: 'Andal, Durgapur', lat: 23.6231, lng: 87.2435 },
];

export const LocationPickerMap: React.FC<Props> = ({
  pickup,
  drop,
  onSelectPickup,
  onSelectDrop,
  activeTarget,
  setActiveTarget,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [googleMapsActive, setGoogleMapsActive] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Real Google Maps Initialization if Key is present
  useEffect(() => {
    if (!googleMapsApiKey || typeof window === 'undefined') return;

    let isMounted = true;
    const initMap = async () => {
      try {
        const win = window as unknown as {
          google?: {
            maps?: {
              Map: new (el: HTMLElement, opts: unknown) => {
                addListener: (event: string, handler: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void;
                setCenter: (coords: { lat: number; lng: number }) => void;
              };
              Marker: new (opts: unknown) => { setPosition: (c: unknown) => void; setMap: (m: unknown) => void };
              Geocoder: new () => {
                geocode: (
                  req: { location: { lat: number; lng: number } },
                  cb: (results: { formatted_address?: string }[], status: string) => void
                ) => void;
              };
            };
          };
        };

        if (win.google?.maps && mapContainerRef.current) {
          const maps = win.google.maps;
          const centerCoords = activeTarget === 'pickup'
            ? { lat: pickup.latitude, lng: pickup.longitude }
            : { lat: drop.latitude, lng: drop.longitude };

          const map = new maps.Map(mapContainerRef.current, {
            center: centerCoords,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          const geocoder = new maps.Geocoder();

          map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              const address =
                status === 'OK' && results[0]?.formatted_address
                  ? results[0].formatted_address
                  : `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

              if (activeTarget === 'pickup') {
                onSelectPickup({ address, latitude: lat, longitude: lng });
              } else {
                onSelectDrop({ address, latitude: lat, longitude: lng });
              }
            });
          });

          setGoogleMapsActive(true);
        }
      } catch (err) {
        console.info('Google Maps pointer notices:', err);
      }
    };

    initMap();
    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey, activeTarget]);

  // Current Device GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsDetecting(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = `My GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)} • Dhanbad)`;

        if (activeTarget === 'pickup') {
          onSelectPickup({ address, latitude: lat, longitude: lng });
        } else {
          onSelectDrop({ address, latitude: lat, longitude: lng });
        }
      },
      (err) => {
        setGpsDetecting(false);
        alert(`Location permission denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Click on Schematic Map canvas
  const handleSchematicCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Map normalized canvas coordinates to Dhanbad regional latitude & longitude
    // Dhanbad region bounding box: lat ~ 23.75 to 23.86, lng ~ 86.38 to 86.54
    const lat = 23.86 - y * 0.11;
    const lng = 86.38 + x * 0.16;

    // Find closest landmark for a user-friendly address name
    let closest = REGIONAL_LANDMARKS[0];
    let minD = 999999;
    REGIONAL_LANDMARKS.forEach((lm) => {
      const d = Math.hypot(lm.lat - lat, lm.lng - lng);
      if (d < minD) {
        minD = d;
        closest = lm;
      }
    });

    const address = `Pinned near ${closest.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    if (activeTarget === 'pickup') {
      onSelectPickup({ address, latitude: lat, longitude: lng });
    } else {
      onSelectDrop({ address, latitude: lat, longitude: lng });
    }
  };

  const handleSelectLandmark = (lm: typeof REGIONAL_LANDMARKS[0]) => {
    const loc: LocationCoordinate = {
      address: `${lm.name}, ${lm.area}, Dhanbad`,
      latitude: lm.lat,
      longitude: lm.lng,
    };
    if (activeTarget === 'pickup') {
      onSelectPickup(loc);
    } else {
      onSelectDrop(loc);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Controller: Pointer Target Switcher & GPS Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#061B33] text-white p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 shadow-md">
        {/* Toggle between Pickup and Drop Pointer */}
        <div className="flex items-center gap-1.5 p-1 bg-[#041224] rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTarget('pickup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTarget === 'pickup'
                ? 'bg-[#078A32] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#42B900]" />
            <span>1. Set Pickup Pointer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('drop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTarget === 'drop'
                ? 'bg-[#F0441D] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-300" />
            <span>2. Set Destination Pointer</span>
          </button>
        </div>

        {/* GPS Quick Action */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={gpsDetecting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer border border-slate-700 active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5 text-[#42B900]" />
          <span>{gpsDetecting ? 'Detecting GPS...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* Interactive Map Surface */}
      <div className="relative w-full h-72 sm:h-84 rounded-3xl overflow-hidden border-2 border-[#0B223D] bg-[#041224] shadow-inner select-none">
        {/* Google Maps Container if enabled */}
        {googleMapsActive && (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Interactive Schematic Regional Surface */}
        {!googleMapsActive && (
          <div
            onClick={handleSchematicCanvasClick}
            className="w-full h-full relative cursor-crosshair overflow-hidden"
          >
            {/* Dark Mode Regional Map Canvas with Dhanbad Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="pickergrid" width="35" height="35" patternUnits="userSpaceOnUse">
                    <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#38BDF8" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pickergrid)" />
              </svg>
            </div>

            {/* Schematic Highway Corridors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* NH-19 GT Road */}
              <line x1="0%" y1="20%" x2="100%" y2="40%" stroke="#1E293B" strokeWidth="6" />
              <line x1="0%" y1="20%" x2="100%" y2="40%" stroke="#0284C7" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
              {/* Dhanbad - Bokaro / Ranchi Expressway */}
              <line x1="30%" y1="90%" x2="45%" y2="25%" stroke="#1E293B" strokeWidth="5" />
              <line x1="30%" y1="90%" x2="45%" y2="25%" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
            </svg>

            {/* Click instruction banner at top */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="bg-[#061B33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-white flex items-center gap-2 shadow-lg">
                <Compass className="w-3.5 h-3.5 text-[#42B900] animate-spin-slow" />
                <span>
                  Tap anywhere on the regional map to set{' '}
                  <strong className={activeTarget === 'pickup' ? 'text-[#42B900]' : 'text-rose-400'}>
                    {activeTarget === 'pickup' ? 'PICKUP' : 'DESTINATION'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Landmark Nodes on Schematic Canvas */}
            <div className="absolute inset-0 p-6 flex flex-wrap items-center justify-around pointer-events-auto">
              {REGIONAL_LANDMARKS.slice(0, 6).map((lm) => {
                const isSelectedPickup = Math.abs(pickup.latitude - lm.lat) < 0.005;
                const isSelectedDrop = Math.abs(drop.latitude - lm.lat) < 0.005;

                return (
                  <button
                    key={lm.name}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLandmark(lm);
                    }}
                    className={`m-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all transform active:scale-95 shadow-md flex items-center gap-1.5 ${
                      isSelectedPickup
                        ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400'
                        : isSelectedDrop
                        ? 'bg-rose-600 text-white border-white ring-2 ring-rose-400'
                        : 'bg-[#0B223D]/90 text-slate-300 border-slate-700 hover:bg-[#122E52] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>{lm.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Pinned Markers */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Pickup Pin */}
              <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-300 bg-black/80 px-2 py-0.5 rounded-md mt-1 border border-emerald-500/50">
                  Pickup
                </span>
              </div>

              {/* Connecting Line between Pointers */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-rose-500 rounded-full opacity-70" />

              {/* Destination Pin */}
              <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                  <Crosshair className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase text-rose-300 bg-black/80 px-2 py-0.5 rounded-md mt-1 border border-rose-500/50">
                  Destination
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Coordinates & Address Transparency Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Pickup Details Card */}
        <div
          onClick={() => setActiveTarget('pickup')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTarget === 'pickup'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#078A32] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>1. Pickup Point</span>
            </span>
            {activeTarget === 'pickup' && (
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Active Pointer
              </span>
            )}
          </div>
          <p className="font-extrabold text-slate-900 line-clamp-1">{pickup.address}</p>
          <span className="text-[10px] text-slate-400 font-mono">
            {pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}
          </span>
        </div>

        {/* Drop Details Card */}
        <div
          onClick={() => setActiveTarget('drop')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTarget === 'drop'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5" />
              <span>2. Destination Drop</span>
            </span>
            {activeTarget === 'drop' && (
              <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                Active Pointer
              </span>
            )}
          </div>
          <p className="font-extrabold text-slate-900 line-clamp-1">{drop.address}</p>
          <span className="text-[10px] text-slate-400 font-mono">
            {drop.latitude.toFixed(4)}, {drop.longitude.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};
