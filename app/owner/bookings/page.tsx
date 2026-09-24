'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { exportBookingsToCSV } from '@/services/analyticsService';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Car,
  User,
  ArrowRight,
  Plane,
} from 'lucide-react';

export default function OwnerBookingsManagementPage() {
  const { bookings, loading } = useBookings();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    // Search query matching Customer, Phone, Booking ID, Driver, Vehicle
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(q);
      const matchPhone = b.customerPhone?.includes(q);
      const matchId = b.bookingNumber?.toLowerCase().includes(q);
      const matchDriver = b.driverName?.toLowerCase().includes(q);
      const matchVeh = b.vehicleRegistrationNumber?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId && !matchDriver && !matchVeh) return false;
    }

    if (filter === 'today') return b.bookingDate === todayStr;
    if (filter === 'pending') return b.status === 'PENDING_CONFIRMATION';
    if (filter === 'upcoming')
      return ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status);
    if (filter === 'completed') return b.status === 'TRIP_COMPLETED';
    if (filter === 'cancelled') return b.status === 'CANCELLED' || b.status === 'REJECTED';
    if (filter === 'airport') return b.bookingType.startsWith('AIRPORT');
    if (filter === 'local') return b.bookingType === 'LOCAL_CITY';

    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Operations Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">All Bookings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, review, assign chauffeurs, and track customer bookings
          </p>
        </div>

        <button
          onClick={() => exportBookingsToCSV(filteredBookings)}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#078A32]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, phone, booking ID, driver, vehicle..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: "Today's Trips" },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'upcoming', label: 'Upcoming / Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'airport', label: 'Airport Transfers' },
            { id: 'local', label: 'Local Packages' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-[#061B33] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Car className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#061B33]">No Bookings Found</h3>
          <p className="text-xs text-slate-500">
            No bookings match the selected filters or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 text-xs flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-black text-[#061B33]">
                    {b.bookingNumber}
                  </span>
                  <BookingStatusBadge status={b.status} size="sm" />
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {b.bookingType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-slate-800 pt-0.5">
                  <span className="font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {b.customerName} ({b.customerPhone})
                  </span>
                </div>

                <div className="text-slate-600 truncate max-w-xl">
                  <strong className="text-slate-900">Route:</strong> {b.pickup.address.split(',')[0]} →{' '}
                  {b.drop.address.split(',')[0]}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {b.bookingDate} at {b.pickupTime} IST
                  </span>
                  <span>Driver: <strong className="text-slate-800">{b.driverName || 'Unassigned'}</strong></span>
                  <span>Cab: <strong className="text-slate-800">{b.vehicleRegistrationNumber || 'Unassigned'}</strong></span>
                </div>
              </div>

              <div className="flex lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-0 border-slate-100 gap-2 shrink-0">
                <div className="text-left lg:text-right">
                  <div className="text-lg font-black text-[#078A32]">
                    ₹{b.fare.totalFare.toLocaleString('en-IN')}
                  </div>
                  <PaymentStatusBadge status={b.paymentStatus} size="sm" />
                </div>

                <Link
                  href={`/owner/bookings/${b.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
