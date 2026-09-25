'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TravelBzarLogo } from './TravelBzarLogo';
import { useAuth } from '@/lib/firebase/authContext';
import { BUSINESS_CONFIG } from '@/config/business';
import { User, LogOut, ShieldCheck, Car, Calendar, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === 'owner') return '/owner';
    if (role === 'driver') return '/driver';
    return '/customer/bookings';
  };

  // Dedicated driver and owner operational portals use their own streamlined topbars
  if (pathname.startsWith('/owner') || pathname.startsWith('/driver')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#061B33]/95 backdrop-blur-md border-b border-slate-800/80 text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <TravelBzarLogo size="md" variant="light" showTagline={true} />

        {/* Minimal Luxury Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-slate-300">
          <Link
            href="/"
            className={`transition-colors hover:text-white ${
              pathname === '/' ? 'text-[#42B900]' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className={`transition-colors hover:text-white ${
              pathname === '/pricing' ? 'text-[#42B900]' : ''
            }`}
          >
            Tariffs & Services
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-white ${
              pathname === '/about' ? 'text-[#42B900]' : ''
            }`}
          >
            The Experience
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-white ${
              pathname === '/contact' ? 'text-[#42B900]' : ''
            }`}
          >
            Concierge
          </Link>
        </nav>

        {/* Executive Action Controls */}
        <div className="flex items-center gap-3">
          {/* User state or login */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={getDashboardLink()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-slate-700/80 transition-all"
              >
                {role === 'owner' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : role === 'driver' ? (
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#42B900]" />
                )}
                <span className="hidden sm:inline">
                  {role === 'owner' ? 'HQ Console' : role === 'driver' ? 'Driver Console' : 'My Trips'}
                </span>
              </Link>

              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
          )}

          {/* Primary Luxury CTA: Reserve Chauffeur */}
          <Link
            href="/customer/book"
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg transition-all shadow-emerald-950/40"
          >
            <Calendar className="w-4 h-4" />
            <span>Reserve Chauffeur</span>
          </Link>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#041224] border-b border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-fade-in">
          <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              Tariffs & Services
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              The Experience
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              Concierge & Support
            </Link>

            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-white/5 text-white font-bold flex items-center justify-between"
              >
                <span>Customer Sign In / Register</span>
                <ArrowRight className="w-4 h-4 text-[#42B900]" />
              </Link>
            )}

            {user && (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-[#0B223D] text-[#42B900] font-bold flex items-center justify-between"
              >
                <span>Go to {role === 'owner' ? 'HQ Console' : role === 'driver' ? 'Driver Console' : 'My Trips'}</span>
                <span>→</span>
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-300 font-medium">Concierge Desk:</span>
            <a
              href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
              className="text-[#42B900] font-bold"
            >
              {BUSINESS_CONFIG.contact.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
