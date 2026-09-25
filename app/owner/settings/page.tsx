'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BUSINESS_CONFIG } from '@/config/business';
import {
  Settings,
  Phone,
  MapPin,
  ShieldCheck,
  Server,
  Key,
  Car,
  Compass,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function OwnerSettingsPage() {
  const [setupStep, setSetupStep] = useState<number>(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">System</span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">
          Business Settings & Setup Wizard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business details, operational parameters, and deployment credentials.
        </p>
      </div>

      {/* SETUP WIZARD SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#078A32]">
              Onboarding & Readiness Wizard
            </span>
            <h2 className="text-lg font-black text-[#061B33]">Let’s Set Up Travel BZAR</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">4 Operational Pillars</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-[#078A32]">Step 1: Profile</span>
              <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
            </div>
            <p className="text-slate-600 text-[11px]">Dhanbad, Jharkhand HQ, Phone & WhatsApp</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-[#078A32]">Step 2: Fleet</span>
              <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
            </div>
            <p className="text-slate-600 text-[11px]">Dedicated primary cab (Firestore synchronized)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-[#078A32]">Step 3: Chauffeur</span>
              <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
            </div>
            <p className="text-slate-600 text-[11px]">Licensed commercial driver active</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-[#078A32]">Step 4: Tariffs</span>
              <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
            </div>
            <p className="text-slate-600 text-[11px]">Rate Card active with flight delay rules</p>
          </div>
        </div>
      </div>

      {/* BUSINESS PROFILE CONFIGURATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[#061B33] pb-2 border-b border-slate-100">
          Business Contact & Identity
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Company Name</label>
            <input
              type="text"
              readOnly
              value={BUSINESS_CONFIG.name}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Tagline</label>
            <input
              type="text"
              readOnly
              value={BUSINESS_CONFIG.tagline}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Direct Phone</label>
            <input
              type="text"
              readOnly
              value={BUSINESS_CONFIG.contact.phone}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-[#078A32]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">WhatsApp Line</label>
            <input
              type="text"
              readOnly
              value={BUSINESS_CONFIG.contact.whatsapp}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-[#078A32]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Operating Location</label>
            <input
              type="text"
              readOnly
              value={BUSINESS_CONFIG.location.displayName}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Fleet Maximum Limit</label>
            <input
              type="text"
              readOnly
              value="2 Vehicles Maximum"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-amber-900"
            />
          </div>
        </div>
      </div>

      {/* CLOUD & API INTEGRATION STATUS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[#061B33] pb-2 border-b border-slate-100">
          Cloud & Platform Integration Status
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-[#078A32]" />
              <div>
                <span className="font-bold text-slate-900 block">Firebase Project</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'travelbzar-d92d3'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              CONNECTED
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-sky-600" />
              <div>
                <span className="font-bold text-slate-900 block">Google Maps Platform</span>
                <span className="text-[11px] text-slate-500">
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    ? 'API Key Configured'
                    : 'Interactive Regional Schematic Active (Ready for Key)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
