'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plane,
  Sparkles,
  MapPin,
  ArrowRight,
  MessageSquare,
  Car,
  UserPlus,
  Radio,
  QrCode,
  KeyRound,
  Banknote,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';
import { PricingCard } from '@/components/pricing/PricingCard';
import { usePricing } from '@/hooks/usePricing';

export default function HomePage() {
  const { pricing } = usePricing();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#061B33] text-white pt-8 pb-16 sm:py-20 overflow-hidden">
        {/* Decorative background grid and glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="herogrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#60A5FA" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#herogrid)" />
          </svg>
        </div>
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#078A32]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 bg-[#0B223D] border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-bold text-slate-200 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#42B900] animate-pulse" />
            <span>DHANBAD • PREMIUM CAB SERVICE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase">
            TRAVEL <span className="text-[#078A32]">BZAR</span>
          </h1>

          <p className="mt-3 text-lg sm:text-2xl font-bold tracking-wide text-slate-300 uppercase">
            Comfort • Safety • Reliability
          </p>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Dhanbad’s dedicated private chauffeur service. Guaranteed punctual pickups, pristine
            hygienic cabs, and transparent upfront tariffs for local city travel and airport transfers.
          </p>

          {/* Core Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/book"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>Book a Cab Online</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <a
              href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#0B223D] hover:bg-[#122E52] active:scale-95 text-white font-bold text-base px-7 py-4 rounded-2xl border border-slate-700 shadow-md transition-all"
            >
              <Phone className="w-5 h-5 text-[#42B900]" />
              <span>Call: {BUSINESS_CONFIG.contact.phone}</span>
            </a>
          </div>

          {/* 3 Brand Promises Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 bg-[#0B223D]/60 p-3.5 rounded-xl border border-slate-700/40">
              <ShieldCheck className="w-5 h-5 text-[#42B900]" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">SAFE & RELIABLE</span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-[#0B223D]/60 p-3.5 rounded-xl border border-slate-700/40">
              <CheckCircle2 className="w-5 h-5 text-[#42B900]" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                PROFESSIONAL DRIVERS
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 bg-[#0B223D]/60 p-3.5 rounded-xl border border-slate-700/40">
              <Sparkles className="w-5 h-5 text-[#42B900]" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                CLEAN & WELL MAINTAINED CABS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Full Transparency Rider Journey Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              Minimal Full Transparency Mode
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#061B33] mt-3">
              How Travel BZAR Works: Simple, Direct & Honest
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              From discovering fixed tariffs to tracking your chauffeur’s garage departure and 1-tap UPI payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                01
              </div>
              <h3 className="text-base font-black text-slate-900">Learn & Register</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review our zero-surge rate card. Create a rider account in under 30 seconds with phone & email.
              </p>
              <div className="pt-2">
                <Link href="/register" className="text-xs font-bold text-[#078A32] hover:underline flex items-center gap-1">
                  <span>Register Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                02
              </div>
              <h3 className="text-base font-black text-slate-900">Point on Map</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select your Dhanbad pickup and destination with our interactive map pointer and instant GPS detection.
              </p>
              <div className="pt-2">
                <Link href="/customer/book" className="text-xs font-bold text-[#078A32] hover:underline flex items-center gap-1">
                  <span>Set Location</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-black text-sm">
                03
              </div>
              <h3 className="text-base font-black text-slate-900">Connect Chauffeur</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upon confirmation, connect directly via Phone or WhatsApp and track cab departure from our Dhanbad garage.
              </p>
              <div className="pt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Live GPS Tracker</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                04
              </div>
              <h3 className="text-base font-black text-slate-900">Board with PIN</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Driver arrives outside. Check vehicle registration number and share your 4-digit ride OTP to start trip.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Passenger OTP</span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                05
              </div>
              <h3 className="text-base font-black text-slate-900">Pay Cash / UPI</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Arrive smoothly. Pay driver in Cash or scan dynamic UPI QR code (GPay / PhonePe / Paytm). Get instant receipt.
              </p>
              <div className="pt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Instant QR & Invoice</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Rate Card Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Transparent Upfront Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#061B33] mt-3">
            Official Travel BZAR Rate Card
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto">
            No surge pricing. No hidden fees. Clean cars and professional service at fixed competitive rates.
          </p>
        </div>

        {/* Pricing Card component replicating rate card exactly */}
        <PricingCard pricing={pricing} showBookButton={true} />
      </section>

      {/* Airport Transfer Highlights */}
      <section className="bg-slate-100/70 py-12 sm:py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-black text-[#061B33]">
              Seamless Airport Transfers from Dhanbad
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Fixed rate airport packages with courteous chauffeurs and guaranteed flight delay waiting protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ranchi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                    IXR Airport
                  </span>
                  <span className="text-xs text-slate-500 font-medium">~150 km / 3.5 hrs</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-4">Ranchi Airport (IXR)</h4>
                <p className="text-xs text-slate-500 mt-1">Birsa Munda Airport, Ranchi</p>
                <div className="text-2xl font-black text-[#F0441D] mt-3">
                  ₹3,500 – ₹4,000
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Flight Delay Covered</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=IXR"
                  className="text-xs font-bold text-[#078A32] hover:underline"
                >
                  Book Transfer →
                </Link>
              </div>
            </div>

            {/* Deoghar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                    DGH Airport
                  </span>
                  <span className="text-xs text-slate-500 font-medium">~115 km / 2.5 hrs</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-4">Deoghar Airport (DGH)</h4>
                <p className="text-xs text-slate-500 mt-1">Deoghar International Airport</p>
                <div className="text-2xl font-black text-[#F0441D] mt-3">
                  ₹3,000 – ₹3,200
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Flight Delay Covered</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=DGH"
                  className="text-xs font-bold text-[#078A32] hover:underline"
                >
                  Book Transfer →
                </Link>
              </div>
            </div>

            {/* Durgapur */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F0441D] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                    RDP Airport
                  </span>
                  <span className="text-xs text-slate-500 font-medium">~120 km / 2.5 hrs</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-4">Durgapur Airport (RDP)</h4>
                <p className="text-xs text-slate-500 mt-1">Kazi Nazrul Islam Airport</p>
                <div className="text-2xl font-black text-[#F0441D] mt-3">
                  ₹2,500 – ₹3,000
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Flight Delay Covered</span>
                <Link
                  href="/customer/book?type=AIRPORT_DROP&airport=RDP"
                  className="text-xs font-bold text-[#078A32] hover:underline"
                >
                  Book Transfer →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#061B33] text-white py-10 px-4 sm:px-6 lg:px-8 border-t border-[#0B223D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="text-xl font-black tracking-tight">
              TRAVEL <span className="text-[#078A32]">BZAR</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Premium Cab Service • Dhanbad, Jharkhand, India
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <Link href="/pricing" className="hover:text-white">
              Rate Card
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/login" className="hover:text-white font-semibold text-[#42B900]">
              Sign In
            </Link>
          </div>

          <div className="text-xs text-slate-400 text-center sm:text-right">
            <div>Bookings: {BUSINESS_CONFIG.contact.phone}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">© 2026 Travel BZAR. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
