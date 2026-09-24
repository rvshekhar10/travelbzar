'use client';

import React from 'react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { usePricing } from '@/hooks/usePricing';
import { ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';

export default function PricingPage() {
  const { pricing } = usePricing();

  return (
    <div className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          Official Rate Card
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#061B33] mt-4">
          Simple, Transparent Tariffs for Dhanbad
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Every rate is set upfront with zero hidden charges. From local 8-hour city packages to dedicated
          airport drops for Ranchi, Deoghar, and Durgapur airports.
        </p>
      </div>

      <PricingCard pricing={pricing} showBookButton={true} />

      {/* Booking advice notes */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#078A32] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block mb-1">
              Advance Booking Recommended
            </span>
            We recommend booking your cab at least 4 to 12 hours in advance to ensure chauffeur availability
            and sanitized vehicle staging.
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#078A32] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block mb-1">
              Direct Phone & WhatsApp Booking
            </span>
            Prefer booking over a phone call? Our Dhanbad dispatch desk is live 24×7 at{' '}
            <a
              href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
              className="text-[#078A32] font-bold underline"
            >
              {BUSINESS_CONFIG.contact.phone}
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
}
