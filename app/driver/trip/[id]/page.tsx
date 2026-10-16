'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useBooking } from '@/hooks/useBookings';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import {
  updateBookingTripStatus,
  recordBookingPayment,
  returnVehicleToGarage,
  adjustTripDetourAndStayCharges,
} from '@/services/bookingService';
import {
  startDriverLiveBroadcaster,
  stopDriverLiveBroadcaster,
  getGarageNavigationUrl,
} from '@/services/locationService';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import { LiveDriverMap } from '@/components/maps/LiveDriverMap';
import { RouteItineraryView } from '@/components/booking/RouteItineraryView';
import { PaymentMethod, PaymentStatus } from '@/types';
import {
  Phone,
  Navigation,
  Play,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Radio,
  ExternalLink,
  Car,
  Warehouse,
  Compass,
  Moon,
  Plus,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function DriverTripConsolePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { booking, loading, refresh } = useBooking(id);
  const { location: driverLocation } = useDriverLocation(booking?.id);

  // Live trip elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Detour & Stay Adjustment Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [extraDetourKm, setExtraDetourKm] = useState<number>(0);
  const [extraWaitMins, setExtraWaitMins] = useState<number>(0);
  const [extraStayNights, setExtraStayNights] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [txnRef, setTxnRef] = useState('');

  // Trip timer hook
  useEffect(() => {
    if (booking?.status === 'TRIP_STARTED') {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking?.status]);

  // Manage live location broadcaster when trip is active
  useEffect(() => {
    if (booking && booking.status === 'TRIP_STARTED') {
      const stopFn = startDriverLiveBroadcaster(
        booking.id,
        user?.id || '',
        booking.pickup,
        booking.drop
      );
      setIsBroadcasting(true);

      return () => {
        stopFn();
        setIsBroadcasting(false);
      };
    }
  }, [booking?.status, booking?.id, user?.id]);

  if (loading) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto space-y-4">
        <div className="h-8 bg-slate-200 animate-pulse rounded-lg w-48" />
        <div className="h-72 bg-slate-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-lg font-bold">Booking Not Found</h2>
        <Link href="/driver" className="text-xs text-[#078A32] font-bold">
          ← Back to Driver Console
        </Link>
      </div>
    );
  }

  const actor = {
    name: user?.name || 'Driver',
    role: 'driver' as const,
    id: user?.id || '',
  };

  // State Transition Handlers
  const handleDepartGarage = async () => {
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'DRIVER_EN_ROUTE', actor);
    await refresh();
    setActionLoading(false);
  };

  const handleMarkArrived = async () => {
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'DRIVER_ARRIVED', actor);
    await refresh();
    setActionLoading(false);
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'TRIP_STARTED', actor);
    await refresh();
    setActionLoading(false);
  };

  const handleReturnToGarage = async () => {
    setActionLoading(true);
    await returnVehicleToGarage(user?.id || '', booking.vehicleId);
    router.push('/driver');
  };

  const handleOpenCompleteModal = () => {
    setShowPaymentModal(true);
  };

  const handleFinalizeTripAndPayment = async () => {
    setActionLoading(true);
    // 1. Record payment
    await recordBookingPayment(booking.id, {
      amount: booking.fare.totalFare,
      paymentMethod,
      paymentStatus,
      transactionReference: txnRef || undefined,
      collectedBy: user?.name || 'Chauffeur',
    });

    // 2. Mark trip completed
    await updateBookingTripStatus(booking.id, 'TRIP_COMPLETED', actor);

    // 3. Stop location broadcaster
    await stopDriverLiveBroadcaster(booking.id, user?.id || '');
    setIsBroadcasting(false);

    setShowPaymentModal(false);
    await refresh();
    setActionLoading(false);
  };

  const handleSaveAdjustments = async () => {
    setAdjusting(true);
    await adjustTripDetourAndStayCharges(
      booking.id,
      {
        detourKm: extraDetourKm > 0 ? Number(extraDetourKm) : undefined,
        waitMinutes: extraWaitMins > 0 ? Number(extraWaitMins) : undefined,
        driverStayNights: extraStayNights > 0 ? Number(extraStayNights) : undefined,
        notes: adjustNotes || undefined,
      },
      actor
    );
    setExtraDetourKm(0);
    setExtraWaitMins(0);
    setExtraStayNights(0);
    setAdjustNotes('');
    setShowAdjustModal(false);
    await refresh();
    setAdjusting(false);
  };

  const navUrl = getGoogleMapsNavigationUrl(
    booking.status === 'TRIP_STARTED' ? booking.drop : booking.pickup,
    booking.status === 'TRIP_STARTED' ? booking.pickup : undefined,
    booking.status === 'TRIP_STARTED' ? booking.stops : undefined
  );

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/driver"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Console</span>
        </Link>

        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} size="sm" />
          <PaymentStatusBadge status={booking.paymentStatus} size="sm" />
        </div>
      </div>

      {/* Main Console Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Booking Number</div>
            <div className="text-xl font-black text-[#061B33] font-mono">{booking.bookingNumber}</div>
            <div className="text-xs text-slate-500">
              {booking.customerName} • {booking.bookingType.replace('_', ' ')}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Fare to Collect</div>
            <div className="text-2xl font-black text-[#078A32]">
              ₹{booking.fare.totalFare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Live Trip Status Indicator / Broadcasting Ping */}
        {booking.status === 'TRIP_STARTED' && (
          <div className="p-3.5 rounded-2xl bg-emerald-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42B900] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#42B900]" />
              </span>
              <span className="text-xs font-bold text-emerald-300">
                GPS Location Sharing is Active
              </span>
            </div>

            <div className="text-xs font-mono font-extrabold text-[#42B900] bg-black/50 px-3 py-1 rounded-xl">
              ⏱ {formatTimer(elapsedSeconds)}
            </div>
          </div>
        )}

        {/* Live GPS Map for Driver */}
        <LiveDriverMap
          bookingId={booking.id}
          driverLocation={driverLocation}
          pickup={booking.pickup}
          drop={booking.drop}
          driverName={user?.name || booking.driverName}
          driverPhone={booking.customerPhone}
          vehicleModel={booking.vehicleModel}
          vehicleReg={booking.vehicleRegistrationNumber}
          height="h-64 sm:h-80"
        />

        {/* Route Details */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              A
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pickup Point
              </span>
              <span className="font-semibold text-slate-900">{booking.pickup.address}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              B
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Drop Destination
              </span>
              <span className="font-semibold text-slate-900">{booking.drop.address}</span>
            </div>
          </div>
        </div>

        {/* Multi-Stop Itinerary Details for Chauffeur */}
        {booking.stops && booking.stops.length > 0 && (
          <RouteItineraryView
            pickup={booking.pickup}
            drop={booking.drop}
            stops={booking.stops}
            distanceKm={booking.distanceKm}
            totalHaltMinutes={booking.totalHaltMinutes}
            totalDurationMinutes={booking.estimatedDurationMinutes}
            pickupTime={booking.pickupTime}
            bookingDate={booking.bookingDate}
          />
        )}

        {/* Quick Contact & Navigation Bar */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${booking.customerPhone.replace(/\s+/g, '')}`}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-all"
          >
            <Phone className="w-4 h-4 text-[#078A32]" />
            <span>Call Customer</span>
          </a>

          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#061B33] hover:bg-[#0B223D] text-white font-bold text-xs transition-all shadow-md"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>Google Maps Nav</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* STEPPED DRIVER LIFECYCLE ACTION BUTTONS */}
        <div className="pt-2">
          {/* 1. Next Assigned -> Depart Garage */}
          {['CONFIRMED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
            <button
              onClick={handleDepartGarage}
              disabled={actionLoading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Car className="w-5 h-5" />
              <span>DEPART GARAGE (EN ROUTE TO CUSTOMER)</span>
            </button>
          )}

          {/* 2. Driver En Route -> Click ARRIVED */}
          {booking.status === 'DRIVER_EN_ROUTE' && (
            <button
              onClick={handleMarkArrived}
              disabled={actionLoading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <MapPin className="w-5 h-5" />
              <span>ARRIVED AT PICKUP LOCATION</span>
            </button>
          )}

          {/* 3. Driver Arrived -> Click START TRIP */}
          {booking.status === 'DRIVER_ARRIVED' && (
            <button
              onClick={handleStartTrip}
              disabled={actionLoading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base animate-pulse"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>START TRIP (CUSTOMER BOARDED)</span>
            </button>
          )}

          {/* 4. Trip in Progress -> Detour / Wait Logging & Complete Trip */}
          {booking.status === 'TRIP_STARTED' && (
            <div className="space-y-3">
              {(booking.actualDetourKm || booking.actualWaitMinutes || booking.driverStayNights) && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-900">Recorded Adjustments:</span>
                    {booking.actualDetourKm && (
                      <span className="bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        +{booking.actualDetourKm} km detour
                      </span>
                    )}
                    {booking.actualWaitMinutes && (
                      <span className="bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        +{booking.actualWaitMinutes} mins wait
                      </span>
                    )}
                    {booking.driverStayNights && (
                      <span className="bg-indigo-100 text-indigo-950 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        +{booking.driverStayNights} night stay
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold">Fare Updated ✓</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(true)}
                  disabled={actionLoading}
                  className="w-full bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>LOG DETOUR / WAIT / STAY</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCompleteModal}
                  disabled={actionLoading}
                  className="w-full bg-[#F0441D] hover:bg-[#D43612] active:scale-95 text-white font-black py-3.5 px-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>END TRIP & COLLECT (₹{booking.fare.totalFare.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Trip Completed -> Return to Garage */}
          {booking.status === 'TRIP_COMPLETED' && (
            <div className="bg-amber-500/10 border-2 border-amber-400 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs uppercase tracking-wider">
                  <Warehouse className="w-5 h-5 text-amber-600" />
                  <span>Trip Concluded • Returning to Garage</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Fare {booking.paymentStatus} ✓
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Payment of ₹{booking.fare.totalFare.toLocaleString('en-IN')} has been collected. Navigate primary cab back to Travel BZAR Dhanbad Garage Base.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={getGarageNavigationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span>Nav to Garage</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  onClick={handleReturnToGarage}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-black py-3 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Arrived at Garage (Reset)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Fare Card */}
      <FareBreakdown
        fare={booking.fare}
        bookingType={booking.bookingType}
        pricingSnapshot={booking.pricingSnapshot}
      />

      {/* COLLECT PAYMENT & COMPLETE TRIP MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fade-in">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Final Step</span>
              <h3 className="text-xl font-black text-[#061B33]">Collect Passenger Fare</h3>
              <div className="text-3xl font-black text-[#078A32] mt-1">
                ₹{booking.fare.totalFare.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Payment Method:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'CARD'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-xl border text-center font-bold transition-all ${
                      paymentMethod === m
                        ? 'border-[#078A32] bg-emerald-50 text-[#078A32] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Collection Status:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`py-2 rounded-xl border text-center font-bold ${
                    paymentStatus === 'PAID'
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ✓ Collected (Paid)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`py-2 rounded-xl border text-center font-bold ${
                    paymentStatus === 'PENDING'
                      ? 'border-amber-500 bg-amber-100 text-amber-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ⏳ Pending / Credit
                </button>
              </div>
            </div>

            {/* Txn Reference */}
            {paymentMethod === 'UPI' && (
              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">
                  UPI Ref / UTR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 423589123456"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalizeTripAndPayment}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all"
              >
                {actionLoading ? 'Recording...' : 'Finalize & End Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG DETOUR / WAIT TIME / DRIVER STAY MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Customer Mid-Trip Request
              </span>
              <h3 className="text-lg font-black text-[#061B33] mt-1">
                Log Detour, Wait Time or Stay
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Tariff will dynamically recalculate and notify passenger transparently.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Detour KM */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Additional Detour Distance (KM):</span>
                  <span className="text-[10px] text-amber-700 font-semibold">@ ₹14 / KM</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={extraDetourKm || ''}
                    placeholder="e.g. 15"
                    onChange={(e) => setExtraDetourKm(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[5, 10, 20].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setExtraDetourKm((prev) => prev + km)}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px]"
                      >
                        +{km} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Waiting Minutes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Customer Wait Time (Minutes):</span>
                  <span className="text-[10px] text-amber-700 font-semibold">@ ₹3 / Min</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={extraWaitMins || ''}
                    placeholder="e.g. 30"
                    onChange={(e) => setExtraWaitMins(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[15, 30, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setExtraWaitMins((prev) => prev + m)}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px]"
                      >
                        +{m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Driver Stay Nights */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Driver Stay / Overnight Halt (Nights):</span>
                  <span className="text-[10px] text-indigo-700 font-semibold">@ ₹500 / Night</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setExtraStayNights(n)}
                      className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                        extraStayNights === n
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n === 0 ? 'None' : `${n} Night${n > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passenger Reason Note */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Customer Request Note / Reason:
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Passenger detour to Ramgarh Market & overnight stay..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Current Trip Fare:</span>
                  <span className="font-bold text-slate-800">
                    ₹{booking.fare.totalFare.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                  <span>Dynamic Adjustments Addition:</span>
                  <span>
                    +₹
                    {(
                      (extraDetourKm || 0) * 14 +
                      (extraWaitMins || 0) * 3 +
                      (extraStayNights || 0) * 500
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-black text-sm text-[#061B33]">
                  <span>New Total Fare:</span>
                  <span className="text-[#078A32]">
                    ₹
                    {(
                      booking.fare.totalFare +
                      (extraDetourKm || 0) * 14 +
                      (extraWaitMins || 0) * 3 +
                      (extraStayNights || 0) * 500
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAdjustments}
                disabled={adjusting}
                className="flex-1 py-3 rounded-xl bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>{adjusting ? 'Recalculating...' : 'Save & Update Tariff'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
