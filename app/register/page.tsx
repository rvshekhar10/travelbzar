'use client';

import React from 'react';
import Link from 'next/link';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { ShieldCheck, Phone, Mail, ArrowRight, MessageSquare } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <TravelBzarLogo size="md" variant="dark" showTagline={false} clickable={false} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#078A32] border border-emerald-200 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exclusive Fleet Access</span>
          </div>
          <h2 className="text-2xl font-black text-[#061B33]">Customer Registration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Accounts are provisioned by Travel BZAR administration
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs text-slate-600">
          <p className="leading-relaxed">
            Travel BZAR operates a premium, dedicated cab fleet in Dhanbad. To maintain the highest standard of chauffeur safety and punctuality, customer accounts are provisioned directly by our operations team.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">Request Account Provisioning:</span>

            <a
              href="https://wa.me/919007210697?text=Hello%20Travel%20BZAR,%20I%20would%20like%20to%20request%20a%20rider%20account%20for%20cab%20bookings."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Request via WhatsApp</span>
              </div>
              <span>+91 9007210697 →</span>
            </a>

            <a
              href="tel:+919007210697"
              className="flex items-center justify-between p-3 rounded-xl bg-[#061B33] hover:bg-[#0B223D] text-white font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#42B900]" />
                <span>Call Fleet Operations</span>
              </div>
              <span>+91 9007210697</span>
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="text-[#078A32] font-black hover:underline flex items-center gap-1"
            >
              <span>Sign In Here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
