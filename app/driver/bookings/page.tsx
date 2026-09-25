'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { Calendar, Clock, MapPin, ArrowRight, Car } from 'lucide-react';

export default function DriverBookingsListPage() {
  const { user } = useAuth();
  const { bookings, loading } = useBookings();

  const driverTrips = bookings.filter((b) => !b.driverId || b.driverId === user?.id);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
          Duty Schedule
        </span>
        <h1 className="text-2xl font-black text-[#061B33] mt-1">My Assigned Trips</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : driverTrips.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-2">
          <Car className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Assigned Trips</h3>
          <p className="text-xs text-slate-500">You currently have no scheduled trips.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {driverTrips.map((b) => (
            <Link
              key={b.id}
              href={`/driver/trip/${b.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all block"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{b.bookingNumber}</span>
                  <BookingStatusBadge status={b.status} size="sm" />
                </div>
                <div className="font-bold text-slate-800">
                  {b.customerName} ({b.customerPhone})
                </div>
                <div className="text-slate-600 truncate max-w-md">
                  {(b.pickup?.address || 'Pickup').split(',')[0]} → {(b.drop?.address || 'Drop').split(',')[0]}
                </div>
                <div className="text-[11px] text-slate-400">
                  {b.bookingDate} at {b.pickupTime} IST • {b.bookingType.replace('_', ' ')}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-base font-black text-[#078A32]">
                    ₹{b.fare.totalFare.toLocaleString('en-IN')}
                  </span>
                  <div>
                    <PaymentStatusBadge status={b.paymentStatus} size="sm" />
                  </div>
                </div>

                <span className="text-xs font-bold text-[#061B33] flex items-center gap-1 mt-2">
                  <span>Trip Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
