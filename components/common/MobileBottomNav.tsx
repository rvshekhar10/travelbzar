'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Home,
  Calendar,
  Bell,
  User,
  Car,
  Compass,
  Wrench,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Camera,
  Hotel,
  Sliders,
  FileText,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const { unreadCount } = useNotifications(user?.id);
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);

  // Hide completely on login/auth routes or public non-portal routes
  const isAuthRoute =
    pathname === '/owner/login' ||
    pathname === '/driver/login' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';
  if (isAuthRoute) return null;

  // Only render on mobile devices and inside authenticated/active portals
  const isPublic = !pathname.startsWith('/customer') && !pathname.startsWith('/driver') && !pathname.startsWith('/owner');
  if (!user && isPublic) return null;

  // Never render customer bottom bar on driver or owner subpaths when unauthenticated
  if (!user && (pathname.startsWith('/driver') || pathname.startsWith('/owner'))) {
    return null;
  }

  // Driver navigation
  if (role === 'driver') {
    const driverItems = [
      { href: '/driver', label: 'Console', icon: Home },
      { href: '/driver/bookings', label: 'Trips', icon: Calendar },
      { href: '/driver/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      { href: '/driver/profile', label: 'Profile', icon: User },
    ];

    return (
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061B33] border-t border-[#0B223D] px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around">
          {driverItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-[#42B900] font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-[#F0441D] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Owner navigation
  if (role === 'owner') {
    const isToolActive = pathname.startsWith('/owner/tools');
    const ownerItems = [
      { href: '/owner', label: 'Console', icon: Home, isActive: pathname === '/owner' },
      { href: '/owner/bookings', label: 'Bookings', icon: Calendar, isActive: pathname === '/owner/bookings' },
      {
        href: '#tools-sheet',
        label: 'Tools',
        icon: Wrench,
        isToolGroup: true,
        isActive: isToolActive,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          setToolsSheetOpen(true);
        },
      },
      { href: '/owner/vehicles', label: 'Fleet', icon: Car, isActive: pathname === '/owner/vehicles' },
      { href: '/owner/notifications', label: 'Alerts', icon: Bell, badge: unreadCount, isActive: pathname === '/owner/notifications' },
    ];

    const businessTools = [
      {
        href: '/owner/tools/flight-quote',
        label: 'Flight Quote OCR',
        desc: 'Extract partner flight rates and generate branded quotation',
        badgeText: 'FLIGHT',
        icon: Camera,
      },
      {
        href: '/owner/tools/hotel-quote',
        label: 'Hotel Quote OCR',
        desc: 'Extract dual-portal rates, apply 20% discount rules & share quote',
        badgeText: 'HOTEL',
        icon: Hotel,
      },
      {
        href: '/owner/tools/markup-settings',
        label: 'Markup Settings',
        desc: 'Global markups, flight margins and WhatsApp agency footer',
        badgeText: 'CONFIG',
        icon: Sliders,
      },
      {
        href: '/owner/tools/ticket-branding',
        label: 'Branded Ticket PDF',
        desc: 'Upload unbranded PNR ticket and stamp Travel BZAR branding',
        badgeText: 'PDF',
        icon: FileText,
      },
    ];

    return (
      <>
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061B33] border-t border-[#0B223D] px-2 py-1.5 shadow-2xl">
          <div className="flex items-center justify-around">
            {ownerItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;
              const isToolGroup = item.isToolGroup;

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'text-white font-black bg-[#078A32] shadow-md border border-emerald-400/40'
                        : 'text-emerald-300 font-bold bg-[#0B2A4A] border border-emerald-500/30'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#42B900]'}`} />
                    <span className="text-[10px] mt-0.5">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-[#42B900] font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1 -right-2 bg-[#F0441D] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Commercial Tools Quick Bottom Sheet for Mobile */}
        {toolsSheetOpen && (
          <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setToolsSheetOpen(false)}
            />
            <div className="relative bg-[#061B33] text-white rounded-t-3xl border-t border-emerald-500/30 p-5 space-y-4 shadow-2xl z-10 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#42B900] flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Commercial Tools Hub</h3>
                    <p className="text-[10px] text-slate-400">Select any tool to create quotations or configure markups</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setToolsSheetOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {businessTools.map((t) => {
                  const Icon = t.icon;
                  const isCurrent = pathname === t.href;
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      onClick={() => setToolsSheetOpen(false)}
                      className={`flex items-start justify-between p-3.5 rounded-2xl transition-all border ${
                        isCurrent
                          ? 'bg-[#078A32] text-white border-emerald-300 shadow-lg'
                          : 'bg-[#0B223D] text-slate-200 border-slate-700/60 hover:bg-[#0E2A4D]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-[#42B900]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{t.label}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black ${
                                isCurrent ? 'bg-white/30 text-white' : 'bg-[#061B33] text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {t.badgeText}
                            </span>
                          </div>
                          <p className={`text-[10px] mt-0.5 line-clamp-1 ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                            {t.desc}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black self-center pl-2">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Customer navigation (Default)
  const customerItems = [
    { href: '/customer', label: 'Home', icon: Home },
    { href: '/customer/book', label: 'Book Cab', icon: Car, highlight: true },
    { href: '/customer/bookings', label: 'Bookings', icon: Calendar },
    { href: '/customer/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { href: '/customer/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061B33] border-t border-[#0B223D] px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {customerItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#078A32] text-white flex items-center justify-center shadow-lg border-2 border-[#061B33] active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-[#42B900] mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive ? 'text-[#42B900] font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-[#F0441D] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
