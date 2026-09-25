'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plane,
  Sparkles,
  MapPin,
  ArrowRight,
  Car,
  UserCheck,
  Star,
  Award,
  Radio,
  QrCode,
  Compass,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';
import { PricingCard } from '@/components/pricing/PricingCard';
import { usePricing } from '@/hooks/usePricing';

export default function HomePage() {
  const { pricing } = usePricing();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section - Executive Private Chauffeur */}
      <section className="relative bg-[#061B33] text-white pt-10 pb-18 sm:py-24 overflow-hidden">
        {/* Subtle Luxury Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="luxgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#60A5FA" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#luxgrid)" />
          </svg>
        </div>
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-[#078A32]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Subtle Moniker */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#42B900] animate-pulse" />
            <span className="tracking-widest uppercase">DHANBAD • PRIVATE CHAUFFEUR MOBILITY</span>
          </div>

          {/* Primary Statement */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-tight">
            Punctual. Pristine. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42B900] to-[#078A32]">
              Perfectly Chauffeur-Driven.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            Dhanbad’s dedicated private chauffeur service. Guaranteed on-time doorstep arrival,
            spotless climate-controlled vehicles, and 100% transparent fixed tariffs with zero surge pricing.
          </p>

          {/* Luxury Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/book"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl transition-all shadow-emerald-950/40"
            >
              <Calendar className="w-5 h-5" />
              <span>Reserve a Chauffeur</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-sm sm:text-base px-7 py-4 rounded-2xl border border-slate-700/80 shadow-md transition-all"
            >
              <span>Explore Tariffs & Services</span>
            </Link>
          </div>

          {/* Reassurance Bar */}
          <div className="pt-10 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs font-semibold text-slate-300">
            <div className="flex items-center justify-center gap-2 bg-white/5 p-3 rounded-2xl border border-slate-700/40">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>4.98 Chauffeur Hospitality</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/5 p-3 rounded-2xl border border-slate-700/40">
              <Clock className="w-4 h-4 text-[#42B900] shrink-0" />
              <span>100% Punctuality Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/5 p-3 rounded-2xl border border-slate-700/40">
              <ShieldCheck className="w-4 h-4 text-[#42B900] shrink-0" />
              <span>Zero Surge Standard</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/5 p-3 rounded-2xl border border-slate-700/40">
              <Plane className="w-4 h-4 text-[#F0441D] shrink-0" />
              <span>Flight Delay Waiting Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Travel Bzar Standard (3 Pillars of Executive Hospitality) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            The Travel BZAR Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#061B33] mt-3">
            Designed for Passengers Who Expect More
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Eliminating the uncertainties of roadside hailing, surge multipliers, and inconsistent vehicles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Pillar 1 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#061B33]">Doorstep Punctuality & Flight Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your chauffeur stages at your pickup location 10 minutes prior to departure. For inbound flights at Ranchi, Deoghar, or Durgapur, your driver actively monitors your flight and provides up to 4 hours of complimentary waiting time.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#061B33]">Pristine Climate-Controlled Comfort</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every vehicle in our dedicated fleet undergoes rigorous multi-point daily sanitization, interior detailing, and verified AC maintenance. Enjoy quiet highway suspension and bottled water on every journey.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#061B33]">Fixed Tariffs with Zero Surprise Surcharges</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              What you see is exactly what you pay. No sudden peak-hour multipliers, no luggage surcharges, and no haggling. Settle smoothly upon arrival via dynamic UPI QR code or direct cash, accompanied by an instant digital tax receipt.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Curated Services & Executive Tariffs */}
      <section className="bg-slate-100/70 py-16 sm:py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-white px-3.5 py-1.5 rounded-full border border-slate-200">
              Curated Tariffs
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#061B33] mt-3">
              Transparent, All-Inclusive Tariffs
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Fixed tariffs for regional airport connectivity and all-day city circuits.
            </p>
          </div>

          {/* Pricing Component Replicating Official Menu */}
          <PricingCard pricing={pricing} showBookButton={true} />

          {/* Executive Airport Hub Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Ranchi IXR */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    Birsa Munda Airport
                  </span>
                  <span className="text-xs text-slate-500 font-semibold font-mono">IXR • ~150 km</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Ranchi Airport Transfer</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Smooth NH-32 / NH-20 highway transit. Courteous chauffeur, 4hr delay protection, and airport terminal drop.
                </p>
                <div className="text-2xl font-black text-slate-900 font-mono pt-1">
                  ₹3,500 – ₹4,000
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Fixed Tariff</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=IXR"
                  className="text-xs font-black text-[#078A32] hover:text-[#056B27] flex items-center gap-1"
                >
                  <span>Reserve Chauffeur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Deoghar DGH */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    International Airport
                  </span>
                  <span className="text-xs text-slate-500 font-semibold font-mono">DGH • ~115 km</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Deoghar Airport Transfer</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Comfortable, direct route to Deoghar International Airport. Ideal for religious pilgrimages and executive flights.
                </p>
                <div className="text-2xl font-black text-slate-900 font-mono pt-1">
                  ₹3,000 – ₹3,200
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Fixed Tariff</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=DGH"
                  className="text-xs font-black text-[#078A32] hover:text-[#056B27] flex items-center gap-1"
                >
                  <span>Reserve Chauffeur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Durgapur RDP */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    Kazi Nazrul Islam
                  </span>
                  <span className="text-xs text-slate-500 font-semibold font-mono">RDP • ~120 km</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Durgapur Airport Transfer</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct GT Road highway corridor connecting Dhanbad to Andal/Durgapur airport in under 2.5 hours.
                </p>
                <div className="text-2xl font-black text-slate-900 font-mono pt-1">
                  ₹2,500 – ₹3,000
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Fixed Tariff</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=RDP"
                  className="text-xs font-black text-[#078A32] hover:text-[#056B27] flex items-center gap-1"
                >
                  <span>Reserve Chauffeur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works (Simplified 3-Step Journey) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Effortless Mobility
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#061B33] mt-3">
            How Travel BZAR Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Three simple, transparent steps from booking to arrival.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-black text-base shadow-md">
              01
            </div>
            <h3 className="text-lg font-black text-slate-900">Pin Location on Interactive Map</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select your pickup and destination visually with our interactive map marker. Review your itemized, all-inclusive tariff with zero hidden fees.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#078A32] text-white flex items-center justify-center font-black text-base shadow-md">
              02
            </div>
            <h3 className="text-lg font-black text-slate-900">Chauffeur Dispatched & Live Tracking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect directly with your chauffeur via Phone or WhatsApp. Track the cab’s garage departure live via GPS, and board securely with your 4-digit PIN.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-base shadow-md">
              03
            </div>
            <h3 className="text-lg font-black text-slate-900">Enjoy the Journey & Settle Directly</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unwind in quiet comfort. Upon conclusion, pay effortlessly via 1-tap dynamic UPI QR (GPay / PhonePe / Paytm) or Cash, and receive your digital tax invoice.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Minimal Luxury Footer */}
      <footer className="bg-[#061B33] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-1.5">
            <div className="text-2xl font-black tracking-tight">
              TRAVEL <span className="text-[#078A32]">BZAR</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Private Chauffeur Service • Dhanbad, Jharkhand, India
            </div>
            <div className="text-[11px] text-slate-500">
              Guaranteed Punctuality • Sanitized Executive Fleet • 0 Surge Tariffs
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Tariffs & Services
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              The Experience
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Concierge
            </Link>
            <Link href="/login" className="hover:text-[#42B900] transition-colors">
              Customer Sign In
            </Link>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right space-y-1">
            <div className="font-bold text-white">Concierge: {BUSINESS_CONFIG.contact.phone}</div>
            <div className="text-[11px] text-slate-500">© 2026 Travel BZAR. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
