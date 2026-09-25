'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DriverLocation, LocationCoordinate } from '@/types';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { Car, Navigation, Phone, ExternalLink, ShieldCheck, Radio } from 'lucide-react';
import type * as LType from 'leaflet';

interface Props {
  bookingId: string;
  driverLocation: DriverLocation | null;
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  driverName?: string;
  driverPhone?: string;
  vehicleModel?: string;
  vehicleReg?: string;
  height?: string;
}

export const LiveDriverMap: React.FC<Props> = ({
  driverLocation,
  pickup,
  drop,
  driverName,
  driverPhone,
  vehicleModel,
  vehicleReg,
  height = 'h-80 sm:h-96',
}) => {
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LType.Map | null>(null);
  const driverMarkerRef = useRef<LType.Marker | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Time since last GPS update
  useEffect(() => {
    const interval = setInterval(() => {
      if (driverLocation?.updatedAt) {
        const diff = Math.max(
          0,
          Math.floor((Date.now() - new Date(driverLocation.updatedAt).getTime()) / 1000)
        );
        setSecondsAgo(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [driverLocation?.updatedAt]);

  // Leaflet initialization
  useEffect(() => {
    if (typeof window === 'undefined' || !leafletContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !leafletContainerRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Center between driver and pickup if available, else pickup
      const centerLat = driverLocation?.latitude || pickup.latitude || 23.7957;
      const centerLng = driverLocation?.longitude || pickup.longitude || 86.4304;

      const map = L.map(leafletContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Pickup Marker
      const pickupIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-md uppercase mb-0.5 bg-[#078A32] border border-white">
              PICKUP
            </span>
            <div class="w-8 h-8 rounded-full bg-[#078A32] text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
              A
            </div>
          </div>
        `,
        className: 'custom-live-pickup',
        iconSize: [50, 50],
        iconAnchor: [25, 48],
      });
      L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon }).addTo(map);

      // Driver Marker (Car with radar ping)
      const carLat = driverLocation?.latitude || pickup.latitude - 0.015;
      const carLng = driverLocation?.longitude || pickup.longitude - 0.012;

      const carIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center">
            <div class="relative w-11 h-11 rounded-2xl bg-[#061B33] border-2 border-[#42B900] shadow-2xl flex items-center justify-center text-[#42B900]">
              <span class="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping"></span>
              <svg class="w-6 h-6 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-md uppercase mt-1 bg-[#061B33] border border-[#42B900]">
              CAB EN ROUTE
            </span>
          </div>
        `,
        className: 'custom-live-driver',
        iconSize: [60, 60],
        iconAnchor: [30, 40],
      });

      const driverMarker = L.marker([carLat, carLng], { icon: carIcon }).addTo(map);
      driverMarkerRef.current = driverMarker;

      // Polyline between driver and pickup
      L.polyline(
        [
          [carLat, carLng],
          [pickup.latitude, pickup.longitude],
        ],
        {
          color: '#42B900',
          weight: 4,
          opacity: 0.9,
          dashArray: '6, 6',
        }
      ).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([
        [carLat, carLng],
        [pickup.latitude, pickup.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [pickup.latitude, pickup.longitude]);

  // Update Driver Marker Position when live GPS arrives
  useEffect(() => {
    if (driverLocation && driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    }
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const navUrl = getGoogleMapsNavigationUrl(drop, pickup);

  return (
    <div
      className={`relative w-full ${height} rounded-3xl overflow-hidden border-2 border-slate-700/50 shadow-2xl bg-slate-100 flex flex-col justify-between select-none`}
    >
      {/* Real Visual Leaflet Map Canvas */}
      <div ref={leafletContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Status Header */}
      <div className="absolute top-3 left-3 right-14 sm:right-auto z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-[#061B33]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/40 text-xs text-white shadow-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42B900] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#42B900]" />
          </span>
          <span className="font-extrabold tracking-wider text-[#42B900] uppercase">
            Live Chauffeur GPS
          </span>
        </div>

        <div className="text-[11px] text-slate-300 bg-[#061B33]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-md">
          Updated: {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
        </div>
      </div>

      {/* Bottom Floating Driver Card */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 z-10">
        <div className="bg-[#061B33]/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#42B900] flex items-center justify-center font-bold shrink-0 border border-emerald-500/40">
              <Car className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-white truncate">
                {driverName || 'Assigned Chauffeur'}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {vehicleModel} • {vehicleReg}
              </div>
            </div>
          </div>

          {driverPhone && (
            <a
              href={`tel:${driverPhone.replace(/\s+/g, '')}`}
              className="p-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] text-white transition-all shadow-md shrink-0"
              title="Call Chauffeur"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
