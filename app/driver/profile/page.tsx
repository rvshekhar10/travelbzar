'use client';

import React from 'react';
import { useAuth } from '@/lib/firebase/authContext';
import { useRouter } from 'next/navigation';
import { Car, ShieldCheck, Phone, Mail, Award, LogOut } from 'lucide-react';

export default function DriverProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
          Chauffeur Identity
        </span>
        <h1 className="text-2xl font-black text-[#061B33] mt-1">Driver Profile</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-xl shadow-md">
            RK
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#061B33]">{user?.name || 'Rajesh Kumar'}</h2>
            <div className="text-xs text-slate-500">Commercial License: JH10-2018-0045892</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#078A32] bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Chauffeur • Rating 4.9 ★</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Assigned Fleet Vehicle</span>
            <span className="font-extrabold text-slate-900">Hyundai Venue (JH-10-BX-1001)</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Mobile Phone</span>
            <span className="font-bold text-slate-900">{user?.phone || '+91 9876543210'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">License Valid Until</span>
            <span className="font-bold text-slate-900">15 May 2030</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Total Completed Trips</span>
            <span className="font-black text-[#078A32]">142 Trips</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Driver Console</span>
          </button>
        </div>
      </div>
    </div>
  );
}
