'use client';

import React, { use, useState, useEffect } from 'react';
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
  Radio,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Banknote,
  Sparkles,
  MapPin,
  XCircle,
} from 'lucide-react';
import { cancelBooking } from '@/services/bookingService';
import { useAuth } from '@/lib/firebase/authContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerBookingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const { booking, loading, refresh } = useBooking(id);
  const { location: driverLocation } = useDriverLocation(booking?.id);
  const [cancelling, setCancelling] = useState(false);

  // Auto-poll/refresh for status changes while finding driver or active trip
  useEffect(() => {
    if (!booking) return;
    if (['PENDING_CONFIRMATION', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(booking.status)) {
      const interval = setInterval(() => {
        refresh();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [booking, refresh]);

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
          className="inline-block bg-[#078A32] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const isFindingDriver = booking.status === 'PENDING_CONFIRMATION';
  const isDriverApproaching = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED'].includes(booking.status);
  const isTripInProgress = booking.status === 'TRIP_STARTED';
  const isTripCompleted = booking.status === 'TRIP_COMPLETED';
  const isCancelled = ['CANCELLED', 'REJECTED'].includes(booking.status);

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this trip request?')) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id, 'Cancelled by customer', {
        name: user?.name || booking.customerName,
        role: 'customer',
        id: user?.id || booking.customerId,
      });
      await refresh();
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Bookings</span>
        </Link>

        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} size="md" />
          <PaymentStatusBadge status={booking.paymentStatus} size="md" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STATE: TRIP REQUESTED • FINDING / LOCATING DRIVER (Ola / Uber Style) */}
      {/* ========================================================================= */}
      {isFindingDriver && (
        <div className="bg-gradient-to-br from-[#061B33] via-[#0B223D] to-[#041224] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-500/40 relative overflow-hidden space-y-6 animate-fade-in">
          {/* Subtle radar glowing background aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Radar Animation & Status Banner */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Concentric pulsing radar visual */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#078A32] to-[#42B900] text-white flex items-center justify-center shadow-lg shadow-emerald-900/50 relative z-10">
                <Radio className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-[#42B900] text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-[#42B900] animate-ping" />
                Trip Requested • Locating Driver
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Finding your Chauffeur...
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Your ride request has been dispatched to available fleet chauffeurs and our Dhanbad operations desk. A driver or fleet manager will accept shortly.
              </p>
            </div>

            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 px-4 py-2.5 rounded-xl transition-all shrink-0 active:scale-95"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>

          {/* Quick Details Preview */}
          <div className="relative z-10 bg-black/40 rounded-2xl p-4 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking ID</span>
              <span className="font-mono font-black text-white text-sm">{booking.bookingNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Scheduled Pickup</span>
              <span className="font-bold text-emerald-400">{booking.bookingDate} at {booking.pickupTime} IST</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Fare</span>
              <span className="font-black text-lg text-[#42B900]">
                ₹{booking.fare.totalFare.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-slate-400 flex items-center gap-2 justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Driver details, car number & live departure map will appear here once accepted.</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATE: CHAUFFEUR CONFIRMED & DISPATCHED (Garage Departure to Pickup) */}
      {/* ========================================================================= */}
      {isDriverApproaching && (
        <div className="space-y-4 animate-fade-in">
          {/* Dispatch Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#061B33] to-[#041224] text-white p-5 sm:p-6 rounded-3xl border-2 border-[#078A32] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#42B900] text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-[#42B900] animate-ping" />
                {booking.status === 'DRIVER_ARRIVED'
                  ? 'Chauffeur Arrived at Pickup!'
                  : 'Chauffeur En Route from Garage to Pickup'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {booking.status === 'DRIVER_ARRIVED'
                  ? 'Your Cab is Outside!'
                  : 'Cab Dispatched from Garage/Depot'}
              </h2>
              <p className="text-xs text-slate-300">
                {booking.status === 'DRIVER_ARRIVED'
                  ? `Your chauffeur ${booking.driverName} has arrived at the pickup location.`
                  : `Your chauffeur ${booking.driverName} is departing from the Dhanbad fleet garage toward your pickup.`}
              </p>
            </div>

            {booking.driverPhone && (
              <a
                href={`tel:${booking.driverPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-lg transition-all shrink-0 self-stretch sm:self-auto justify-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call Chauffeur</span>
              </a>
            )}
          </div>

          {/* Assigned Driver & Vehicle Details Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Chauffeur & Vehicle
                </span>
                <div className="text-base font-black text-slate-900">{booking.driverName}</div>
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-slate-800">{booking.vehicleModel}</span>
                  <span>•</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-900 border border-slate-200">
                    {booking.vehicleRegistrationNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#078A32]" />
              <span>AC Verified • Clean & Sanitized</span>
            </div>
          </div>

          {/* DOMINANT LIVE DRIVER APPROACH MAP (Live GPS Tracking till Ride Start) */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-[#061B33] uppercase tracking-wider flex items-center justify-between px-1">
              <span>Live Garage Departure & Approach Tracker</span>
              <span className="text-[#078A32] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#42B900] animate-ping" />
                GPS Active
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STATE: RIDE IN PROGRESS (In-Cab Journey Screen) */}
      {/* ========================================================================= */}
      {isTripInProgress && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#078A32] text-xs font-black uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-[#078A32] animate-ping" />
                Ride in Progress • In-Cab Journey
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#061B33]">
                Enjoy your comfortable journey
              </h2>
              <p className="text-xs text-slate-500">
                You are riding with {booking.driverName} in {booking.vehicleModel} ({booking.vehicleRegistrationNumber}).
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Agreed Fare</span>
              <span className="text-xl font-black text-[#078A32]">
                ₹{booking.fare.totalFare.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Route & Progress Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Highway Route Progress</span>
              <span className="text-slate-500 font-mono">~{booking.distanceKm} km total</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div className="text-slate-700 truncate">{booking.pickup.address}</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div className="text-slate-900 font-bold truncate">{booking.drop.address}</div>
              </div>
            </div>
          </div>

          {/* Safety & Comfort Reassurance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#078A32] shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold">Premium AC Comfort</strong>
                <span className="text-slate-500 text-[11px]">Clean interior, quiet highway drive.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#078A32]" />
                <div>
                  <strong className="block text-slate-900 font-bold">24×7 Operations SOS</strong>
                  <span className="text-slate-500 text-[11px]">+91 9007210697</span>
                </div>
              </div>
              <a
                href="tel:+919007210697"
                className="text-[11px] font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Call Support
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STATE: TRIP CONCLUDED • PAY CHAUFFEUR IN CASH / UPI */}
      {/* ========================================================================= */}
      {isTripCompleted && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center shadow-md shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#078A32] block">
                  Trip Completed
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#061B33]">
                  Ride Concluded Successfully
                </h2>
                <p className="text-xs text-slate-500">
                  Thank you for travelling with Travel BZAR.
                </p>
              </div>
            </div>

            <Link
              href={`/owner/receipt/${booking.id}`}
              className="flex items-center gap-2 bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Digital Receipt / Invoice</span>
            </Link>
          </div>

          {/* Payment Prompt & Collection Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 block">
                  Payment Due to Chauffeur
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{booking.fare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Real-time Payment Status Pill */}
              <div className="self-start sm:self-auto">
                {booking.paymentStatus === 'PAID' ? (
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payment Received ({booking.paymentMethod || 'Cash/UPI'})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md animate-pulse">
                    <Clock className="w-4 h-4" />
                    <span>Awaiting Chauffeur Confirmation</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Please pay <strong>₹{booking.fare.totalFare.toLocaleString('en-IN')}</strong> directly to Chauffeur{' '}
              <strong>{booking.driverName || 'Rajesh Kumar'}</strong>. You can pay via <strong>Cash</strong> or by scanning their <strong>UPI QR code</strong>.
            </p>

            {/* Payment Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block">Option 1: Cash Payment</strong>
                  <span className="text-[11px] text-slate-500">Hand exact cash directly to the chauffeur.</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block">Option 2: UPI / QR Code</strong>
                  <span className="text-[11px] text-slate-500">Scan driver QR on PhonePe / GPay / Paytm.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Details if Airport Booking */}
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
                  {booking.airport.delayMinutes} mins (Covered under ₹500 rule)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planned Highway Route Map (for non-approaching states) */}
      {!isDriverApproaching && (
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-[#061B33] uppercase tracking-wider px-1">
            Highway Route Details
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

      {/* Itemized Fare Breakdown Component */}
      <FareBreakdown
        fare={booking.fare}
        bookingType={booking.bookingType}
        showEstimatedRange={booking.status === 'PENDING_CONFIRMATION'}
      />
    </div>
  );
}
