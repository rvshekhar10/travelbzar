'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Driver, DriverLocation, Vehicle, Booking } from '@/types';
import { DHANBAD_GARAGE_LOCATION, getGarageNavigationUrl } from '@/services/locationService';
import {
  Car,
  Navigation,
  Phone,
  Radio,
  ExternalLink,
  ShieldCheck,
  Compass,
  Gauge,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import type * as LType from 'leaflet';

interface Props {
  driver: Driver | null;
  driverLocation: DriverLocation | null;
  vehicle?: Vehicle | null;
  activeBooking?: Booking | null;
  height?: string;
}

export const OwnerChauffeurMap: React.FC<Props> = ({
  driver,
  driverLocation,
  vehicle,
  activeBooking,
  height = 'h-96 sm:h-[460px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const driverMarkerRef = useRef<LType.Marker | null>(null);
  const garageMarkerRef = useRef<LType.Marker | null>(null);
  const routePolylineRef = useRef<LType.Polyline | null>(null);
  const pickupMarkerRef = useRef<LType.Marker | null>(null);
  const dropMarkerRef = useRef<LType.Marker | null>(null);

  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Time elapsed since last live GPS telemetry ping
  useEffect(() => {
    const timer = setInterval(() => {
      if (driverLocation?.updatedAt) {
        const diff = Math.max(
          0,
          Math.floor((Date.now() - new Date(driverLocation.updatedAt).getTime()) / 1000)
        );
        setSecondsAgo(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [driverLocation?.updatedAt]);

  // Initialize Leaflet map with CARTO Basemaps
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const initialLat = driverLocation?.latitude || DHANBAD_GARAGE_LOCATION.latitude;
      const initialLng = driverLocation?.longitude || DHANBAD_GARAGE_LOCATION.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // CARTO Voyager Tiles with Verified Key
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_3xtv_1_581bfd0ab9ab4c3122f849b3';
      const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '© OpenStreetMap • CARTO • Travel BZAR HQ',
        })
        .addTo(map);

      // 1. Garage Base Marker
      const garageIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-amber-950 uppercase shadow-md bg-amber-400 border border-amber-200 mb-0.5 whitespace-nowrap">
              TB BASE GARAGE
            </span>
            <div class="w-9 h-9 rounded-2xl bg-[#061B33] text-amber-400 flex items-center justify-center shadow-xl border-2 border-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        `,
        className: 'custom-leaflet-garage-pin',
        iconSize: [40, 52],
        iconAnchor: [20, 48],
      });

      const garageMarker = L.marker(
        [DHANBAD_GARAGE_LOCATION.latitude, DHANBAD_GARAGE_LOCATION.longitude],
        { icon: garageIcon }
      )
        .addTo(map)
        .bindPopup(
          `<div class="p-2 text-xs font-sans text-slate-800">
            <strong class="font-black text-[#061B33]">Travel BZAR Operations Base</strong><br/>
            ${DHANBAD_GARAGE_LOCATION.address}
          </div>`
        );
      garageMarkerRef.current = garageMarker;

      // 2. Chauffeur Live Marker
      const speed = driverLocation?.speed || 0;
      const heading = driverLocation?.heading || 0;
      const isMoving = speed > 2;

      const chauffeurIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-lg uppercase mb-1 whitespace-nowrap ${
              isMoving ? 'bg-[#078A32] border border-emerald-300' : 'bg-[#061B33] border border-slate-600'
            }">
              ${driver?.name ? driver.name.split(' ')[0] : 'CHAUFFEUR'} • ${speed} km/h
            </span>
            <div class="relative w-11 h-11 rounded-2xl bg-[#061B33] text-[#42B900] flex items-center justify-center shadow-2xl border-2 border-[#42B900]">
              ${
                isMoving
                  ? `<span class="animate-ping absolute inset-0 rounded-2xl bg-[#42B900] opacity-40"></span>`
                  : ''
              }
              <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/>
                  <circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
        `,
        className: 'custom-leaflet-chauffeur-pin',
        iconSize: [44, 58],
        iconAnchor: [22, 54],
      });

      const driverMarker = L.marker([initialLat, initialLng], { icon: chauffeurIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2 text-xs font-sans text-slate-800">
            <strong class="font-black text-[#061B33]">${driver?.name || 'Assigned Chauffeur'}</strong><br/>
            Cab: ${vehicle?.make || 'Fleet'} ${vehicle?.model || 'Cab'} (${vehicle?.registrationNumber || 'Assigned'})<br/>
            Speed: <strong>${speed} km/h</strong><br/>
            Status: <span class="text-emerald-700 font-bold">${driverLocation?.dutyStatus || 'ON DUTY'}</span>
          </div>`
        );
      driverMarkerRef.current = driverMarker;

      mapRef.current = map;
      if (isMounted) setMapLoaded(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [driver?.name, vehicle?.make, vehicle?.model, vehicle?.registrationNumber]);

  // Synchronize Live Driver Position updates onto the map
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const L = (window as unknown as { L?: typeof import('leaflet') }).L;
    const lat = driverLocation.latitude;
    const lng = driverLocation.longitude;
    const speed = driverLocation.speed || 0;
    const heading = driverLocation.heading || 0;
    const isMoving = speed > 2;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([lat, lng]);

      import('leaflet').then((mod) => {
        const L = mod.default;
        if (!driverMarkerRef.current) return;

        const dynamicHtml = `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-lg uppercase mb-1 whitespace-nowrap ${
              isMoving ? 'bg-[#078A32] border border-emerald-300' : 'bg-[#061B33] border border-slate-600'
            }">
              ${driver?.name ? driver.name.split(' ')[0] : 'CHAUFFEUR'} • ${speed} km/h
            </span>
            <div class="relative w-11 h-11 rounded-2xl bg-[#061B33] text-[#42B900] flex items-center justify-center shadow-2xl border-2 border-[#42B900]">
              ${
                isMoving
                  ? `<span class="animate-ping absolute inset-0 rounded-2xl bg-[#42B900] opacity-40"></span>`
                  : ''
              }
              <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/>
                  <circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
        `;

        const newIcon = L.divIcon({
          html: dynamicHtml,
          className: 'custom-leaflet-chauffeur-pin',
          iconSize: [44, 58],
          iconAnchor: [22, 54],
        });
        driverMarkerRef.current.setIcon(newIcon);
      });
    }
  }, [driverLocation, driver?.name]);

  // Center on chauffeur
  const handleFocusChauffeur = () => {
    if (!mapRef.current) return;
    const targetLat = driverLocation?.latitude || DHANBAD_GARAGE_LOCATION.latitude;
    const targetLng = driverLocation?.longitude || DHANBAD_GARAGE_LOCATION.longitude;
    mapRef.current.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
  };

  // Fit Garage & Chauffeur together
  const handleFitFleet = () => {
    if (!mapRef.current) return;
    const driverLat = driverLocation?.latitude || DHANBAD_GARAGE_LOCATION.latitude;
    const driverLng = driverLocation?.longitude || DHANBAD_GARAGE_LOCATION.longitude;

    const bounds: [number, number][] = [
      [DHANBAD_GARAGE_LOCATION.latitude, DHANBAD_GARAGE_LOCATION.longitude],
      [driverLat, driverLng],
    ];

    mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  const speedKmh = driverLocation?.speed || 0;
  const isStationary = speedKmh === 0;
  const dutyStatus = driverLocation?.dutyStatus || 'ON_DUTY';

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#061B33] text-white flex flex-col">
      {/* Top Telemetry Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#041224]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-[#42B900] border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Live Fleet Radar • Real-Time GPS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#078A32]/30 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{secondsAgo < 5 ? 'Live Telemetry' : `Pinged ${secondsAgo}s ago`}</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>{driver?.name || 'Verified Chauffeur'}</span>
              {vehicle && (
                <span className="text-xs font-mono font-normal text-slate-300">
                  • {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Telemetry Stats & Quick Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Speedometer Gauge */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
              isStationary
                ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-md'
            }`}
          >
            <Gauge className={`w-4 h-4 ${isStationary ? 'text-slate-400' : 'text-[#42B900]'}`} />
            <div>
              <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                True Speed
              </div>
              <div className="text-xs font-black font-mono">
                {speedKmh} km/h •{' '}
                <span className={isStationary ? 'text-slate-400' : 'text-[#42B900]'}>
                  {isStationary ? 'Parked / Idling' : 'Cruising'}
                </span>
              </div>
            </div>
          </div>

          {/* Duty Status */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                Chauffeur Duty
              </div>
              <div className="text-xs font-black text-white">{dutyStatus.replace(/_/g, ' ')}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFocusChauffeur}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Center on Chauffeur"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Center Chauffeur</span>
            </button>

            <button
              onClick={handleFitFleet}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Show Fleet & Base"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Fit Fleet</span>
            </button>

            {driver?.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="p-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                title="Call Chauffeur"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Interactive CARTO Map Canvas */}
      <div className="relative w-full">
        <div ref={mapContainerRef} className={`w-full ${height} z-0 bg-[#061B33]`} />

        {/* Floating Coordinates & HUD Badge */}
        <div className="absolute bottom-3 left-3 z-[400] bg-[#061B33]/90 backdrop-blur-md border border-slate-700 text-white rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {driverLocation?.latitude ? driverLocation.latitude.toFixed(4) : '23.7957'}° N,{' '}
              {driverLocation?.longitude ? driverLocation.longitude.toFixed(4) : '86.4304'}° E
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">
            Accuracy: ±{driverLocation?.accuracy ? Math.round(driverLocation.accuracy) : 8}m
          </span>
          <span className="text-slate-600">|</span>
          <a
            href={`https://www.google.com/maps?q=${
              driverLocation?.latitude || DHANBAD_GARAGE_LOCATION.latitude
            },${driverLocation?.longitude || DHANBAD_GARAGE_LOCATION.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#42B900] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
