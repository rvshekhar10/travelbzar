'use client';

import React, { useEffect, useState } from 'react';
import { DriverLocation, LocationCoordinate } from '@/types';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { Car, Navigation, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

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
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (driverLocation?.updatedAt) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(driverLocation.updatedAt).getTime()) / 1000));
        setSecondsAgo(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [driverLocation?.updatedAt]);

  const navUrl = getGoogleMapsNavigationUrl(drop, pickup);

  return (
    <div
      className={`relative w-full ${height} rounded-3xl overflow-hidden border-2 border-slate-700/50 shadow-2xl bg-[#041224] flex flex-col justify-between p-4 sm:p-6 text-white select-none`}
    >
      {/* Background Animated Map Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="livegrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#38BDF8" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#livegrid)" />
        </svg>
      </div>

      {/* Top Status Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#061B33]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/40 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42B900] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#42B900]" />
          </span>
          <span className="font-extrabold tracking-wider text-[#42B900] uppercase">
            Live Chauffeur Tracking
          </span>
        </div>

        <div className="text-[11px] text-slate-300 bg-[#061B33]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
          Updated: {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
        </div>
      </div>

      {/* Center Interactive Map Arena */}
      <div className="relative z-10 my-auto py-6">
        <div className="max-w-md mx-auto relative flex items-center justify-between">
          {/* Pickup Marker */}
          <div className="text-center z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg">
              <span className="text-xs font-black">A</span>
            </div>
            <span className="text-[10px] text-slate-300 font-bold block mt-1 truncate max-w-[90px]">
              {pickup.address.split(',')[0]}
            </span>
          </div>

          {/* Dynamic Traveling Live Car Marker */}
          <div className="flex-1 mx-4 relative flex items-center justify-center">
            {/* Pulsing route line */}
            <div className="w-full h-1.5 bg-gradient-to-r from-emerald-500 via-sky-400 to-[#F0441D] rounded-full shadow-lg" />

            {/* Live Cab Icon with radar pulse */}
            <div className="absolute flex flex-col items-center">
              <div className="relative">
                {/* Radar pulse rings */}
                <div className="absolute -inset-2 rounded-full bg-[#42B900] opacity-30 animate-ping" />
                <div className="relative w-12 h-12 rounded-2xl bg-[#061B33] border-2 border-[#42B900] shadow-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-[#42B900]" />
                </div>
              </div>

              {/* Speed & Heading badge */}
              <div className="mt-1 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-700 text-[10px] text-[#42B900] font-bold">
                {driverLocation?.speed ? `${driverLocation.speed} km/h` : 'En Route'}
              </div>
            </div>
          </div>

          {/* Drop Marker */}
          <div className="text-center z-10">
            <div className="w-10 h-10 rounded-full bg-[#F0441D] border-2 border-white flex items-center justify-center shadow-lg">
              <span className="text-xs font-black">B</span>
            </div>
            <span className="text-[10px] text-slate-300 font-bold block mt-1 truncate max-w-[90px]">
              {drop.address.split(',')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Driver / Vehicle Strip */}
      <div className="relative z-10 bg-[#061B33]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-emerald-950 border border-[#078A32] flex items-center justify-center text-[#42B900] shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white truncate">
              {driverName || 'Professional Chauffeur'}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
              <span className="text-[#42B900] font-semibold">{vehicleModel || 'Travel BZAR Cab'}</span>
              <span>•</span>
              <span className="font-mono text-slate-200">{vehicleReg || 'Verified Vehicle'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {driverPhone && (
            <a
              href={`tel:${driverPhone.replace(/\s+/g, '')}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Driver</span>
            </a>
          )}

          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B223D] hover:bg-[#122E52] text-slate-200 text-xs font-bold border border-slate-600 transition-all active:scale-95"
          >
            <span>Open Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
