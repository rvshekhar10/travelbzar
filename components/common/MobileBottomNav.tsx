'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Home, Calendar, Bell, User, Car, Compass } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const { unreadCount } = useNotifications(user?.id);

  // Only render on mobile devices and inside authenticated/active portals
  if (!user && pathname === '/') return null;

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
    const ownerItems = [
      { href: '/owner', label: 'Dashboard', icon: Home },
      { href: '/owner/bookings', label: 'Bookings', icon: Calendar },
      { href: '/owner/vehicles', label: 'Fleet', icon: Car },
      { href: '/owner/pricing', label: 'Rates', icon: Compass },
      { href: '/owner/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    ];

    return (
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061B33] border-t border-[#0B223D] px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around">
          {ownerItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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
