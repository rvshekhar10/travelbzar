import React from 'react';
import { BUSINESS_CONFIG } from '@/config/business';
import { ShieldCheck, UserCheck, Sparkles, MapPin, Award } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          Our Story & Promise
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#061B33] mt-4">
          Redefining Private Travel in Dhanbad
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          Founded in Dhanbad, Jharkhand, Travel BZAR was built with a clear ethos: exceptional
          passenger comfort, absolute safety, and honest, reliable chauffeur services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">Safety & Reliability</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Strict background checks, verified chauffeurs, and vehicles maintained to the highest safety and cleanliness standards.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">Professional Chauffeurs</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Our drivers are polite, punctual, and highly experienced across highway routes to Ranchi, Deoghar, and Kolkata.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#061B33]">Pristine Hygiene</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Every vehicle is thoroughly vacuumed, sanitised, and checked before each journey. Full AC comfort guaranteed.
          </p>
        </div>
      </div>

      <div className="bg-[#061B33] text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#42B900]">
            Operational Base
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">Dhanbad, Jharkhand</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg">
            Serving corporate travelers, families, students, and frequent flyers across Dhanbad, Bokaro, and Giridih.
          </p>
        </div>

        <Link
          href="/customer/book"
          className="bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all shrink-0"
        >
          Book Your Journey Now →
        </Link>
      </div>
    </div>
  );
}
