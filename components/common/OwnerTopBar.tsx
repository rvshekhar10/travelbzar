'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { TravelBzarLogo } from './TravelBzarLogo';
import { Bell, Settings, LogOut, ShieldCheck, Car } from 'lucide-react';

export const OwnerTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = async () => {
    if (confirm('Sign out of Owner Command Center?')) {
      await logout();
      router.push('/owner/login');
    }
  };

  const initials = (user?.name || user?.email || 'Owner')
    .trim()
    .split(/\s+|@/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'OW';

  return (
    <header className="sticky top-0 z-40 bg-[#061B33] border-b border-[#0B223D] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Operations Hub Emblem */}
        <div className="flex items-center gap-3">
          <Link href="/owner" className="flex items-center gap-2">
            <TravelBzarLogo size="sm" variant="light" showTagline={false} clickable={false} />
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin HQ</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#42B900] animate-pulse" />
            <span className="font-semibold text-slate-200">Dhanbad Hub Live</span>
          </div>
        </div>

        {/* Center/Right: Fleet Status, Quick Actions & Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fleet Status Pill */}
          <Link
            href="/owner/vehicles"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B223D] border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
            title="Manage 1-Car Fleet"
          >
            <Car className="w-3.5 h-3.5 text-[#42B900]" />
            <span className="font-semibold">Fleet: 1 Cab</span>
          </Link>

          {/* Operational Alerts */}
          <Link
            href="/owner/notifications"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0B223D] transition-colors"
            title="Operations Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#F0441D] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/owner/settings"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0B223D] transition-colors"
            title="Business Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* User Identity Pill (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#041224] border border-[#0B223D]">
            <div className="w-6 h-6 rounded-md bg-[#078A32] text-white flex items-center justify-center font-extrabold text-[11px]">
              {initials}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">Master Owner</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 hover:text-rose-100 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            title="Sign out of Owner Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
