'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  ArrowRight,
  Phone,
  Plane,
  ShieldCheck,
  Navigation,
  Compass,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { bookings, loading } = useBookings({ customerId: user?.id });

  // Find most relevant active or upcoming booking
  const activeTrip = bookings.find((b) =>
    ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)
  );

  const upcomingBooking = bookings.find((b) =>
    ['PENDING_CONFIRMATION', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status)
  );

  const highlightedBooking = activeTrip || upcomingBooking;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Welcome & Primary Action Card */}
      <div className="bg-gradient-to-r from-[#061B33] via-[#0B223D] to-[#061B33] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#078A32]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#078A32]/40 border border-[#078A32] text-xs font-bold text-[#42B900] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Welcome, {user?.name || 'Customer'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Where would you like to travel today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Premium chauffeur rides in Dhanbad and guaranteed on-time airport drops to Ranchi, Deoghar, and Durgapur.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/customer/book"
              className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Cab Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-2 bg-[#0B223D] hover:bg-[#122F54] text-slate-200 text-xs font-bold px-4 py-3.5 rounded-2xl border border-slate-700 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-[#42B900]" />
              <span>View Rate Card</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active or Upcoming Trip Banner */}
      {highlightedBooking && (
        <div className="bg-white rounded-3xl p-6 border-2 border-[#078A32]/40 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#078A32] animate-ping" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#061B33]">
                {activeTrip ? 'Active Trip in Progress' : 'Current Upcoming Booking'}
              </span>
            </div>
            <BookingStatusBadge status={highlightedBooking.status} size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-500">
                Booking ID: {highlightedBooking.bookingNumber}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Pickup</span>
                    <span className="font-semibold text-slate-900">{highlightedBooking.pickup.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    B
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Destination</span>
                    <span className="font-semibold text-slate-900">{highlightedBooking.drop.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {highlightedBooking.bookingDate} at {highlightedBooking.pickupTime} IST
                </span>
                <span className="font-black text-base text-[#078A32]">
                  ₹{highlightedBooking.fare.totalFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-2 justify-end">
              <Link
                href={`/customer/bookings/${highlightedBooking.id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all"
              >
                {activeTrip ? <Navigation className="w-4 h-4 text-[#42B900]" /> : null}
                <span>{activeTrip ? 'Track Chauffeur Live' : 'View Booking Details'}</span>
              </Link>

              {highlightedBooking.driverPhone && (
                <a
                  href={`tel:${highlightedBooking.driverPhone.replace(/\s+/g, '')}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Chauffeur</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Presets (Local & 3 Airports) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Popular Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Local Package */}
          <Link
            href="/customer/book?type=LOCAL_CITY"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#078A32] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Local City Package</h3>
              <p className="text-[11px] text-slate-500 mt-1">8 Hours / 80 KM in Dhanbad</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-base font-black text-[#078A32]">₹2,400</span>
              <span className="text-xs font-bold text-[#078A32]">Book →</span>
            </div>
          </Link>

          {/* Ranchi Airport */}
          <Link
            href="/customer/book?type=AIRPORT_DROP&airport=IXR"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#F0441D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F0441D] flex items-center justify-center mb-3">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Ranchi Airport</h3>
              <p className="text-[11px] text-slate-500 mt-1">Direct highway transfer</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-[#F0441D]">₹3,500 – ₹4,000</span>
              <span className="text-xs font-bold text-[#F0441D]">Book →</span>
            </div>
          </Link>

          {/* Deoghar Airport */}
          <Link
            href="/customer/book?type=AIRPORT_DROP&airport=DGH"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#F0441D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F0441D] flex items-center justify-center mb-3">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Deoghar Airport</h3>
              <p className="text-[11px] text-slate-500 mt-1">Direct airport transfer</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-[#F0441D]">₹3,000 – ₹3,200</span>
              <span className="text-xs font-bold text-[#F0441D]">Book →</span>
            </div>
          </Link>

          {/* Durgapur Airport */}
          <Link
            href="/customer/book?type=AIRPORT_DROP&airport=RDP"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#F0441D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F0441D] flex items-center justify-center mb-3">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Durgapur Airport</h3>
              <p className="text-[11px] text-slate-500 mt-1">Andal airport transfer</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-[#F0441D]">₹2,500 – ₹3,000</span>
              <span className="text-xs font-bold text-[#F0441D]">Book →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Recent Journeys
          </h2>
          <Link
            href="/customer/bookings"
            className="text-xs font-bold text-[#078A32] hover:underline"
          >
            View All ({bookings.length}) →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your next journey starts here.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven’t booked any cabs yet. Choose an airport drop or local package to get started.
            </p>
            <Link
              href="/customer/book"
              className="inline-block mt-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
            >
              Book a Cab
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((b) => (
              <Link
                key={b.id}
                href={`/customer/bookings/${b.id}`}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {b.bookingNumber}
                    </span>
                    <BookingStatusBadge status={b.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-600 truncate max-w-md">
                    {(b.pickup?.address || 'Pickup').split(',')[0]} → {(b.drop?.address || 'Drop').split(',')[0]}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {b.bookingDate} at {b.pickupTime} IST • {b.bookingType.replace('_', ' ')}
                  </div>
                </div>

                <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="text-base font-black text-slate-900">
                    ₹{b.fare.totalFare.toLocaleString('en-IN')}
                  </span>
                  <PaymentStatusBadge status={b.paymentStatus} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
