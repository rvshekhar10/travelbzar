'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocationCoordinate } from '@/types';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { MapPin, Navigation, ExternalLink, Route as RouteIcon } from 'lucide-react';

interface Props {
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  distanceKm?: number;
  durationMinutes?: number;
  className?: string;
  height?: string;
}

export const MapView: React.FC<Props> = ({
  pickup,
  drop,
  distanceKm,
  durationMinutes,
  className = '',
  height = 'h-72 sm:h-80',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!googleMapsApiKey || typeof window === 'undefined') return;

    let isMounted = true;
    const loadGoogleMaps = async () => {
      try {
        const win = window as unknown as {
          google?: {
            maps?: {
              Map: new (el: HTMLElement, opts: unknown) => unknown;
              DirectionsService: new () => {
                route: (
                  req: unknown,
                  callback: (res: unknown, status: string) => void
                ) => void;
              };
              DirectionsRenderer: new (opts: unknown) => {
                setDirections: (res: unknown) => void;
              };
              DirectionsStatus: { OK: string };
              TravelMode: { DRIVING: string };
            };
          };
        };

        if (!win.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById('google-maps-js-sdk');
            if (existingScript) {
              existingScript.addEventListener('load', () => resolve());
              existingScript.addEventListener('error', (e) => reject(e));
              return;
            }
            const script = document.createElement('script');
            script.id = 'google-maps-js-sdk';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !mapContainerRef.current || !win.google?.maps) return;

        const maps = win.google.maps;
        const map = new maps.Map(mapContainerRef.current, {
          center: { lat: pickup.latitude, lng: pickup.longitude },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        const directionsService = new maps.DirectionsService();
        const directionsRenderer = new maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#078A32',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
        });

        directionsService.route(
          {
            origin: { lat: pickup.latitude, lng: pickup.longitude },
            destination: { lat: drop.latitude, lng: drop.longitude },
            travelMode: maps.TravelMode.DRIVING,
          },
          (res: unknown, status: string) => {
            if (status === maps.DirectionsStatus.OK && res) {
              directionsRenderer.setDirections(res);
              setGoogleMapsLoaded(true);
            } else {
              setMapError(true);
            }
          }
        );
      } catch (e) {
        console.info('Google Maps loader fallback to visual route schematic:', e);
        setMapError(true);
      }
    };

    loadGoogleMaps();
    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey, pickup.latitude, pickup.longitude, drop.latitude, drop.longitude]);

  const navUrl = getGoogleMapsNavigationUrl(drop, pickup);

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 ${className}`}
    >
      {/* Real Google Maps Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${googleMapsLoaded && !mapError ? 'block' : 'hidden'}`}
      />

      {/* Fallback Interactive High-Fidelity Route Schematic */}
      {(!googleMapsLoaded || mapError) && (
        <div className="w-full h-full relative bg-radial from-[#0B223D] to-[#041224] p-6 flex flex-col justify-between select-none">
          {/* Subtle Map Grid lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60A5FA" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />
            </svg>
          </div>

          {/* Top route statistics badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-[#061B33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-white">
              <RouteIcon className="w-3.5 h-3.5 text-[#42B900]" />
              <span className="font-bold text-[#42B900]">{distanceKm || 25} km</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">~{durationMinutes || 45} mins</span>
            </div>

            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Visual Route Path Line */}
          <div className="relative z-10 my-auto py-4">
            <div className="relative flex items-center justify-between max-w-md mx-auto">
              {/* Pickup Point */}
              <div className="flex flex-col items-center text-center max-w-[120px]">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white animate-bounce-subtle">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 mt-2">Pickup</span>
                <span className="text-xs font-semibold text-slate-100 line-clamp-1">
                  {pickup.address || 'Pickup Point'}
                </span>
              </div>

              {/* Connecting animated highway route */}
              <div className="flex-1 mx-4 relative flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-[#F0441D] rounded-full relative" />
                <div className="absolute w-7 h-7 rounded-full bg-[#061B33] border border-[#42B900] flex items-center justify-center shadow-md">
                  <Navigation className="w-3.5 h-3.5 text-[#42B900] rotate-45 animate-pulse" />
                </div>
              </div>

              {/* Drop Point */}
              <div className="flex flex-col items-center text-center max-w-[120px]">
                <div className="w-10 h-10 rounded-full bg-[#F0441D] text-white flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-rose-400 mt-2">Destination</span>
                <span className="text-xs font-semibold text-slate-100 line-clamp-1">
                  {drop.address || 'Drop Point'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom address preview */}
          <div className="relative z-10 bg-[#061B33]/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="truncate pr-2">
              <strong className="text-white">Route:</strong> {pickup.address} → {drop.address}
            </span>
            <span className="text-slate-400 shrink-0">Safe Highway Corridor</span>
          </div>
        </div>
      )}
    </div>
  );
};
