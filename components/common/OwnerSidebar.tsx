'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  Users,
  Compass,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  LogOut,
  Wrench,
  FileText,
  Camera,
  Sliders,
  Hotel,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/firebase/authContext';

export const OwnerSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const mainLinks = [
    { href: '/owner', label: 'Overview', icon: LayoutDashboard },
    { href: '/owner/bookings', label: 'All Bookings', icon: CalendarDays },
    { href: '/owner/vehicles', label: 'Vehicles Fleet (Max 1)', icon: Car },
    { href: '/owner/drivers', label: 'Chauffeurs & Staff', icon: Users },
    { href: '/owner/customers', label: 'Customers & Riders', icon: Sparkles },
    { href: '/owner/pricing', label: 'Rate Card & Pricing', icon: Compass },
    { href: '/owner/analytics', label: 'Reports & Revenue', icon: BarChart3 },
    { href: '/owner/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { href: '/owner/settings', label: 'Business Settings', icon: Settings },
  ];

  const businessTools = [
    {
      href: '/owner/tools/flight-quote',
      label: 'Flight Quote OCR',
      badgeText: 'FLIGHT',
      icon: Camera,
    },
    {
      href: '/owner/tools/hotel-quote',
      label: 'Hotel Quote OCR',
      badgeText: 'HOTEL',
      icon: Hotel,
    },
    {
      href: '/owner/tools/markup-settings',
      label: 'Markup Settings',
      badgeText: 'CONFIG',
      icon: Sliders,
    },
    {
      href: '/owner/tools/ticket-branding',
      label: 'Branded Ticket PDF',
      badgeText: 'PDF',
      icon: FileText,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#061B33] text-white border-r border-[#0B223D] min-h-[calc(100vh-3.5rem)] shrink-0">
      <div className="p-4 border-b border-[#0B223D]">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Operations Control
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#42B900] animate-pulse" />
          <span className="text-sm font-bold text-slate-100">Dhanbad Hub Live</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Core Operations Links */}
        <div className="space-y-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-[#078A32] text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-[#0B223D] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-[#F0441D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Distinct Business Tools Group - Styled with distinctive emerald accent background */}
        <div className="pt-3 border-t border-[#0B223D]/80 space-y-2">
          <div className="px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-[#42B900]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#42B900]">
                Commercial Tools
              </span>
            </div>
            <span className="text-[9px] font-black bg-[#42B900] text-[#061B33] px-2 py-0.5 rounded-full shadow-xs">
              LIVE
            </span>
          </div>

          <div className="space-y-1.5 bg-gradient-to-b from-[#0B2A4A] to-[#081F38] p-2 rounded-2xl border border-emerald-500/30 shadow-inner">
            {businessTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                    ? 'bg-[#078A32] text-white shadow-md border border-emerald-400/30'
                    : 'text-slate-200 hover:bg-emerald-950/40 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#42B900]'}`} />
                    <span className="truncate">{tool.label}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black uppercase ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#061B33] text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {tool.badgeText}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Quick operational reminder banner */}
      <div className="p-4 m-3 rounded-xl bg-[#0B223D] border border-slate-700/60 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#42B900] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fleet Capacity: 1 Cab</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Conflict engine auto-enforces 30-min buffer between trips.
        </p>
      </div>

      {/* Owner Profile & Logout Footer */}
      <div className="p-3 m-3 border-t border-[#0B223D]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#041224] border border-[#0B223D]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#078A32] text-white flex items-center justify-center font-extrabold text-xs shrink-0">
              {(user?.name || user?.email || 'O')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (confirm('Sign out of Owner Command Center?')) {
                await logout();
                router.push('/owner/login');
              }
            }}
            title="Sign out of Owner Console"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
