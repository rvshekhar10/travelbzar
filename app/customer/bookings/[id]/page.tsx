'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useBooking } from '@/hooks/useBookings';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import { LiveDriverMap } from '@/components/maps/LiveDriverMap';
import { MapView } from '@/components/maps/MapView';
import {
  Phone,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  Printer,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Plane,
} from 'lucide-react';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerBookingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { booking, loading } = useBooking(id);
  const { location: driverLocation } = useDriverLocation(booking?.id);

  if (loading) {
    return (
      <div className="py-12 px-4 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-[#061B33]">Booking Not Found</h2>
        <p className="text-xs text-slate-500">
          The booking you requested does not exist or may have been removed.
        </p>
        <Link
          href="/customer/bookings"
          className="inline-block bg-[#078A32] text-white text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const isTripActive = ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(booking.status);
  const isTripCompleted = booking.status === 'TRIP_COMPLETED';

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Bookings</span>
        </Link>

        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} size="md" />
          <PaymentStatusBadge status={booking.paymentStatus} size="md" />
        </div>
      </div>

      {/* Main Booking Title Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-extrabold text-[#078A32] tracking-wider">
            {booking.bookingType.replace('_', ' ')}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#061B33] font-mono mt-0.5">
            {booking.bookingNumber}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {booking.bookingDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {booking.pickupTime} IST
            </span>
          </div>
        </div>

        {/* Print / View Receipt CTA */}
        {isTripCompleted && (
          <Link
            href={`/owner/receipt/${booking.id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#061B33] text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Digital Receipt</span>
          </Link>
        )}
      </div>

      {/* DOMINANT LIVE TRACKING MAP (50-60% height if trip is in progress) */}
      {isTripActive ? (
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-[#061B33] uppercase tracking-wider flex items-center justify-between">
            <span>Live Chauffeur GPS Tracking</span>
            <span className="text-[#078A32] flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#42B900] animate-ping" />
              Live Sharing Active
            </span>
          </div>
          <LiveDriverMap
            bookingId={booking.id}
            driverLocation={driverLocation}
            pickup={booking.pickup}
            drop={booking.drop}
            driverName={booking.driverName}
            driverPhone={booking.driverPhone}
            vehicleModel={booking.vehicleModel}
            vehicleReg={booking.vehicleRegistrationNumber}
            height="h-80 sm:h-96"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-[#061B33] uppercase tracking-wider">
            Planned Route
          </div>
          <MapView
            pickup={booking.pickup}
            drop={booking.drop}
            distanceKm={booking.distanceKm}
            durationMinutes={booking.estimatedDurationMinutes}
            height="h-64 sm:h-72"
          />
        </div>
      )}

      {/* Assigned Driver and Cab Details Card */}
      {booking.driverId ? (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold text-lg shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Assigned Chauffeur & Vehicle
              </span>
              <div className="text-sm font-black text-slate-900">{booking.driverName}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-700">{booking.vehicleModel}</span>
                <span>•</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                  {booking.vehicleRegistrationNumber}
                </span>
              </div>
            </div>
          </div>

          {booking.driverPhone && (
            <a
              href={`tel:${booking.driverPhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-stretch sm:self-auto justify-center"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Driver ({booking.driverPhone})</span>
            </a>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
          <span>
            {booking.status === 'PENDING_CONFIRMATION'
              ? 'Our operations desk will confirm the booking and assign a professional chauffeur shortly.'
              : 'Driver assignment in progress.'}
          </span>
        </div>
      )}

      {/* Flight Details if Airport */}
      {booking.airport && (
        <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-orange-950">
            <Plane className="w-4 h-4 text-[#F0441D]" />
            <span>Flight & Airport Schedule</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
            <div>
              <span className="text-[10px] text-slate-500 block">Airport</span>
              <span className="font-bold">{booking.airport.name}</span>
            </div>
            {booking.airport.flightNumber && (
              <div>
                <span className="text-[10px] text-slate-500 block">Flight Number</span>
                <span className="font-bold">{booking.airport.flightNumber}</span>
              </div>
            )}
            {booking.airport.delayMinutes !== undefined && booking.airport.delayMinutes > 0 && (
              <div>
                <span className="text-[10px] text-slate-500 block">Flight Delay</span>
                <span className="font-bold text-[#F0441D]">
                  {booking.airport.delayMinutes} mins (Covered)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Itemized Fare Breakdown */}
      <FareBreakdown
        fare={booking.fare}
        bookingType={booking.bookingType}
        showEstimatedRange={booking.status === 'PENDING_CONFIRMATION'}
      />
    </div>
  );
}
