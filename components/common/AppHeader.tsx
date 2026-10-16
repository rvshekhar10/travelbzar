'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TravelBzarLogo } from './TravelBzarLogo';
import { useAuth } from '@/lib/firebase/authContext';
import { BUSINESS_CONFIG } from '@/config/business';
import { User, LogOut, ShieldCheck, Car, Calendar, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMarketingHome = pathname === '/';

  const getDashboardLink = () => {
    if (role === 'owner') return '/owner';
    if (role === 'driver') return '/driver';
    return '/customer/bookings';
  };

  // Dedicated driver and owner operational portals use their own streamlined topbars
  if (pathname.startsWith('/owner') || pathname.startsWith('/driver')) {
    return null;
  }

  // Marketing One-Pager Links (for awareness & WhatsApp lead gen)
  const marketingLinks = [
    { label: 'Hotels', href: '#hotels' },
    { label: 'Flights & Visa', href: '#flights-visa' },
    { label: 'EV Cabs', href: '#ev-cabs' },
    { label: 'Why Us', href: '#why-us' },
  ];

  // Direct Cab Booking Platform Links (accessible only via direct URL)
  const cabNavLinks = [
    { label: 'Cabs Home', href: '/cabs' },
    { label: 'Tariffs', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const navLinks = isMarketingHome ? marketingLinks : cabNavLinks;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo - Pure white canvas with NO extra text using logo-full */}
        <div className="flex items-center">
          <TravelBzarLogo size="md" variant="dark" layout="full" showTagline={false} />
        </div>

        {/* Short & Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold tracking-wide">
          {navLinks.map((link) => {
            const isAnchor = link.href.startsWith('#');
            const isActive = !isAnchor && pathname === link.href;

            if (isAnchor) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-1.5 transition-colors text-slate-600 hover:text-[#078A32]"
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1.5 transition-colors relative hover:text-[#078A32] ${
                  isActive ? 'text-[#078A32] font-bold' : 'text-slate-600'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#078A32] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isMarketingHome ? (
            /* Marketing One-Pager CTA: 100% WhatsApp Lead Gen */
            <a
              href="https://wa.me/919007210697?text=Hi%20Travel%20BZAR%2C%20I%20would%20like%20to%20connect%20with%20your%20concierge%20for%20travel%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white text-xs sm:text-sm font-extrabold px-4 py-2 sm:py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp</span>
            </a>
          ) : (
            /* Direct Cab Platform Action Controls */
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={getDashboardLink()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      role === 'owner'
                        ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        : role === 'driver'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {role === 'owner' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    ) : role === 'driver' ? (
                      <Car className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-[#078A32]" />
                    )}
                    <span className="hidden sm:inline">
                      {role === 'owner' ? 'Owner HQ' : role === 'driver' ? 'Chauffeur' : 'My Trips'}
                    </span>
                  </Link>

                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
              )}

              <Link
                href="/customer/book"
                className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Cab</span>
              </Link>
            </>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu - Clean White Surface */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-lg">
          <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => {
              const isAnchor = link.href.startsWith('#');
              const isActive = !isAnchor && pathname === link.href;

              if (isAnchor) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-[#078A32] font-bold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isMarketingHome ? (
              <a
                href="https://wa.me/919007210697?text=Hi%20Travel%20BZAR%2C%20I%20would%20like%20to%20connect%20with%20your%20concierge."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-between mt-2 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <>
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 text-slate-800 font-bold border border-slate-200 flex items-center justify-between mt-2"
                  >
                    <span>Customer Sign In / Register</span>
                    <ArrowRight className="w-4 h-4 text-[#078A32]" />
                  </Link>
                )}

                {user && (
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 text-[#078A32] font-bold flex items-center justify-between mt-2"
                  >
                    <span>Go to {role === 'owner' ? 'Owner HQ' : role === 'driver' ? 'Chauffeur Console' : 'My Trips'}</span>
                    <span>→</span>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Direct WhatsApp:</span>
            <a
              href="https://wa.me/919007210697"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#078A32] font-bold"
            >
              +91 9007210697
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
