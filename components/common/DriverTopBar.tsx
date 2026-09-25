'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { TravelBzarLogo } from './TravelBzarLogo';
import { Bell, User, LogOut, Car, ShieldCheck } from 'lucide-react';

export const DriverTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = async () => {
    if (confirm('End duty and sign out of Chauffeur Console?')) {
      await logout();
      router.push('/driver/login');
    }
  };

  const initials = (user?.name || user?.email || 'Chauffeur')
    .trim()
    .split(/\s+|@/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DR';

  return (
    <header className="sticky top-0 z-40 bg-[#061B33] border-b border-[#0B223D] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Chauffeur Duty Tag */}
        <div className="flex items-center gap-2.5">
          <Link href="/driver" className="flex items-center gap-2">
            <TravelBzarLogo size="sm" variant="light" showTagline={false} clickable={false} />
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
              <Car className="w-3 h-3" />
              <span>Chauffeur</span>
            </span>
          </Link>

          <div className="hidden xs:flex items-center gap-1.5 pl-2.5 border-l border-slate-700/60 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#42B900] animate-pulse" />
            <span className="font-semibold text-emerald-300">On Duty</span>
          </div>
        </div>

        {/* Right: Notifications, Driver Profile, and End Duty / Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Trip Alerts / Notifications */}
          <Link
            href="/driver/notifications"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0B223D] transition-colors"
            title="Trip Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#F0441D] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Shortcut */}
          <Link
            href="/driver/profile"
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#041224] border border-[#0B223D] hover:border-slate-600 transition-colors"
            title="Chauffeur Profile"
          >
            <div className="w-6 h-6 rounded-md bg-[#078A32] text-white flex items-center justify-center font-extrabold text-[11px]">
              {initials}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[100px] truncate">
              {user?.name || 'Chauffeur'}
            </span>
          </Link>

          {/* End Duty / Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 hover:text-rose-100 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            title="End duty & sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs">End Duty</span>
          </button>
        </div>
      </div>
    </header>
  );
};
