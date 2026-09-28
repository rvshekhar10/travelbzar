'use client';

import React from 'react';
import { LocationCoordinate, RouteStop } from '@/types';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import {
  MapPin,
  Clock,
  Navigation,
  ExternalLink,
  Milestone,
  Coffee,
  Camera,
  Briefcase,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';

interface RouteLeg {
  fromAddress?: string;
  toAddress?: string;
  distanceKm: number;
  durationMinutes: number;
}

interface RouteItineraryViewProps {
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  stops?: RouteStop[];
  distanceKm?: number;
  drivingDurationMinutes?: number;
  totalHaltMinutes?: number;
  totalDurationMinutes?: number;
  pickupTime?: string;
  bookingDate?: string;
  legs?: RouteLeg[];
  showNavButton?: boolean;
  className?: string;
}

export const RouteItineraryView: React.FC<RouteItineraryViewProps> = ({
  pickup,
  drop,
  stops = [],
  distanceKm,
  drivingDurationMinutes,
  totalHaltMinutes = 0,
  totalDurationMinutes,
  pickupTime,
  bookingDate,
  legs = [],
  showNavButton = true,
  className = '',
}) => {
  const validStops = stops.filter(
    (s) => s.address && s.latitude !== undefined && s.longitude !== undefined
  );

  const googleMapsUrl = getGoogleMapsNavigationUrl(drop, pickup, validStops);

  const getReasonIcon = (reason?: string) => {
    const lower = (reason || '').toLowerCase();
    if (lower.includes('lunch') || lower.includes('food') || lower.includes('meal') || lower.includes('breakfast') || lower.includes('tea')) {
      return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (lower.includes('sightseeing') || lower.includes('tourist') || lower.includes('lake') || lower.includes('dam') || lower.includes('temple')) {
      return <Camera className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (lower.includes('meeting') || lower.includes('client') || lower.includes('office') || lower.includes('work')) {
      return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (lower.includes('shopping') || lower.includes('market') || lower.includes('mall')) {
      return <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />;
    }
    return <Milestone className="w-3.5 h-3.5 text-slate-600" />;
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5 ${className}`}>
      {/* Header and Summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#078A32] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Trip Route Itinerary
            </span>
            {validStops.length > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {validStops.length} Intermediate Stop{validStops.length > 1 ? 's' : ''} & Halts
              </span>
            )}
          </div>
          <h3 className="text-base font-black text-[#061B33] mt-1">
            Complete Travel Plan & Waypoints
          </h3>
        </div>

        {showNavButton && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#42B900]" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Distance</span>
          <span className="text-sm font-black text-slate-900">{distanceKm || 25} km</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Driving Time</span>
          <span className="text-sm font-black text-slate-900">
            ~{drivingDurationMinutes || 45} mins
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <span className="text-[10px] text-amber-800 font-bold uppercase block">Planned Halts</span>
          <span className="text-sm font-black text-amber-900">
            {totalHaltMinutes > 0 ? `${totalHaltMinutes} mins wait` : 'No halts'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
          <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Duration</span>
          <span className="text-sm font-black text-[#078A32]">
            ~{totalDurationMinutes || (drivingDurationMinutes || 45) + totalHaltMinutes} mins
          </span>
        </div>
      </div>

      {/* Vertical Stepper Itinerary */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        {/* PICKUP STEP */}
        <div className="relative group">
          {/* Marker Circle */}
          <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#078A32] text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white ring-2 ring-emerald-100">
            A
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#078A32]">
                Origin Pickup Point
              </span>
              {pickupTime && (
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {pickupTime} IST {bookingDate ? `• ${bookingDate}` : ''}
                  </span>
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-900 leading-snug">{pickup.address}</div>
            {pickup.landmark && (
              <div className="text-[11px] text-slate-500">Landmark: {pickup.landmark}</div>
            )}
          </div>

          {/* Leg Indicator */}
          {legs[0] && (
            <div className="pt-2 pl-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
              <span>↓ Leg 1:</span>
              <span className="text-slate-600 font-mono">
                {legs[0].distanceKm} km • ~{legs[0].durationMinutes} mins drive
              </span>
            </div>
          )}
        </div>

        {/* INTERMEDIATE STOPS */}
        {validStops.map((stop, index) => {
          const leg = legs[index + 1];
          const haltMin = stop.haltDurationMinutes || 15;

          return (
            <div key={stop.id || index} className="relative group">
              {/* Marker Circle */}
              <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white ring-2 ring-amber-100">
                {stop.stopOrder || index + 1}
              </div>

              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Stop #{stop.stopOrder || index + 1}
                    </span>
                    {stop.haltReason && (
                      <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        {getReasonIcon(stop.haltReason)}
                        <span>{stop.haltReason}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>{haltMin} mins halt planned</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 leading-snug">{stop.address}</div>

                {stop.landmark && (
                  <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-amber-100">
                    <strong>Landmark / Note:</strong> {stop.landmark}
                  </div>
                )}
              </div>

              {/* Leg Indicator to next point */}
              {leg && (
                <div className="pt-2 pl-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <span>↓ Leg {index + 2}:</span>
                  <span className="text-slate-600 font-mono">
                    {leg.distanceKm} km • ~{leg.durationMinutes} mins drive
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* DROP OFF STEP */}
        <div className="relative group">
          {/* Marker Circle */}
          <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#F0441D] text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white ring-2 ring-rose-100">
            B
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F0441D]">
                Final Destination / Drop Off
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                End of Trip
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 leading-snug">{drop.address}</div>
            {drop.landmark && (
              <div className="text-[11px] text-slate-500">Landmark: {drop.landmark}</div>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Operational Notes */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#078A32]" />
          <span>Route Plan Transparency</span>
        </div>
        <p>
          Our verified chauffeur follows your planned waypoints via live GPS. Tolls @ actual and parking fees (if any at sightseeing spots or airports) are payable by customer directly.
        </p>
      </div>
    </div>
  );
};
