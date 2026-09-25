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
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { cancelBooking } from '@/services/bookingService';
import { useAuth } from '@/lib/firebase/authContext';
import { BUSINESS_CONFIG } from '@/config/business';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerBookingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const { booking, loading, refresh } = useBooking(id);
  const { location: driverLocation } = useDriverLocation(booking?.id);
  const [cancelling, setCancelling] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activePayTab, setActivePayTab] = useState<'upi' | 'cash'>('upi');

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

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
              {booking.driverPhone && (
                <>
                  <a
                    href={`tel:${booking.driverPhone.replace(/\s+/g, '')}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-lg transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${booking.driverPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello ${booking.driverName || 'Chauffeur'}, I am ${booking.customerName}, customer for booking #${booking.bookingNumber}. My pickup is: ${booking.pickup.address}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] active:scale-95 text-white text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Driver Arrived - Boarding Verification PIN */}
          {booking.status === 'DRIVER_ARRIVED' && (
            <div className="bg-gradient-to-r from-emerald-600 to-[#078A32] text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-400">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100 flex items-center gap-1.5 justify-center sm:justify-start">
                  <ShieldCheck className="w-4 h-4" />
                  Boarding Verification PIN
                </span>
                <h3 className="text-lg font-black text-white">Share Ride PIN with Chauffeur</h3>
                <p className="text-xs text-emerald-100">
                  Verify car number <span className="font-mono font-bold text-white bg-emerald-800/60 px-2 py-0.5 rounded">{booking.vehicleRegistrationNumber}</span> and provide this PIN to {booking.driverName} before stepping in.
                </p>
              </div>
              <div className="bg-white text-[#061B33] px-6 py-3.5 rounded-2xl shadow-lg font-mono text-3xl font-black tracking-widest text-center shrink-0 border-2 border-emerald-200">
                {booking.bookingNumber ? booking.bookingNumber.replace(/[^0-9]/g, '').slice(-4).padStart(4, '7') : '4821'}
              </div>
            </div>
          )}

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
                  Thank you for travelling with Travel BZAR Dhanbad.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/owner/receipt/${booking.id}`}
                className="flex items-center gap-2 bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Invoice / Receipt</span>
              </Link>
            </div>
          </div>

          {/* Payment Prompt & Collection Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 block">
                  Payment Due to Chauffeur
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{booking.fare.totalFare.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">
                  Transparent Upfront Tariff • 0 Surge • Tolls & Parking included as per actuals
                </span>
              </div>

              {/* Real-time Payment Status Pill */}
              <div className="self-start sm:self-auto">
                {booking.paymentStatus === 'PAID' ? (
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payment Received ({booking.paymentMethod || 'Cash/UPI'})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md animate-pulse">
                    <Clock className="w-4 h-4" />
                    <span>Awaiting Chauffeur Confirmation</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="flex items-center gap-2 p-1 bg-amber-200/50 rounded-2xl w-full sm:w-fit">
              <button
                type="button"
                onClick={() => setActivePayTab('upi')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activePayTab === 'upi'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-amber-950 hover:bg-amber-200/60'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Instant UPI / QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePayTab('cash')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activePayTab === 'cash'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-amber-950 hover:bg-amber-200/60'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash to Chauffeur</span>
              </button>
            </div>

            {/* UPI Option */}
            {activePayTab === 'upi' && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Dynamic QR Code */}
                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-inner flex flex-col items-center shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=${BUSINESS_CONFIG.contact.upiId || '9007210697@upi'}&pn=Travel%20Bzar&am=${booking.fare.totalFare}&cu=INR&tn=Ride%20${booking.bookingNumber}`
                      )}`}
                      alt="Travel Bzar UPI Payment QR"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-2">Scan with GPay / PhonePe / Paytm</span>
                  </div>

                  {/* UPI Details & Mobile Actions */}
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Instant UPI Payment</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scan the dynamic QR code above using any Indian UPI app or use the 1-tap app launch below.
                      </p>
                    </div>

                    {/* Direct UPI Intent Link for Mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <a
                        href={`upi://pay?pa=${BUSINESS_CONFIG.contact.upiId || '9007210697@upi'}&pn=Travel%20Bzar&am=${booking.fare.totalFare}&cu=INR&tn=Ride%20${booking.bookingNumber}`}
                        className="flex items-center justify-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black px-4 py-3 rounded-xl shadow-md transition-all"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Pay ₹{booking.fare.totalFare.toLocaleString('en-IN')} via UPI App</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(BUSINESS_CONFIG.contact.upiId || '9007210697@upi');
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-3 rounded-xl transition-all"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied UPI ID!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy UPI: {BUSINESS_CONFIG.contact.upiId || '9007210697@upi'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      💡 Once your UPI payment is sent, chauffeur {booking.driverName} will verify on their driver terminal and this page will instantly update to PAID.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Option */}
            {activePayTab === 'cash' && (
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center shrink-0">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Cash Payment Instructions</h4>
                    <p className="text-xs text-slate-500">
                      Please hand exact cash of <strong>₹{booking.fare.totalFare.toLocaleString('en-IN')}</strong> directly to Chauffeur {booking.driverName || 'your chauffeur'}.
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Chauffeur will mark receipt on their mobile console immediately upon receiving cash. You can print or download your digital tax invoice above anytime.
                </div>
              </div>
            )}
          </div>

          {/* Quick Re-Booking & Return Ride Shortcuts */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/customer/book?type=LOCAL_CITY`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4 text-[#42B900]" />
              <span>Book Another Ride / Return</span>
            </Link>

            <Link
              href="/customer/bookings"
              className="w-full sm:w-auto text-center text-xs font-bold text-slate-600 hover:text-slate-900 py-2 sm:py-0"
            >
              View All Ride Histories →
            </Link>
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
