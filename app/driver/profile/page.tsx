'use client';

import React from 'react';
import { useAuth } from '@/lib/firebase/authContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { useRouter } from 'next/navigation';
import { Car, ShieldCheck, Phone, Mail, Award, LogOut, Loader2 } from 'lucide-react';

export default function DriverProfilePage() {
  const { user, logout } = useAuth();
  const { drivers, loading: loadingDrivers } = useDrivers();
  const { vehicles } = useVehicles();
  const router = useRouter();

  const driverProfile = drivers.find((d) => d.id === user?.id || d.email?.toLowerCase() === user?.email?.toLowerCase());
  const assignedVehicle = vehicles.find((v) => v.id === driverProfile?.assignedVehicleId) || vehicles[0];

  const initials = (user?.name || 'Chauffeur')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DR';

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
            {initials}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#061B33]">{user?.name || 'Verified Chauffeur'}</h2>
            <div className="text-xs text-slate-500">
              Commercial DL: {driverProfile?.licenseNumber || 'Verified by Admin'}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#078A32] bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Chauffeur • Rating {driverProfile?.rating || 5.0} ★</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Assigned Fleet Cab</span>
            <span className="font-extrabold text-slate-900">
              {assignedVehicle
                ? `${assignedVehicle.make} ${assignedVehicle.model} (${assignedVehicle.registrationNumber})`
                : 'Unassigned'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Mobile Phone</span>
            <span className="font-bold text-slate-900">{user?.phone || driverProfile?.phone || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Login Email</span>
            <span className="font-bold text-slate-900">{user?.email || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">DL Validity</span>
            <span className="font-bold text-slate-900">{driverProfile?.licenseExpiry || 'Active'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Total Completed Trips</span>
            <span className="font-black text-[#078A32]">{driverProfile?.totalTrips || 0} Trips</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={async () => {
              await logout();
              router.push('/driver/login');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Driver Console</span>
          </button>
        </div>
      </div>
    </div>
  );
}
