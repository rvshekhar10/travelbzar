'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { TravelBzarLogo } from './TravelBzarLogo';
import {
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Car,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Compass,
  BarChart3,
  Wrench,
  Camera,
  Hotel,
  Sliders,
  FileText,
} from 'lucide-react';

export const OwnerTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications(user?.id);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  const mainLinks = [
    { href: '/owner', label: 'Console Overview', icon: LayoutDashboard },
    { href: '/owner/bookings', label: 'All Bookings', icon: CalendarDays },
    { href: '/owner/vehicles', label: 'Vehicles Fleet (1 Cab)', icon: Car },
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
    <>
      <header className="sticky top-0 z-40 bg-[#061B33] border-b border-[#0B223D] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Mobile Drawer Trigger + Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button for Mobile Access to All Pages */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0B223D] active:scale-95 transition-all cursor-pointer border border-slate-700/60"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

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

      {/* Complete Mobile Navigation Drawer (Enables access to ALL pages on mobile) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-Over Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#061B33] text-white flex flex-col h-full shadow-2xl z-10 border-r border-[#0B223D]">
            {/* Header */}
            <div className="p-4 border-b border-[#0B223D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TravelBzarLogo size="sm" variant="light" showTagline={false} clickable={false} />
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  HQ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {/* Operations Links */}
              <div className="space-y-1">
                <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Operations & Fleet
                </span>
                {mainLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#078A32] text-white shadow-md'
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

              {/* Commercial Tools Group */}
              <div className="pt-2 border-t border-[#0B223D] space-y-2">
                <div className="px-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#42B900]" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#42B900]">
                      Commercial Tools
                    </span>
                  </div>
                  <span className="text-[9px] font-black bg-[#42B900] text-[#061B33] px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>

                <div className="space-y-1 bg-gradient-to-b from-[#0B2A4A] to-[#081F38] p-2 rounded-2xl border border-emerald-500/30">
                  {businessTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
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
            </div>

            {/* Footer Profile & Sign Out */}
            <div className="p-3 border-t border-[#0B223D] bg-[#041224]">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[#0B223D]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#078A32] text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
