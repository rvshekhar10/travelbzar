'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/firebase/authContext';

export const OwnerSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const links = [
    { href: '/owner', label: 'Overview', icon: LayoutDashboard },
    { href: '/owner/bookings', label: 'All Bookings', icon: CalendarDays },
    { href: '/owner/drivers', label: 'Drivers (Chauffeurs)', icon: Users },
    { href: '/owner/vehicles', label: 'Vehicles Fleet (Max 2)', icon: Car },
    { href: '/owner/pricing', label: 'Rate Card & Pricing', icon: Compass },
    { href: '/owner/analytics', label: 'Reports & Revenue', icon: BarChart3 },
    { href: '/owner/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { href: '/owner/settings', label: 'Business Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#061B33] text-white border-r border-[#0B223D] min-h-[calc(100vh-5rem)] shrink-0">
      <div className="p-4 border-b border-[#0B223D]">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Operations Control
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#42B900] animate-pulse" />
          <span className="text-sm font-bold text-slate-100">Dhanbad Hub Live</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
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
      </nav>

      {/* Quick operational reminder banner */}
      <div className="p-4 m-3 rounded-xl bg-[#0B223D] border border-slate-700/60 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#42B900] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fleet Capacity: 2 Cabs</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Conflict engine auto-enforces 30-min buffer between trips.
        </p>
      </div>
    </aside>
  );
};
