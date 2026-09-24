'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TravelBzarLogo } from './TravelBzarLogo';
import { useAuth } from '@/lib/firebase/authContext';
import { BUSINESS_CONFIG } from '@/config/business';
import { Phone, MessageSquare, User, LogOut, ShieldCheck, Car, Calendar, Menu, X } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === 'owner') return '/owner';
    if (role === 'driver') return '/driver';
    return '/customer';
  };

  const isPublic = !pathname.startsWith('/customer') && !pathname.startsWith('/driver') && !pathname.startsWith('/owner');

  return (
    <header className="sticky top-0 z-50 bg-[#061B33] border-b border-[#0B223D] text-white shadow-md">
      {/* Top micro bar for quick business contact & reassurance */}
      <div className="hidden sm:block bg-[#041224] py-1 px-4 text-xs text-slate-300 border-b border-[#0A1D36]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#42B900] animate-pulse" />
              Dhanbad, Jharkhand • Available 24×7
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 font-medium tracking-wide">
              COMFORT • SAFETY • RELIABILITY
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-white hover:text-[#42B900] transition-colors font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#42B900]" />
              Book Now: {BUSINESS_CONFIG.contact.phone}
            </a>
            <a
              href={`https://wa.me/919007210697?text=Hello%20Travel%20Bzar%2C%20I%20would%20like%20to%20enquire%20about%20a%20cab%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#42B900] hover:text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <TravelBzarLogo size="md" variant="light" showTagline={true} />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-200">
          <Link
            href="/"
            className={`transition-colors hover:text-white ${
              pathname === '/' ? 'text-[#42B900] font-semibold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className={`transition-colors hover:text-white ${
              pathname === '/pricing' ? 'text-[#42B900] font-semibold' : ''
            }`}
          >
            Rate Card & Pricing
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-white ${
              pathname === '/about' ? 'text-[#42B900] font-semibold' : ''
            }`}
          >
            Why Travel BZAR
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-white ${
              pathname === '/contact' ? 'text-[#42B900] font-semibold' : ''
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* User state or login */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={getDashboardLink()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2849] hover:bg-[#163864] text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                {role === 'owner' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : role === 'driver' ? (
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#42B900]" />
                )}
                <span>
                  {role === 'owner' ? 'Owner HQ' : role === 'driver' ? 'Driver Console' : 'My Trips'}
                </span>
              </Link>

              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#0B223D] transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Book A Cab Primary CTA */}
          <Link
            href="/customer/book"
            className="flex items-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] active:bg-[#04501D] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition-all transform active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Book a Cab</span>
          </Link>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#041224] border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B223D]"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B223D]"
            >
              Rate Card & Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B223D]"
            >
              About Travel BZAR
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B223D]"
            >
              Contact & Support
            </Link>
            {user && (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-[#0B223D] text-[#42B900] font-semibold flex items-center justify-between"
              >
                <span>Go to {role?.toUpperCase()} Dashboard</span>
                <span>→</span>
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <a href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 text-white">
              <Phone className="w-3.5 h-3.5 text-[#42B900]" />
              {BUSINESS_CONFIG.contact.phone}
            </a>
            <span className="text-[#42B900]">Advance Booking Recommended</span>
          </div>
        </div>
      )}
    </header>
  );
};
