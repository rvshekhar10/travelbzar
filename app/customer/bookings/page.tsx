'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { Calendar, Clock, MapPin, ArrowRight, Car, Plus } from 'lucide-react';

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const { bookings, loading } = useBookings({ customerId: user?.id });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const upcomingStatuses = [
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'TRIP_STARTED',
  ];

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

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Travel History
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">My Bookings</h1>
        </div>

        <Link
          href="/customer/book"
          className="inline-flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book a Cab</span>
        </Link>
      </div>

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
                    {b.bookingType.replace('_', ' ')}
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

                  <Link
                    href={`/customer/bookings/${b.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#061B33] hover:text-[#078A32] transition-colors"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
