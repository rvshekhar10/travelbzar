'use client';

import React, { use, useState, useEffect, useRef } from 'react';
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
  verifyAndStartTrip,
  updateBookingTelemetry,
  completeTripWithTelemetry,
} from '@/services/bookingService';
import {
  startDriverLiveBroadcaster,
  stopDriverLiveBroadcaster,
  getGarageNavigationUrl,
  calculateDistanceMeters,
} from '@/services/locationService';
import { getGoogleMapsNavigationUrl } from '@/services/mapService';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import { LiveDriverMap } from '@/components/maps/LiveDriverMap';
import { RouteItineraryView } from '@/components/booking/RouteItineraryView';
import { PaymentMethod, PaymentStatus, TripTelemetryPoint } from '@/types';
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
  KeyRound,
  ShieldCheck,
  Activity,
  Flame,
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
  const [actionLoading, setActionLoading] = useState(false);

  // Traffic Light OTP Modal State (Amber modal to start ride)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Live GPS Telemetry state
  const [telemetry, setTelemetry] = useState({
    actualDistanceKm: 0,
    movingSeconds: 0,
    idleSeconds: 0,
    parkedSeconds: 0,
    topSpeedKmh: 0,
    currentSpeedKmh: 0,
  });

  const lastCoordsRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detour & Stay Adjustment Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [extraDetourKm, setExtraDetourKm] = useState<number>(0);
  const [extraWaitMins, setExtraWaitMins] = useState<number>(0);
  const [extraStayNights, setExtraStayNights] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Final End Trip Payment Modal (Red button opens this)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [txnRef, setTxnRef] = useState('');

  // 1. Live trip elapsed second timer
  useEffect(() => {
    if (booking?.status === 'TRIP_STARTED') {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking?.status]);

  // 2. Continuous Background GPS Distance & Idle Telemetry Tracker
  useEffect(() => {
    if (booking?.status === 'TRIP_STARTED') {
      const stopFn = startDriverLiveBroadcaster(
        booking.id,
        user?.id || '',
        booking.pickup,
        booking.drop
      );

      // Heartbeat telemetry sync to Firestore every 10 seconds
      telemetryIntervalRef.current = setInterval(() => {
        setTelemetry((prev) => {
          const movingMin = Math.round(prev.movingSeconds / 60);
          const idleMin = Math.round(prev.idleSeconds / 60);
          const parkedMin = Math.round(prev.parkedSeconds / 60);
          const totalMin = movingMin + idleMin + parkedMin;

          updateBookingTelemetry(booking.id, {
            actualDistanceKm: Math.round(prev.actualDistanceKm * 10) / 10,
            movingMinutes: movingMin,
            idleMinutes: idleMin,
            parkedMinutes: parkedMin,
            totalTripMinutes: totalMin,
            topSpeedKmh: prev.topSpeedKmh,
            averageSpeedKmh:
              movingMin > 0 ? Math.round((prev.actualDistanceKm / (movingMin / 60)) * 10) / 10 : 0,
          });

          return prev;
        });
      }, 10000);

      return () => {
        stopFn();
        if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
      };
    }
  }, [booking?.status, booking?.id, user?.id]);

  // 3. Track incremental distance & movement state from driverLocation updates
  useEffect(() => {
    if (booking?.status === 'TRIP_STARTED' && driverLocation) {
      const now = Date.now();
      const currentLat = driverLocation.latitude;
      const currentLng = driverLocation.longitude;
      const speed = driverLocation.speed || 0;

      if (lastCoordsRef.current) {
        const distMeters = calculateDistanceMeters(
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lng,
          currentLat,
          currentLng
        );

        // Discard GPS jitter noise (< 6m)
        if (distMeters >= 6) {
          const addedKm = distMeters / 1000;
          setTelemetry((prev) => ({
            ...prev,
            actualDistanceKm: prev.actualDistanceKm + addedKm,
            currentSpeedKmh: speed,
            topSpeedKmh: Math.max(prev.topSpeedKmh, speed),
            movingSeconds: speed > 2 ? prev.movingSeconds + 4 : prev.movingSeconds,
            idleSeconds: speed > 0 && speed <= 2 ? prev.idleSeconds + 4 : prev.idleSeconds,
            parkedSeconds: speed === 0 ? prev.parkedSeconds + 4 : prev.parkedSeconds,
          }));
        } else {
          // Stationary
          setTelemetry((prev) => ({
            ...prev,
            currentSpeedKmh: 0,
            parkedSeconds: prev.parkedSeconds + 4,
          }));
        }
      }

      lastCoordsRef.current = { lat: currentLat, lng: currentLng, time: now };
    }
  }, [driverLocation, booking?.status]);

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

  // ── Traffic Light State Actions ──
  // 1. Depart Garage (Yellow / Amber Light)
  const handleDepartGarage = async () => {
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'DRIVER_EN_ROUTE', actor);
    await refresh();
    setActionLoading(false);
  };

  // 2. Mark Arrived (Blue / Amber Light)
  const handleMarkArrived = async () => {
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'DRIVER_ARRIVED', actor);
    await refresh();
    setActionLoading(false);
  };

  // 3. Start Trip via Customer OTP (Green Light)
  const handleVerifyOtpAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!enteredOtp.trim()) {
      setOtpError('Please ask customer for their 4-digit Ride Start OTP.');
      return;
    }

    setActionLoading(true);
    const res = await verifyAndStartTrip(booking.id, enteredOtp, actor);
    setActionLoading(false);

    if (res.success) {
      setShowOtpModal(false);
      setEnteredOtp('');
      await refresh();
    } else {
      setOtpError(res.error || 'Invalid OTP. Please check with customer.');
    }
  };

  // 4. End Trip & Final Payment (Red Light)
  const handleFinalizeTripAndPayment = async () => {
    setActionLoading(true);
    try {
      const movingMin = Math.round(telemetry.movingSeconds / 60);
      const idleMin = Math.round(telemetry.idleSeconds / 60);
      const parkedMin = Math.round(telemetry.parkedSeconds / 60);

      const finalTelemetry = {
        actualDistanceKm: Math.max(
          Math.round(telemetry.actualDistanceKm * 10) / 10,
          booking.distanceKm
        ),
        movingMinutes: movingMin,
        idleMinutes: idleMin,
        parkedMinutes: parkedMin,
        totalTripMinutes: movingMin + idleMin + parkedMin,
        averageSpeedKmh:
          movingMin > 0 ? Math.round((telemetry.actualDistanceKm / (movingMin / 60)) * 10) / 10 : 0,
        topSpeedKmh: telemetry.topSpeedKmh,
      };

      const result = await completeTripWithTelemetry(booking.id, finalTelemetry, actor);

      // Record final collected payment
      await recordBookingPayment(booking.id, {
        amount: result.finalFare,
        paymentMethod,
        paymentStatus,
        transactionReference: txnRef || undefined,
        collectedBy: user?.name || 'Driver',
      });

      await stopDriverLiveBroadcaster(booking.id, user?.id || '');
      setShowPaymentModal(false);
      await refresh();
    } catch (err) {
      console.error('Finalize trip failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToGarage = async () => {
    setActionLoading(true);
    await returnVehicleToGarage(user?.id || '', booking.vehicleId);
    router.push('/driver');
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const navUrl = getGoogleMapsNavigationUrl(
    booking.status === 'TRIP_STARTED' ? booking.drop : booking.pickup,
    booking.status === 'TRIP_STARTED' ? booking.pickup : undefined,
    booking.status === 'TRIP_STARTED' ? booking.stops : undefined
  );

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6 max-w-3xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Link
          href="/driver"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Driver Trips</span>
        </Link>

        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} size="sm" />
          <PaymentStatusBadge status={booking.paymentStatus} size="sm" />
        </div>
      </div>

      {/* Main Chauffeur Console Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-md space-y-4">
        {/* Top Ride Title & Fare Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Trip #{booking.bookingNumber}
            </div>
            <h2 className="text-lg font-black text-slate-900">{booking.customerName}</h2>
            <div className="text-xs font-semibold text-slate-500">
              {booking.bookingType.replace('_', ' ')} • {booking.bookingDate} {booking.pickupTime}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-black">Trip Fare</div>
            <div className="text-2xl font-black text-[#078A32]">
              ₹{booking.fare.totalFare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
        {/* LIVE GPS TELEMETRY DASHBOARD (Tracking Real-Time Distance, Moving vs Idle vs Parked)  */}
        {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
        {booking.status === 'TRIP_STARTED' && (
          <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-3 border-2 border-emerald-500/50 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42B900] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#42B900]" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live Trip Telemetry Active
                </span>
              </div>
              <div className="text-xs font-mono font-black text-emerald-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                ⏱ {formatTimer(elapsedSeconds)}
              </div>
            </div>

            {/* Metric Counters (Every KM & Time on Road) */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Distance</div>
                <div className="text-base font-black text-[#42B900] font-mono mt-0.5">
                  {telemetry.actualDistanceKm.toFixed(1)} km
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">On Road</div>
                <div className="text-base font-black text-sky-400 font-mono mt-0.5">
                  {Math.round(telemetry.movingSeconds / 60)}m
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Idle / Wait</div>
                <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                  {Math.round(telemetry.idleSeconds / 60)}m
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Parked</div>
                <div className="text-base font-black text-rose-400 font-mono mt-0.5">
                  {Math.round(telemetry.parkedSeconds / 60)}m
                </div>
              </div>
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
          height="h-56 sm:h-64"
        />

        {/* Route Points */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">
              A
            </span>
            <span className="font-semibold text-slate-900 line-clamp-1">{booking.pickup.address}</span>
          </div>

          <div className="flex items-start gap-2 pt-1.5 border-t border-slate-200">
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">
              B
            </span>
            <span className="font-semibold text-slate-900 line-clamp-1">{booking.drop.address}</span>
          </div>
        </div>

        {/* Quick Contact & Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${booking.customerPhone.replace(/\s+/g, '')}`}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-900 font-black text-xs transition-all active:scale-95 shadow-xs"
          >
            <Phone className="w-4 h-4 text-[#078A32]" />
            <span>Call Customer</span>
          </a>

          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#061B33] hover:bg-[#0B223D] text-white font-black text-xs transition-all active:scale-95 shadow-md"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>Google Nav</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
        {/* TRAFFIC LIGHT BOLD LIFECYCLE ACTION BUTTONS (Yellow -> Blue -> Green -> Red)           */}
        {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
        <div className="pt-2">
          {/* 1. Yellow/Amber Light: Depart Garage */}
          {['CONFIRMED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
            <button
              type="button"
              onClick={handleDepartGarage}
              disabled={actionLoading}
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-slate-950 font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-base border-4 border-amber-300 cursor-pointer"
            >
              <Car className="w-6 h-6 text-slate-950" />
              <span>🟡 1. DEPART GARAGE → EN ROUTE</span>
            </button>
          )}

          {/* 2. Blue Light: Arrived at Pickup */}
          {booking.status === 'DRIVER_EN_ROUTE' && (
            <button
              type="button"
              onClick={handleMarkArrived}
              disabled={actionLoading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-base border-4 border-blue-400 cursor-pointer"
            >
              <MapPin className="w-6 h-6 text-white" />
              <span>🔵 2. ARRIVED AT PICKUP LOCATION</span>
            </button>
          )}

          {/* 3. Green Light: Enter Customer OTP & Start Trip */}
          {booking.status === 'DRIVER_ARRIVED' && (
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(true);
                setOtpError(null);
              }}
              disabled={actionLoading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 text-base border-4 border-emerald-300 cursor-pointer animate-pulse"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>🟢 3. ENTER RIDE OTP & START TRIP</span>
            </button>
          )}

          {/* 4. Red Light: End Trip & Final Payment */}
          {booking.status === 'TRIP_STARTED' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={actionLoading}
                className="w-full bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 text-base border-4 border-rose-300 cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
                <span>🔴 4. END TRIP & COLLECT FARE</span>
              </button>
            </div>
          )}

          {/* 5. Trip Completed -> Reset to Garage */}
          {booking.status === 'TRIP_COMPLETED' && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 space-y-3 text-center">
              <div className="text-emerald-950 font-black text-sm uppercase">
                ✓ Trip Successfully Completed!
              </div>
              <p className="text-xs text-slate-600">
                Final Collected Fare: <strong>₹{booking.fare.totalFare.toLocaleString('en-IN')}</strong> ({booking.paymentStatus}).
              </p>
              <button
                type="button"
                onClick={handleReturnToGarage}
                disabled={actionLoading}
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <Warehouse className="w-4 h-4 text-emerald-400" />
                <span>Back to Fleet Garage (Reset Duty)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ENTER RIDE START OTP (Customer gives 4-digit code to driver)                   */}
      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border-4 border-emerald-400">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Enter Ride Start OTP</h3>
              <p className="text-xs text-slate-500">
                Ask <strong>{booking.customerName}</strong> for their 4-digit security code.
              </p>
            </div>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndStart} className="space-y-4">
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                required
                autoFocus
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4-digit OTP"
                className="w-full text-center text-3xl font-black font-mono tracking-widest py-3 rounded-2xl border-2 border-slate-300 focus:outline-hidden focus:border-[#078A32] focus:ring-4 focus:ring-emerald-100 bg-slate-50"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-1/3 py-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || enteredOtp.length !== 4}
                  className="flex-1 py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] disabled:opacity-50 text-white font-black text-sm shadow-md"
                >
                  {actionLoading ? 'Verifying...' : 'Start Trip Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: END TRIP & FARE COLLECTION (Final Calculated Fare with Live GPS KM & Time)    */}
      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-4 border-rose-400">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                End Ride & Collect Fare
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Final Passenger Amount</h3>
              <div className="text-3xl font-black text-[#078A32] mt-1">
                ₹{booking.fare.totalFare.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Measured: {telemetry.actualDistanceKm.toFixed(1)} km traveled • {Math.round(elapsedSeconds / 60)} mins trip time
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Payment Method:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'CARD'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-3 rounded-xl border-2 text-center font-black transition-all ${
                      paymentMethod === m
                        ? 'border-[#078A32] bg-emerald-50 text-[#078A32] shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Collection Status:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`py-2.5 rounded-xl border-2 text-center font-black text-xs ${
                    paymentStatus === 'PAID'
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ✓ Collected (Paid)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`py-2.5 rounded-xl border-2 text-center font-black text-xs ${
                    paymentStatus === 'PENDING'
                      ? 'border-amber-500 bg-amber-100 text-amber-950'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ⏳ Pending / Credit
                </button>
              </div>
            </div>

            {/* UPI Reference if applicable */}
            {paymentMethod === 'UPI' && (
              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">UPI Ref / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 423589123456"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-xs focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-1/3 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalizeTripAndPayment}
                disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white font-black text-sm shadow-xl transition-all"
              >
                {actionLoading ? 'Saving...' : 'Confirm End Trip & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
