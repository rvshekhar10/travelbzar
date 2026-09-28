'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocationCoordinate, RouteStop } from '@/types';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { MapPin, Navigation, ExternalLink, Route as RouteIcon, Clock } from 'lucide-react';
import type * as LType from 'leaflet';

interface Props {
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  stops?: RouteStop[];
  distanceKm?: number;
  durationMinutes?: number;
  totalHaltMinutes?: number;
  className?: string;
  height?: string;
}

export const MapView: React.FC<Props> = ({
  pickup,
  drop,
  stops = [],
  distanceKm,
  durationMinutes,
  totalHaltMinutes,
  className = '',
  height = 'h-72 sm:h-80',
}) => {
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LType.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filter valid stops with coordinates
  const validStops = stops.filter(
    (s) => s.address && s.latitude !== undefined && s.longitude !== undefined
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !leafletContainerRef.current) return;

    let isMounted = true;

    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !leafletContainerRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(leafletContainerRef.current, {
        center: [pickup.latitude, pickup.longitude],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_3xtv_1_581bfd0ab9ab4c3122f849b3';
      const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Custom Pickup Marker Icon
      const pickupIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-md uppercase mb-0.5 bg-[#078A32] border border-white">
              PICKUP
            </span>
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#078A32] to-[#42B900] text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
              A
            </div>
          </div>
        `,
        className: 'custom-mapview-pickup',
        iconSize: [50, 50],
        iconAnchor: [25, 48],
      });

      // Custom Drop Marker Icon
      const dropIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-md uppercase mb-0.5 bg-[#F0441D] border border-white">
              DROP
            </span>
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F0441D] to-[#D43612] text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
              B
            </div>
          </div>
        `,
        className: 'custom-mapview-drop',
        iconSize: [50, 50],
        iconAnchor: [25, 48],
      });

      // Add Pickup Marker
      L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup:</b> ${pickup.address || 'Pickup Point'}`);

      // Add Intermediate Stop Markers
      validStops.forEach((stop, index) => {
        const stopNum = stop.stopOrder || index + 1;
        const haltLabel = stop.haltDurationMinutes ? `${stop.haltDurationMinutes}m halt` : `Stop ${stopNum}`;

        const stopIcon = L.divIcon({
          html: `
            <div class="relative flex flex-col items-center cursor-pointer">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-amber-950 shadow-md uppercase mb-0.5 bg-amber-400 border border-white whitespace-nowrap">
                ${haltLabel}
              </span>
              <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
                ${stopNum}
              </div>
            </div>
          `,
          className: 'custom-mapview-stop',
          iconSize: [60, 50],
          iconAnchor: [30, 48],
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 11px;">
            <strong style="color: #d97706;">Stop #${stopNum}:</strong> ${stop.address}
            ${stop.haltDurationMinutes ? `<br/><strong>Halt:</strong> ${stop.haltDurationMinutes} mins` : ''}
            ${stop.haltReason ? `<br/><strong>Activity:</strong> ${stop.haltReason}` : ''}
            ${stop.landmark ? `<br/><strong>Landmark:</strong> ${stop.landmark}` : ''}
          </div>
        `;

        L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
          .addTo(map)
          .bindPopup(popupContent);
      });

      // Add Drop Marker
      L.marker([drop.latitude, drop.longitude], { icon: dropIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${drop.address || 'Drop Point'}`);

      // Connecting Multi-Point Route Line
      const routeCoordinates: Array<[number, number]> = [
        [pickup.latitude, pickup.longitude],
        ...validStops.map((s) => [s.latitude, s.longitude] as [number, number]),
        [drop.latitude, drop.longitude],
      ];

      L.polyline(routeCoordinates, {
        color: '#078A32',
        weight: 4,
        opacity: 0.9,
        dashArray: '6, 6',
      }).addTo(map);

      // Fit bounds across pickup, all intermediate stops, and drop
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

      leafletMapRef.current = map;
      setMapReady(true);
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [
    pickup.latitude,
    pickup.longitude,
    drop.latitude,
    drop.longitude,
    JSON.stringify(validStops.map((s) => [s.latitude, s.longitude, s.haltDurationMinutes])),
  ]);

  const navUrl = getGoogleMapsNavigationUrl(drop, pickup, validStops);

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}
    >
      {/* Real Visual Leaflet Map */}
      <div ref={leafletContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Stats HUD */}
      <div className="absolute top-3 left-3 right-14 sm:right-auto z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-[#061B33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-white shadow-md">
          <RouteIcon className="w-3.5 h-3.5 text-[#42B900]" />
          <span className="font-bold text-[#42B900]">{distanceKm || 25} km</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-200">~{durationMinutes || 45} mins</span>
          {Boolean(totalHaltMinutes && totalHaltMinutes > 0) && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {totalHaltMinutes}m halt
              </span>
            </>
          )}
        </div>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Bottom Floating Route Pill */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xl z-10 pointer-events-none">
        <div className="bg-[#061B33]/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between shadow-lg">
          <span className="truncate pr-2">
            <strong className="text-white">Route:</strong> {pickup.address?.split(',')[0]} →{' '}
            {validStops.length > 0 ? (
              <span className="text-amber-400 font-bold">
                {validStops.length} stop{validStops.length > 1 ? 's' : ''} →{' '}
              </span>
            ) : null}
            {drop.address?.split(',')[0]}
          </span>
          <span className="text-[#42B900] font-bold shrink-0">
            {validStops.length > 0 ? 'Custom Itinerary' : 'Direct Highway Corridor'}
          </span>
        </div>
      </div>
    </div>
  );
};

