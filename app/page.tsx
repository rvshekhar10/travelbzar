'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Building2,
  Plane,
  Car,
  MessageCircle,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Calendar,
  MapPin,
  FileCheck,
  Award,
  Globe2,
  Compass,
  PhoneCall,
  ChevronDown,
  Star,
} from 'lucide-react';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { BUSINESS_CONFIG } from '@/config/business';

export default function MarketingHomePage() {
  // Interactive WhatsApp Lead Builder State
  const [selectedService, setSelectedService] = useState<'hotels' | 'flights' | 'cabs' | 'all'>('hotels');
  const [leadName, setLeadName] = useState('');
  const [leadDestination, setLeadDestination] = useState('');
  const [leadDate, setLeadDate] = useState('');
  const [leadRequirement, setLeadRequirement] = useState('');

  const WHATSAPP_NUMBER = '919007210697';

  // Helper to build custom WhatsApp inquiry link
  const generateWhatsAppUrl = (serviceType: string, customMsg?: string) => {
    let text = '';
    if (customMsg) {
      text = customMsg;
    } else if (serviceType === 'hotels') {
      text = 'Hi Travel BZAR, I am inquiring about Hotel Booking services. Please share options and tariffs.';
    } else if (serviceType === 'flights') {
      text = 'Hi Travel BZAR, I need assistance with Flight Tickets and Visa Documentation. Please connect.';
    } else if (serviceType === 'cabs') {
      text = 'Hi Travel BZAR, I would like to book a Sustainable Premium EV Cab. Please share availability & rates.';
    } else {
      text = 'Hi Travel BZAR, I would like to connect with your concierge for complete travel planning.';
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const handleCustomLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceName =
      selectedService === 'hotels'
        ? 'Hotel Booking'
        : selectedService === 'flights'
        ? 'Flight & Visa Services'
        : selectedService === 'cabs'
        ? 'Sustainable Premium EV Cabs'
        : 'All-in-One Travel Package';

    const message = [
      `*New Travel Inquiry via Travel BZAR Website*`,
      `• *Service:* ${serviceName}`,
      leadName ? `• *Name:* ${leadName}` : null,
      leadDestination ? `• *Destination/Route:* ${leadDestination}` : null,
      leadDate ? `• *Tentative Date:* ${leadDate}` : null,
      leadRequirement ? `• *Details:* ${leadRequirement}` : null,
      `Please provide quotations and assistance. Thank you!`,
    ]
      .filter(Boolean)
      .join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ======================================================== */}
      {/* 1. HERO SECTION - Modern Executive Travel & Green Mobility */}
      {/* ======================================================== */}
      <section className="relative bg-gradient-to-b from-white via-slate-50/80 to-[#F1F5F9] pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden border-b border-slate-200/80">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-emerald-100/40 via-blue-50/60 to-emerald-100/30 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-xs border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#078A32] animate-pulse" />
            <span>Your Comprehensive Travel & Green Mobility Partner</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#061B33] tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Hotels. Flights & Visas.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#078A32] via-[#25D366] to-[#061B33]">
              Sustainable EV Cabs.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Travel BZAR brings curated luxury stays, fast-track flight & visa processing, and 100% emission-free
            electric cab transfers under one reliable umbrella. Direct, human-assisted concierge on WhatsApp with zero hidden surges.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a
              href={generateWhatsAppUrl('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Connect on WhatsApp</span>
            </a>

            <a
              href="#services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <span>Explore 3 Pillars</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* 3 Pillar Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#061B33] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Hotel Bookings</h4>
                <p className="text-xs text-slate-500 mt-0.5">Handpicked corporate & leisure stays worldwide</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Flights & Visas</h4>
                <p className="text-xs text-slate-500 mt-0.5">Competitive ticketing & visa document handling</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#078A32] flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-[#078A32]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Sustainable EV Cabs</h4>
                <p className="text-xs text-slate-500 mt-0.5">Zero-emission quiet rides & airport transfers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE THREE CORE PILLARS SECTION */}
      {/* ======================================================== */}
      <section id="services" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            What We Do
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#061B33]">
            Curated Travel Experiences, Handled Personally
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            No robotic call centers. Speak directly with real travel specialists on WhatsApp for transparent rates and tailored hospitality.
          </p>
        </div>

        {/* -------------------------------------------------------- */}
        {/* PILLAR 1: HOTEL BOOKING SERVICES */}
        {/* -------------------------------------------------------- */}
        <div
          id="hotels"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              <span>Worldwide Accommodations</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#061B33] leading-snug">
              Hotel Bookings with Preferred Tariffs & Personal Care
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Skip inflated aggregator commissions and uncertain property standards. Travel BZAR curates verified hotels,
              executive business suites, and tranquil vacation resorts across India and major international destinations.
            </p>

            {/* Benefit Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>3-Star, 4-Star & 5-Star verified stays</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Corporate & long-stay negotiated rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Complimentary breakfast & flexible check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Zero hidden taxes or platform markups</span>
              </div>
            </div>

            {/* Direct WhatsApp CTA */}
            <div className="pt-3">
              <a
                href={generateWhatsAppUrl('hotels')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Book Hotels via WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 to-slate-100 p-6 sm:p-8 rounded-2xl border border-blue-100 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Quick Inquiry</span>
                <span className="text-[10px] font-bold text-slate-400">Response in &lt;15 mins</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Looking for a specific hotel or city?</h4>
              <p className="text-xs text-slate-500">
                Share your dates, budget, and destination on WhatsApp. We provide 3 best-matching verified options instantly.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Popular Cities:</span>
                <span className="font-bold text-slate-800">Kolkata, Delhi, Mumbai, Ranchi</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>International:</span>
                <span className="font-bold text-slate-800">Dubai, Bangkok, Singapore</span>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* PILLAR 2: FLIGHT & VISA SERVICES */}
        {/* -------------------------------------------------------- */}
        <div
          id="flights-visa"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              <Plane className="w-3.5 h-3.5" />
              <span>Aviation & Global Mobility</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#061B33] leading-snug">
              Competitive Flight Tickets & Hassle-Free Visa Guidance
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Say goodbye to stressful paperwork and complicated airline rules. We assist with domestic and international
              air ticketing, multi-sector routes, baggage inclusions, and complete tourist or business visa processing.
            </p>

            {/* Benefit Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Domestic & International Air Ticketing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Tourist & Business Visa application support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Thorough document review before embassy filing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Direct assistance for date changes & cancellations</span>
              </div>
            </div>

            {/* Direct WhatsApp CTA */}
            <div className="pt-3">
              <a
                href={generateWhatsAppUrl('flights')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Get Flight & Visa Support on WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-rose-50 to-slate-100 p-6 sm:p-8 rounded-2xl border border-rose-100 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Fast-Track Visa</span>
                <span className="text-[10px] font-bold text-slate-400">High Approval Ratio</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Popular Visa Corridors</h4>
              <p className="text-xs text-slate-500">
                Dubai, Thailand, Singapore, Malaysia, Schengen Countries, UK & US visa consultation.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Airlines Handled:</span>
                <span className="font-bold text-slate-800">IndiGo, Air India, Emirates, Singapore Airlines</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Consultation:</span>
                <span className="font-bold text-[#078A32]">1-on-1 on WhatsApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* PILLAR 3: SUSTAINABLE PREMIUM EV CABS */}
        {/* -------------------------------------------------------- */}
        <div
          id="ev-cabs"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#078A32] text-xs font-bold border border-emerald-200">
              <Leaf className="w-3.5 h-3.5" />
              <span>Eco-Conscious Mobility</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#061B33] leading-snug">
              Sustainable, Whisper-Quiet Executive EV Cabs
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Step into the future of executive road travel. Travel BZAR is pioneering emission-free, pristine electric
              vehicles across Dhanbad and key airport corridors (Ranchi IXR, Deoghar DGH, Durgapur RDP). Enjoy serene, vibration-free rides.
            </p>

            {/* Benefit Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>100% Zero-Emission Electric Fleet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Pristine, sanitized, climate-controlled cabins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Vetted, polite, executive chauffeurs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
                <span>Zero surge multipliers & guaranteed punctuality</span>
              </div>
            </div>

            {/* Direct WhatsApp CTA */}
            <div className="pt-3">
              <a
                href={generateWhatsAppUrl('cabs')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Reserve EV Cab via WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50 to-slate-100 p-6 sm:p-8 rounded-2xl border border-emerald-100 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#078A32] tracking-wider">Electric Advantage</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Green Travel
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Airport & Outstation Electric Rides</h4>
              <p className="text-xs text-slate-500">
                Direct fixed-fare connections from Dhanbad to Birsa Munda (Ranchi), Deoghar International, and Kazi Nazrul Islam (Durgapur).
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Carbon Impact:</span>
                <span className="font-bold text-[#078A32]">0% Tailpipe Emissions</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>In-Cabin Experience:</span>
                <span className="font-bold text-slate-800">Whisper Quiet Comfort</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. WHY TRAVEL BZAR - Trust & Hospitality */}
      {/* ======================================================== */}
      <section id="why-us" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              The Travel BZAR Standard
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#061B33]">
              Why Travelers Choose Us
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Built on transparency, verified hospitality, and executive reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">1 WhatsApp Chat</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your flights, hotel stays, and EV rides in a single continuous conversation with zero friction.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Zero Surge Tariffs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear, upfront quotes. What you agree on WhatsApp is exactly what you pay—no hidden platform charges.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold">
                <Leaf className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Eco-Friendly Fleet</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated sustainable electric cabs promoting cleaner air and eco-conscious travel in Jharkhand.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Verified Hospitality</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only vetted hotels, certified airline ticketing, and polite executive chauffeurs representing our brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. INTERACTIVE 1-CLICK WHATSAPP INQUIRY GENERATOR */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-emerald-50/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                1-Click Direct Lead
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#061B33]">
                Plan Your Trip in 30 Seconds
              </h3>
              <p className="text-xs text-slate-500">
                Select your service, add your requirements, and send directly to our WhatsApp concierge.
              </p>
            </div>

            <form onSubmit={handleCustomLeadSubmit} className="space-y-4 text-xs">
              {/* Service Selection Tabs */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">Select Service Interested In:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService('hotels')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedService === 'hotels'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>Hotels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedService('flights')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedService === 'flights'
                        ? 'bg-rose-50 border-rose-600 text-rose-700 ring-2 ring-rose-100'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Plane className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                    <span>Flight & Visa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedService('cabs')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedService === 'cabs'
                        ? 'bg-emerald-50 border-[#078A32] text-[#078A32] ring-2 ring-emerald-100'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Leaf className="w-4 h-4 mx-auto mb-1 text-[#078A32]" />
                    <span>EV Cabs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedService('all')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedService === 'all'
                        ? 'bg-amber-50 border-amber-600 text-amber-800 ring-2 ring-amber-100'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Compass className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>Complete Trip</span>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#078A32] text-xs bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Destination / Route</label>
                  <input
                    type="text"
                    value={leadDestination}
                    onChange={(e) => setLeadDestination(e.target.value)}
                    placeholder="e.g. Ranchi Airport or Dubai Hotel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#078A32] text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={leadDate}
                    onChange={(e) => setLeadDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#078A32] text-xs bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Specific Requirements (Optional)</label>
                  <input
                    type="text"
                    value={leadRequirement}
                    onChange={(e) => setLeadRequirement(e.target.value)}
                    placeholder="e.g. 2 guests, 3 nights, quiet EV cab"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#078A32] text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Send Inquiry to Travel BZAR on WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FOOTER - Minimal, Brand-Focused & Strict White Surface */}
      {/* ======================================================== */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 text-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <TravelBzarLogo size="md" variant="dark" layout="ultrawide" showTagline={false} />
            <div className="text-xs text-slate-500 font-medium">
              Hotels • Flight & Visa Documentation • Sustainable Executive EV Cabs
            </div>
            <div className="text-[11px] text-slate-400">
              Operating Base: Bank More, Dhanbad, Jharkhand 826001, India
            </div>
          </div>

          {/* Quick jump navigation */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#hotels" className="hover:text-[#078A32] transition-colors">
              Hotels
            </a>
            <a href="#flights-visa" className="hover:text-[#078A32] transition-colors">
              Flights & Visa
            </a>
            <a href="#ev-cabs" className="hover:text-[#078A32] transition-colors">
              EV Cabs
            </a>
            <a href="#why-us" className="hover:text-[#078A32] transition-colors">
              Why Us
            </a>
            <a
              href={generateWhatsAppUrl('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#078A32] font-bold hover:underline"
            >
              WhatsApp Concierge
            </a>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right space-y-1">
            <div className="font-bold text-slate-800">Direct WhatsApp: +91 9007210697</div>
            <div className="text-[11px] text-slate-400">© 2026 Travel BZAR. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 6. FLOATING WHATSAPP BUTTON (Always Accessible) */}
      {/* ======================================================== */}
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <a
          href={generateWhatsAppUrl('general')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold text-xs cursor-pointer group"
          title="Chat directly on WhatsApp"
        >
          <MessageCircle className="w-5 h-5 fill-current" />
          <span className="hidden sm:inline">Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
