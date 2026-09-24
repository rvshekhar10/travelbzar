import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Plane,
  ShieldCheck,
  VolumeX,
  Leaf,
  User,
  Snowflake,
  ParkingCircle,
  Moon,
  CalendarCheck,
  Headphones,
  Phone,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';
import { PricingConfig } from '@/types';

interface Props {
  pricing?: PricingConfig;
  showBookButton?: boolean;
}

export const PricingCard: React.FC<Props> = ({ pricing, showBookButton = true }) => {
  const localBase = pricing?.localBaseFare || 2400;
  const localExtraKm = pricing?.localExtraKmRate || 14;
  const localExtraHour = pricing?.localExtraHourRate || 150;

  const ranchiMin = pricing?.airports.ranchi.minimumFare || 3500;
  const ranchiMax = pricing?.airports.ranchi.maximumFare || 4000;

  const deogharMin = pricing?.airports.deoghar.minimumFare || 3000;
  const deogharMax = pricing?.airports.deoghar.maximumFare || 3200;

  const durgapurMin = pricing?.airports.durgapur.minimumFare || 2500;
  const durgapurMax = pricing?.airports.durgapur.maximumFare || 3000;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Rate Card Header - Recreating RATE CARD - DHANBAD banner */}
      <div className="bg-[#061B33] text-white py-3.5 px-6 text-center border-b border-[#0B223D]">
        <div className="flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="w-12 h-[1px] bg-slate-600 hidden sm:inline-block" />
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-widest">
            RATE CARD — DHANBAD
          </h2>
          <span className="w-12 h-[1px] bg-slate-600 hidden sm:inline-block" />
          <span className="w-2 h-2 rounded-full bg-slate-400" />
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top 2 Main Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Package 1: Local City Package */}
          <div className="rounded-2xl border-2 border-[#078A32] overflow-hidden flex flex-col justify-between bg-white shadow-xs">
            <div className="bg-[#078A32] text-white text-center py-2.5 px-4 font-bold text-sm sm:text-base tracking-wide uppercase">
              1. Local City Package
            </div>

            <div className="p-6 text-center flex-1 flex flex-col justify-center items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600">
                8 Hours / 80 KM
              </span>

              <div className="text-4xl sm:text-5xl font-black text-[#078A32] my-3 tracking-tight">
                ₹{localBase.toLocaleString('en-IN')}
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 mt-2">
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Extra KM</span>
                  <span className="text-base font-extrabold text-slate-900">₹{localExtraKm} /KM</span>
                </div>
                <div className="pl-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Extra Hour</span>
                  <span className="text-base font-extrabold text-slate-900">₹{localExtraHour}</span>
                </div>
              </div>
            </div>

            {/* Waiting Charges - Airport Pickup */}
            <div className="border-t border-slate-200">
              <div className="bg-[#F0441D] text-white text-center py-1 text-xs font-bold uppercase tracking-wider">
                Waiting Charges — Local / Pickup
              </div>
              <div className="p-3 text-center bg-orange-50/50">
                <div className="text-xs font-bold text-[#F0441D] flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>₹3 /MINUTE</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">15 Minutes Free Waiting</div>
                <div className="text-[10px] text-slate-500">Applicable after grace period</div>
              </div>
            </div>
          </div>

          {/* Package 2: Airport Pickup & Drop Package */}
          <div className="rounded-2xl border-2 border-[#F0441D] overflow-hidden flex flex-col justify-between bg-white shadow-xs">
            <div className="bg-[#F0441D] text-white text-center py-2.5 px-4 font-bold text-sm sm:text-base tracking-wide uppercase">
              2. Airport Pickup & Drop Package
            </div>

            <div className="p-4 sm:p-5 flex-1 divide-y divide-slate-100 flex flex-col justify-around">
              {/* Ranchi */}
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-10 h-10 rounded-full border-2 border-[#F0441D] text-[#F0441D] flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">
                    Ranchi Airport (Drop / Pickup)
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#F0441D]">
                    ₹{ranchiMin.toLocaleString('en-IN')} – ₹{ranchiMax.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Deoghar */}
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-10 h-10 rounded-full border-2 border-[#F0441D] text-[#F0441D] flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">
                    Deoghar Airport
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#F0441D]">
                    ₹{deogharMin.toLocaleString('en-IN')} – ₹{deogharMax.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Durgapur */}
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-10 h-10 rounded-full border-2 border-[#F0441D] text-[#F0441D] flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">
                    Durgapur Airport
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#F0441D]">
                    ₹{durgapurMin.toLocaleString('en-IN')} – ₹{durgapurMax.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Waiting Charges - Airport Drop */}
            <div className="border-t border-slate-200">
              <div className="bg-[#F0441D] text-white text-center py-1 text-xs font-bold uppercase tracking-wider">
                Waiting Charges — Airport (Drop)
              </div>
              <div className="p-3 text-center bg-orange-50/50">
                <div className="text-xs font-bold text-[#F0441D] flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>₹3 /MINUTE</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">15 Minutes Free Waiting</div>
                <div className="text-[10px] text-slate-500">Applicable at all airport pickup locations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cleaning Charges Banner */}
        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase">
                Cleaning Charges if Car Gets Dirty
              </h4>
              <p className="text-xs text-slate-500">
                Depending on the level of specialized cleaning required
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-xl font-black text-slate-900">₹500 – ₹1,500</span>
          </div>
        </div>

        {/* Why Choose Our Cab? 5 Feature Pillars */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-[#078A32] text-white py-2 text-center text-xs font-bold uppercase tracking-wider">
            Why Choose Our Cab?
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white">
            <div className="p-3 text-center flex flex-col items-center">
              <Leaf className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-800">
                Fuel Efficient Drive
              </span>
            </div>
            <div className="p-3 text-center flex flex-col items-center">
              <VolumeX className="w-5 h-5 text-slate-700 mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-800">
                Silent & Smooth Ride
              </span>
            </div>
            <div className="p-3 text-center flex flex-col items-center">
              <User className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-800">
                Spacious & Comfortable
              </span>
            </div>
            <div className="p-3 text-center flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-[#078A32] mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-800">
                Safe & Reliable
              </span>
            </div>
            <div className="p-3 text-center flex flex-col items-center">
              <Snowflake className="w-5 h-5 text-cyan-600 mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-800">
                AC Comfort All The Way
              </span>
            </div>
          </div>
        </div>

        {/* Operational Indicators 4-Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <ParkingCircle className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 block">PARKING, TOLL & STATE TAX</span>
              <span className="text-slate-500 font-semibold uppercase">EXTRA</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-yellow-400 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 block">NIGHT CHARGES (10 PM – 6 AM)</span>
              <span className="text-[#078A32] font-black">₹300</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 block">ADVANCE BOOKING</span>
              <span className="text-slate-500 font-semibold uppercase">RECOMMENDED</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 block">24×7 SUPPORT</span>
              <span className="text-slate-500 font-semibold uppercase">ALWAYS AVAILABLE</span>
            </div>
          </div>
        </div>

        {/* Airport Flight Delay Notice Rule */}
        <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-orange-950 flex items-start gap-2.5">
          <Plane className="w-4 h-4 text-[#F0441D] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#F0441D]">Airport Flight Delay Rule: </span>
            For airport pickups, if your flight is delayed, a fixed waiting charge of{' '}
            <span className="font-bold">₹500 covers up to 4 hours</span> of driver waiting. (Delay
            over 4 hours subject to operational review).
          </div>
        </div>

        {/* Bottom Booking Action Bar */}
        {showBookButton && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <a
                href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#061B33] text-white text-xs font-bold hover:bg-[#0B223D] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#42B900]" />
                Call Now: {BUSINESS_CONFIG.contact.phone}
              </a>
              <span className="text-xs text-slate-500">Dhanbad, Jharkhand</span>
            </div>

            <Link
              href="/customer/book"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-sm font-extrabold shadow-md transition-all text-center"
            >
              Book Your Cab Now →
            </Link>
          </div>
        )}
      </div>

      {/* Footer thank you message from rate card */}
      <div className="bg-slate-50 border-t border-slate-200 py-2.5 text-center text-xs font-medium text-slate-600 italic">
        Thank you for choosing Travel BZAR! ❤️
      </div>
    </div>
  );
};
