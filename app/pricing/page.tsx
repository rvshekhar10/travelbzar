'use client';

import React from 'react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { usePricing } from '@/hooks/usePricing';
import { ShieldCheck, Phone, CheckCircle2, Sparkles, Clock, Plane } from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';
import Link from 'next/link';

export default function PricingPage() {
  const { pricing } = usePricing();

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          Executive Tariffs
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#061B33]">
          Transparent Tariffs. Zero Surge Pricing.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Every tariff is locked in upfront with zero unexpected charges. Fixed luxury tariffs for airport
          transfers to Ranchi, Deoghar, and Durgapur, alongside full-day executive city circuits.
        </p>
      </div>

      {/* Main Tariff Grid Component */}
      <PricingCard pricing={pricing} showBookButton={true} />

      {/* Luxury Commitments Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 pt-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
          <Clock className="w-5 h-5 text-[#078A32] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              Advance Reservation Standard
            </span>
            <p className="text-slate-500 leading-relaxed">
              We recommend reserving your chauffeur at least 4 to 12 hours in advance to guarantee dedicated vehicle preparation, multi-point sanitization, and on-time doorstep staging.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
          <Phone className="w-5 h-5 text-[#078A32] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              24×7 Concierge Support
            </span>
            <p className="text-slate-500 leading-relaxed">
              Prefer speaking directly with our Dhanbad operations desk for bespoke corporate bookings or flight itineraries? Connect with concierge 24×7 at{' '}
              <a
                href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
                className="text-[#078A32] font-bold hover:underline"
              >
                {BUSINESS_CONFIG.contact.phone}
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
