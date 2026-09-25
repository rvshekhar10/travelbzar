'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Car,
  Plus,
  Radio,
  Printer,
  RotateCcw,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading } = useBookings({ customerId: user?.id });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const upcomingStatuses = [
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'TRIP_STARTED',
  ];

  // Active ongoing trip spotlight
  const activeOngoingTrip = bookings.find((b) =>
    ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)
  );

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return upcomingStatuses.includes(b.status);
    }
    if (activeTab === 'completed') {
      return b.status === 'TRIP_COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'CANCELLED' || b.status === 'REJECTED';
    }
    return true;
  });

  const loading = authLoading || bookingsLoading;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Travel History & Receipts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">My Bookings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent ride records, live GPS trackers, and instant tax invoices.
          </p>
        </div>

        <Link
          href="/customer/book"
          className="inline-flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book a Cab</span>
        </Link>
      </div>

      {/* Guest / Unauthenticated Prompt */}
      {!user && !loading && (
        <div className="bg-gradient-to-r from-[#061B33] to-[#0E2A4D] text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#42B900] block">
              Customer Account
            </span>
            <h3 className="text-lg font-black text-white">Sign in to sync your travel history</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Log in to see all your past rides, download digital invoices, and track live trips.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/login?redirect=/customer/bookings"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register?redirect=/customer/bookings"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-white/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* Active Ongoing Trip Spotlight Banner */}
      {activeOngoingTrip && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#061B33] to-[#0B2A4A] text-white rounded-3xl p-5 sm:p-6 border-2 border-[#078A32] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-[#42B900] flex items-center justify-center shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#42B900] text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42B900] animate-ping" />
                Live Active Trip • {activeOngoingTrip.status.replace(/_/g, ' ')}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Booking #{activeOngoingTrip.bookingNumber} is Active
              </h3>
              <p className="text-xs text-slate-300">
                To {activeOngoingTrip.drop.address.split(',')[0]} • Chauffeur:{' '}
                <strong className="text-white">{activeOngoingTrip.driverName || 'Assigned'}</strong>
              </p>
            </div>
          </div>

          <Link
            href={`/customer/bookings/${activeOngoingTrip.id}`}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs sm:text-sm font-black px-5 py-3 rounded-xl shadow-lg transition-all shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span>Open Live Tracker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        {[
          { key: 'upcoming', label: 'Upcoming & Active' },
          { key: 'completed', label: 'Completed Trips' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`pb-3 px-3 transition-colors relative ${
              activeTab === tab.key
                ? 'text-[#078A32] border-b-2 border-[#078A32]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#061B33]">Your next journey starts here.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No {activeTab} bookings found. Reserve an airport transfer or a full-day local city cab.
          </p>
          <Link
            href="/customer/book"
            className="inline-block bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all"
          >
            Book a Cab
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#061B33]">
                    {b.bookingNumber}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {b.bookingType.replace(/_/g, ' ')}
                  </span>
                </div>
                <BookingStatusBadge status={b.status} size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      A
                    </span>
                    <span className="text-slate-800 font-semibold truncate">{b.pickup.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      B
                    </span>
                    <span className="text-slate-800 font-semibold truncate">{b.drop.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {b.bookingDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {b.pickupTime} IST
                    </span>
                    <span>• {b.distanceKm} km</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-lg font-black text-[#078A32]">
                      ₹{b.fare.totalFare.toLocaleString('en-IN')}
                    </div>
                    <PaymentStatusBadge status={b.paymentStatus} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {b.status === 'TRIP_COMPLETED' && (
                      <Link
                        href={`/owner/receipt/${b.id}`}
                        title="Print Digital Invoice"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <Link
                      href={`/customer/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#061B33] hover:text-[#078A32] transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Extra action row for completed trips: Book Return / Again */}
              {b.status === 'TRIP_COMPLETED' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Chauffeur: <strong className="text-slate-700">{b.driverName || 'Travel Bzar Chauffeur'}</strong> ({b.vehicleRegistrationNumber || 'Fleet Vehicle'})
                  </span>

                  <Link
                    href={`/customer/book?type=LOCAL_CITY`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078A32] hover:text-[#056B27]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Book Again</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
