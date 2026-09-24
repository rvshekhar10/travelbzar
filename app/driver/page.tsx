'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import {
  Phone,
  Navigation,
  Play,
  MapPin,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const { bookings, loading } = useBookings();

  // Driver trips (either explicitly assigned or available in POC)
  const driverBookings = bookings.filter((b) => !b.driverId || b.driverId === user?.id || b.driverId === 'drv-1');

  // 1. Current Active Trip
  const currentTrip = driverBookings.find((b) =>
    ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)
  );

  // 2. Next Upcoming Confirmed Booking
  const nextBooking = driverBookings.find((b) =>
    ['CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status)
  );

  // 3. Completed Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrips = driverBookings.filter((b) => b.bookingDate === todayStr);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Driver Header */}
      <div className="bg-[#061B33] text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-[#0B223D] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold text-[#42B900] tracking-wider block">
            Chauffeur Console
          </span>
          <h1 className="text-xl sm:text-2xl font-black">{user?.name || 'Rajesh Kumar'}</h1>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <span>Vehicle: Hyundai Venue (JH-10-BX-1001)</span>
            <span>•</span>
            <span className="text-[#42B900] font-bold">Duty: Active</span>
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0B223D] border border-slate-700 flex items-center justify-center text-[#42B900]">
          <Car className="w-6 h-6" />
        </div>
      </div>

      {/* 1. CURRENT ACTIVE TRIP (Highest Priority for Driver) */}
      {currentTrip && (
        <div className="bg-gradient-to-br from-emerald-950 to-[#061B33] text-white rounded-3xl p-6 border-2 border-[#42B900] shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#42B900] animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-[#42B900]">
                Active Trip In Progress
              </span>
            </div>
            <BookingStatusBadge status={currentTrip.status} size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger</span>
                <div className="text-base font-black text-white">{currentTrip.customerName}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fare</span>
                <div className="text-lg font-black text-[#42B900]">
                  ₹{currentTrip.fare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-3 rounded-2xl border border-emerald-900/40 text-xs space-y-1.5">
              <div className="truncate">
                <strong className="text-emerald-400">Pickup:</strong> {currentTrip.pickup.address}
              </div>
              <div className="truncate">
                <strong className="text-rose-400">Drop:</strong> {currentTrip.drop.address}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {/* Call Customer */}
              <a
                href={`tel:${currentTrip.customerPhone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-1.5 bg-[#0B223D] hover:bg-[#122F54] text-white text-xs font-bold py-3 rounded-xl border border-slate-700"
              >
                <Phone className="w-3.5 h-3.5 text-[#42B900]" />
                <span>Call Customer</span>
              </a>

              {/* Navigation */}
              <a
                href={getGoogleMapsNavigationUrl(currentTrip.drop, currentTrip.pickup)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-[#0B223D] hover:bg-[#122F54] text-white text-xs font-bold py-3 rounded-xl border border-slate-700"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>GPS Nav</span>
              </a>

              {/* Open Trip Console */}
              <Link
                href={`/driver/trip/${currentTrip.id}`}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-black py-3 rounded-xl shadow-md"
              >
                <span>Live Trip Console →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. NEXT ASSIGNED BOOKING */}
      {nextBooking && !currentTrip && (
        <div className="bg-white rounded-3xl p-6 border-2 border-sky-400/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-800">
              Next Upcoming Booking
            </span>
            <BookingStatusBadge status={nextBooking.status} size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <div className="text-base font-black text-slate-900">{nextBooking.customerName}</div>
                <div className="text-xs text-slate-500">{nextBooking.customerPhone}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Agreed Fare</span>
                <div className="text-xl font-black text-[#078A32]">
                  ₹{nextBooking.fare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  A
                </span>
                <span className="text-slate-800 font-semibold">{nextBooking.pickup.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  B
                </span>
                <span className="text-slate-800 font-semibold">{nextBooking.drop.address}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center gap-3">
                <span className="font-semibold text-slate-700">
                  {nextBooking.bookingDate} at {nextBooking.pickupTime} IST
                </span>
                <span>• {nextBooking.bookingType.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${nextBooking.customerPhone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-3 rounded-xl transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Call Customer</span>
              </a>

              <Link
                href={`/driver/trip/${nextBooking.id}`}
                className="flex items-center justify-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Trip Console</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. ASSIGNED BOOKINGS OVERVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Assigned Bookings ({driverBookings.length})
          </h2>
          <Link href="/driver/bookings" className="text-xs font-bold text-[#078A32] hover:underline">
            View All →
          </Link>
        </div>

        {driverBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p>No trips assigned right now. Standby for dispatch notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {driverBookings.slice(0, 4).map((b) => (
              <Link
                key={b.id}
                href={`/driver/trip/${b.id}`}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{b.bookingNumber}</span>
                    <BookingStatusBadge status={b.status} size="sm" />
                  </div>
                  <div className="text-slate-600 font-medium truncate max-w-md">
                    {b.customerName} ({b.customerPhone})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {b.bookingDate} at {b.pickupTime} IST • {b.bookingType.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
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
