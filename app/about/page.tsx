import React from 'react';
import { BUSINESS_CONFIG } from '@/config/business';
import { ShieldCheck, UserCheck, Sparkles, MapPin, Award, Star, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* Top Brand Mission */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          The Experience
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#061B33]">
          Redefining Private Chauffeur Mobility in Dhanbad
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Founded with an uncompromising commitment to punctuality, vehicle hygiene, and transparent hospitality, Travel BZAR delivers executive private mobility across Dhanbad, Bokaro, and Jharkhand’s primary airport corridors.
        </p>
      </div>

      {/* 3 Executive Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">100% Punctuality Protocol</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your chauffeur stages 10 minutes ahead of scheduled pickup. For flights arriving into Ranchi, Deoghar, or Durgapur, inbound status is monitored with up to 4 hours of complimentary delay waiting.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">Verified Professional Chauffeurs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every driver in our service is background-checked, vetted for extensive highway driving experience, and trained in passenger privacy, quiet highway etiquette, and route navigation.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">Immaculate Fleet Hygiene</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our single-vehicle executive fleet is vacuumed, sanitized, and inspected prior to every journey. Verified climate control, quiet interior, and complimentary bottled water on every trip.
          </p>
        </div>
      </div>

      {/* Operational Base Banner */}
      <div className="bg-gradient-to-r from-[#061B33] via-[#0B223D] to-[#041224] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-slate-700/60">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#42B900]">
            <span className="w-2 h-2 rounded-full bg-[#42B900] animate-pulse" />
            <span>Operational Depot • Dhanbad, Jharkhand</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Ready for a Quiet, Comfortable Journey?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Whether arriving on a late-night flight into Ranchi or planning a full-day corporate schedule in Dhanbad, our chauffeur service is at your command.
          </p>
        </div>

        <Link
          href="/customer/book"
          className="bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl transition-all shrink-0"
        >
          Reserve a Chauffeur →
        </Link>
      </div>
    </div>
  );
}
