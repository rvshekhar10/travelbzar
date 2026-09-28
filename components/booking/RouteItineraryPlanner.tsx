'use client';

import React, { useState } from 'react';
import { RouteStop } from '@/types';
import { getPopularTouristAndHaltSpots } from '@/services/mapService';
import {
  MapPin,
  Plus,
  Trash2,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Compass,
  Coffee,
  Camera,
  Briefcase,
  ShoppingBag,
} from 'lucide-react';

interface RouteItineraryPlannerProps {
  stops: RouteStop[];
  onChange: (stops: RouteStop[]) => void;
  bookingType?: string;
  className?: string;
}

const COMMON_HALT_DURATIONS = [
  { label: '15 mins', minutes: 15, hint: 'Tea / Bio-break' },
  { label: '30 mins', minutes: 30, hint: 'Quick Snack / ATM' },
  { label: '45 mins', minutes: 45, hint: 'Lunch / Highway Meal' },
  { label: '1 hour', minutes: 60, hint: 'Sightseeing / Visit' },
  { label: '1.5 hrs', minutes: 90, hint: 'Meeting / Extended' },
  { label: '2 hours', minutes: 120, hint: 'Full Exploration' },
];

const COMMON_HALT_REASONS = [
  'Breakfast / Refreshment',
  'Lunch / Highway Dhaba',
  'Sightseeing & Photography',
  'Temple / Pilgrimage Visit',
  'Client / Business Meeting',
  'Shopping & Local Bazaar',
  'Pick up Passenger / Colleague',
  'Rest / Bio Break',
];

export const RouteItineraryPlanner: React.FC<RouteItineraryPlannerProps> = ({
  stops,
  onChange,
  bookingType,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(stops.length > 0);
  const [showPresetsModal, setShowPresetsModal] = useState<number | null>(null);

  const popularAttractions = getPopularTouristAndHaltSpots();

  const handleAddStop = () => {
    const newStopOrder = stops.length + 1;
    const newStop: RouteStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      address: '',
      latitude: 23.8143, // Default Dhanbad center coordinates
      longitude: 86.4412,
      stopOrder: newStopOrder,
      haltDurationMinutes: 30,
      haltReason: 'Breakfast / Refreshment',
    };
    onChange([...stops, newStop]);
    setIsOpen(true);
  };

  const handleRemoveStop = (index: number) => {
    const updated = stops
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stopOrder: i + 1 }));
    onChange(updated);
  };

  const handleUpdateStop = (index: number, updates: Partial<RouteStop>) => {
    const updated = [...stops];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stops.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-assign stop orders sequentially
    const reordered = updated.map((s, i) => ({ ...s, stopOrder: i + 1 }));
    onChange(reordered);
  };

  const handleApplyPreset = (index: number, preset: (typeof popularAttractions)[0]) => {
    handleUpdateStop(index, {
      address: preset.address,
      latitude: preset.latitude,
      longitude: preset.longitude,
      haltDurationMinutes: preset.recommendedHaltMinutes,
      haltReason: `${preset.category}: ${preset.label}`,
      landmark: preset.description,
    });
    setShowPresetsModal(null);
  };

  const totalHaltMinutes = stops.reduce(
    (sum, s) => sum + (s.haltDurationMinutes || 0),
    0
  );

  return (
    <div
      className={`rounded-3xl border transition-all ${
        isOpen
          ? 'bg-amber-50/30 border-amber-300/80 shadow-xs'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      } p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Header & Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-start gap-3 cursor-pointer select-none"
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              stops.length > 0
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Compass className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">
                Route Itinerary Plan: Intermediate Stops & Halts
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan multiple stops along the way for sightseeing, food halts, temples, or client meetings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {stops.length > 0 && (
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
              {stops.length} Stop{stops.length > 1 ? 's' : ''} • {totalHaltMinutes}m Halts
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            aria-label="Toggle Route Planner"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Planner Body */}
      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-amber-200/60 animate-fade-in text-xs">
          {stops.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white border border-dashed border-amber-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800">No Intermediate Stops Added</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                  By default, your trip goes directly from Pickup to Drop. Add stops if you wish to halt at tourist spots, highway dhabas, or corporate points.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add First Stop / Halt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <div
                  key={stop.id || index}
                  className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-xs space-y-3 relative group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {stop.stopOrder || index + 1}
                      </span>
                      <span className="font-black text-slate-900 text-xs">
                        Stop #{stop.stopOrder || index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move Up/Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, 'up')}
                        disabled={index === 0}
                        title="Move Stop Earlier"
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, 'down')}
                        disabled={index === stops.length - 1}
                        title="Move Stop Later"
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        title="Remove Stop"
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stop Location Address Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Stop / Halt Address</span>
                      </label>

                      {/* Quick Presets Dropdown / Selector */}
                      <button
                        type="button"
                        onClick={() =>
                          setShowPresetsModal(showPresetsModal === index ? null : index)
                        }
                        className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Popular Dhanbad Attractions</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      value={stop.address}
                      onChange={(e) => handleUpdateStop(index, { address: e.target.value })}
                      placeholder="e.g. Maithon Dam, Shakti Mandir, Topchanchi Dhaba, Ozone Galleria..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />

                    {/* Popular Attraction Chips Modal/Flyout */}
                    {showPresetsModal === index && (
                      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 mt-2">
                        <span className="text-[10px] font-black uppercase text-amber-900 block">
                          Tap to Autofill Popular Scenic & Food Halts:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {popularAttractions.map((attraction) => (
                            <button
                              key={attraction.label}
                              type="button"
                              onClick={() => handleApplyPreset(index, attraction)}
                              className="p-2 text-left bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 transition-all text-[11px]"
                            >
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>{attraction.label}</span>
                                <span className="text-[9px] text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded-md">
                                  {attraction.recommendedHaltMinutes}m
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {attraction.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Halt Duration Selection */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Planned Halt Duration</span>
                      </label>
                      <span className="font-mono text-amber-800 font-bold">
                        {stop.haltDurationMinutes || 0} minutes wait
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {COMMON_HALT_DURATIONS.map((d) => (
                        <button
                          key={d.minutes}
                          type="button"
                          onClick={() =>
                            handleUpdateStop(index, { haltDurationMinutes: d.minutes })
                          }
                          className={`py-1.5 px-2 rounded-xl text-center border font-bold transition-all ${
                            stop.haltDurationMinutes === d.minutes
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="text-xs leading-none">{d.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity / Reason for Halt */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-bold text-slate-700 block">
                      Activity / Reason for Halt
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_HALT_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => handleUpdateStop(index, { haltReason: reason })}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                            stop.haltReason === reason
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Landmark / Chauffeur Note */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={stop.landmark || ''}
                      onChange={(e) => handleUpdateStop(index, { landmark: e.target.value })}
                      placeholder="Specific landmark or instructions for driver (e.g. Near gate #2, lakeside parking)..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 bg-slate-50/70 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add Another Stop Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="inline-flex items-center gap-1.5 text-amber-900 bg-amber-100/80 hover:bg-amber-200 active:scale-95 border border-amber-300 font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Stop / Halt</span>
                </button>

                <div className="text-[11px] text-slate-500 font-medium">
                  {stops.length} stop{stops.length > 1 ? 's' : ''} planned
                </div>
              </div>
            </div>
          )}

          {/* Operational Policy Note */}
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Chauffeur Wait Time & Itinerary Coverage</span>
            </div>
            <p className="leading-relaxed">
              For <strong>Local City Packages</strong>, all halts and waiting times are accommodated within the 8-hour / 80-km package. For <strong>Airport Transfers</strong>, planned halts allow you to enjoy tourist spots or meal breaks along highway corridors smoothly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
