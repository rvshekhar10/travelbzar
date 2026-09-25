'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useBookings } from '@/hooks/useBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { useDriverContinuousLocation } from '@/hooks/useDriverLocation';
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
  Radio,
  Loader2,
  Check,
  DollarSign,
  ShieldCheck,
  Compass,
  ArrowRight,
  Warehouse,
} from 'lucide-react';
import {
  getGoogleMapsNavigationUrl,
} from '@/services/mapService';
import {
  getGarageNavigationUrl,
  DHANBAD_GARAGE_LOCATION,
} from '@/services/locationService';
import {
  acceptBookingByDriver,
  updateBookingTripStatus,
  recordBookingPayment,
  returnVehicleToGarage,
} from '@/services/bookingService';
import { Booking, PaymentMethod, PaymentStatus } from '@/types';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const { bookings, loading, refresh } = useBookings();
  const { vehicles } = useVehicles();
  const { location: driverBeacon } = useDriverContinuousLocation(user?.id);

  const [onDuty, setOnDuty] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Payment Collection Modal State
  const [paymentTrip, setPaymentTrip] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [txnRef, setTxnRef] = useState('');

  // Returning to Garage flag
  const [isReturningToGarage, setIsReturningToGarage] = useState(false);

  // Primary vehicle assigned
  const primaryVehicle = vehicles[0];

  // Incoming pending requests
  const pendingRequests = bookings.filter((b) => b.status === 'PENDING_CONFIRMATION');

  // Driver trips
  const driverBookings = bookings.filter(
    (b) => !b.driverId || b.driverId === user?.id || b.driverId === 'drv-1'
  );

  // 1. Current Active Trip (En route, arrived, or started)
  const currentTrip = driverBookings.find((b) =>
    ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)
  );

  // 2. Next Upcoming Confirmed Booking
  const nextBooking = driverBookings.find((b) =>
    ['CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status)
  );

  // 3. Recently completed trip
  const justCompletedTrip = driverBookings.find((b) => b.status === 'TRIP_COMPLETED');

  // Actor payload for event log
  const actor = {
    name: user?.name || 'Chauffeur',
    role: 'driver' as const,
    id: user?.id || 'drv-1',
  };

  const handleAcceptRide = async (bookingId: string) => {
    setAcceptingId(bookingId);
    try {
      await acceptBookingByDriver(bookingId, user?.id || 'drv-1');
      await refresh();
    } catch (err) {
      console.error('Failed to accept ride:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  // Step 1: Depart Garage (En Route to Customer)
  const handleDepartGarage = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await updateBookingTripStatus(bookingId, 'DRIVER_EN_ROUTE', actor);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Arrived at Customer Pickup
  const handleMarkArrived = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await updateBookingTripStatus(bookingId, 'DRIVER_ARRIVED', actor);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Start Ride (Customer Boarded)
  const handleStartTrip = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await updateBookingTripStatus(bookingId, 'TRIP_STARTED', actor);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Open Payment Collection Modal
  const handleOpenPaymentModal = (trip: Booking) => {
    setPaymentTrip(trip);
  };

  // Step 5: Finalize Payment Collection & End Trip
  const handleFinalizePaymentAndEndRide = async () => {
    if (!paymentTrip) return;
    setActionLoading(true);
    try {
      // 1. Record payment
      await recordBookingPayment(paymentTrip.id, {
        amount: paymentTrip.fare.totalFare,
        paymentMethod,
        paymentStatus,
        transactionReference: txnRef || undefined,
        collectedBy: user?.name || 'Chauffeur',
      });

      // 2. Mark trip completed
      await updateBookingTripStatus(paymentTrip.id, 'TRIP_COMPLETED', actor);

      setPaymentTrip(null);
      setIsReturningToGarage(true);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  // Step 6: Return to Garage
  const handleConfirmArrivedAtGarage = async () => {
    setActionLoading(true);
    try {
      await returnVehicleToGarage(user?.id || 'drv-1', primaryVehicle?.id);
      setIsReturningToGarage(false);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="py-5 sm:py-7 px-4 sm:px-6 max-w-4xl mx-auto space-y-5">
      {/* 1. CHAUFFEUR STATUS & VEHICLE HEADER */}
      <div className="bg-[#061B33] text-white p-5 rounded-3xl shadow-xl border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#42B900] flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#42B900]">
                Chauffeur Console
              </div>
              <h1 className="text-xl sm:text-2xl font-black">{user?.name || 'Rajesh Chauffeur'}</h1>
              <div className="text-xs text-slate-300 mt-0.5">
                Primary Cab:{' '}
                <strong className="text-white">
                  {primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model}` : 'Hyundai Venue'}
                </strong>{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  ({primaryVehicle?.registrationNumber || 'JH-10-BX-4421'})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setOnDuty(!onDuty)}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
              onDuty
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${onDuty ? 'bg-slate-950 animate-ping' : 'bg-slate-400'}`}
            />
            <span>{onDuty ? 'On Duty' : 'Break'}</span>
          </button>
        </div>

        {/* Real-time GPS Location Beacon Info (Continuous Sharing with Owner) */}
        <div className="bg-[#041224] p-3 rounded-2xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42B900] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#42B900]" />
            </span>
            <span className="font-bold text-slate-200">
              Live GPS Beacon: <span className="text-[#42B900]">Sharing Location with Owner & Dispatch HQ</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
            <span>
              Lat: {driverBeacon?.latitude ? driverBeacon.latitude.toFixed(4) : DHANBAD_GARAGE_LOCATION.latitude.toFixed(4)}
            </span>
            <span>
              Lng: {driverBeacon?.longitude ? driverBeacon.longitude.toFixed(4) : DHANBAD_GARAGE_LOCATION.longitude.toFixed(4)}
            </span>
            <span className="text-emerald-400 font-bold">Speed: {driverBeacon?.speed || 0} km/h</span>
          </div>
        </div>
      </div>

      {/* 2. RETURN TO GARAGE BANNER (If ride ended and Chauffeur is returning to garage) */}
      {isReturningToGarage && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-3xl p-5 shadow-lg border-2 border-amber-300 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-5 h-5 font-black" />
              <span className="text-xs font-black uppercase tracking-wider">
                Trip Concluded • Returning to Garage
              </span>
            </div>
            <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full">
              Dhanbad Base
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            Payment has been confirmed. Navigate the primary cab back to Travel BZAR Garage in Bank More, Dhanbad.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={getGarageNavigationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Navigate to Garage</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              onClick={handleConfirmArrivedAtGarage}
              disabled={actionLoading}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#078A32]" />
              <span>Arrived at Garage (Reset)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CURRENT ACTIVE TRIP (HIGHEST PRIORITY: EN ROUTE, ARRIVED, OR TRIP STARTED) */}
      {currentTrip && (
        <div className="bg-gradient-to-br from-emerald-950 to-[#061B33] text-white rounded-3xl p-6 border-2 border-[#42B900] shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#42B900] animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-[#42B900]">
                Active Trip in Progress
              </span>
            </div>
            <BookingStatusBadge status={currentTrip.status} size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger</span>
                <div className="text-lg font-black text-white">{currentTrip.customerName}</div>
                <div className="text-xs text-slate-300">{currentTrip.customerPhone}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fare to Collect</span>
                <div className="text-2xl font-black text-[#42B900]">
                  ₹{currentTrip.fare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Pickup & Drop Points */}
            <div className="bg-black/50 p-4 rounded-2xl border border-emerald-900/40 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  A
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Location</span>
                  <span className="font-semibold text-slate-100">{currentTrip.pickup.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  B
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop Destination</span>
                  <span className="font-semibold text-slate-100">{currentTrip.drop.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Google Maps Navigation */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={`tel:${currentTrip.customerPhone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-2 bg-[#0B223D] hover:bg-[#122F54] text-white text-xs font-bold py-3.5 rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                <Phone className="w-4 h-4 text-[#42B900]" />
                <span>Call Customer</span>
              </a>

              <a
                href={getGoogleMapsNavigationUrl(
                  currentTrip.status === 'TRIP_STARTED' ? currentTrip.drop : currentTrip.pickup
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0B223D] hover:bg-[#122F54] text-white text-xs font-bold py-3.5 rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 text-sky-400" />
                <span>
                  {currentTrip.status === 'TRIP_STARTED' ? 'Navigate to Drop' : 'Navigate to Pickup'}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Stepped Status Action Buttons */}
            <div className="pt-2">
              {currentTrip.status === 'DRIVER_EN_ROUTE' && (
                <button
                  onClick={() => handleMarkArrived(currentTrip.id)}
                  disabled={actionLoading}
                  className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <MapPin className="w-5 h-5" />
                  <span>ARRIVED AT CUSTOMER PICKUP</span>
                </button>
              )}

              {currentTrip.status === 'DRIVER_ARRIVED' && (
                <button
                  onClick={() => handleStartTrip(currentTrip.id)}
                  disabled={actionLoading}
                  className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base animate-pulse"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>START TRIP (CUSTOMER BOARDED)</span>
                </button>
              )}

              {currentTrip.status === 'TRIP_STARTED' && (
                <button
                  onClick={() => handleOpenPaymentModal(currentTrip)}
                  disabled={actionLoading}
                  className="w-full bg-[#F0441D] hover:bg-[#D43612] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>END TRIP & COLLECT FARE (₹{currentTrip.fare.totalFare.toLocaleString('en-IN')})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. NEXT UPCOMING BOOKING (CONFIRMED / DRIVER ASSIGNED - READY FOR DEPARTURE) */}
      {nextBooking && !currentTrip && (
        <div className="bg-white rounded-3xl p-6 border-2 border-sky-400/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs uppercase font-black tracking-wider text-sky-800">
              Next Upcoming Assignment
            </span>
            <BookingStatusBadge status={nextBooking.status} size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <div className="text-lg font-black text-slate-900">{nextBooking.customerName}</div>
                <div className="text-xs text-slate-500">{nextBooking.customerPhone}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Agreed Fare</span>
                <div className="text-2xl font-black text-[#078A32]">
                  ₹{nextBooking.fare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  A
                </span>
                <span className="text-slate-800 font-semibold">{nextBooking.pickup.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
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

            {/* Quick Contact & Navigation to Pickup */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={`tel:${nextBooking.customerPhone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3.5 rounded-xl transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Call Customer</span>
              </a>

              <a
                href={getGoogleMapsNavigationUrl(nextBooking.pickup)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3.5 rounded-xl transition-all"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Nav to Pickup</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Depart Garage CTA */}
            <button
              onClick={() => handleDepartGarage(nextBooking.id)}
              disabled={actionLoading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base mt-2"
            >
              <Car className="w-5 h-5" />
              <span>DEPART GARAGE (EN ROUTE TO CUSTOMER)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. INCOMING RIDE REQUESTS (AWAITING DRIVER OR OWNER DISPATCH) */}
      {pendingRequests.length > 0 && !currentTrip && !nextBooking && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                New Ride Requests ({pendingRequests.length})
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Available to Accept
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {req.bookingNumber}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {req.bookingType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      • {req.bookingDate} at {req.pickupTime} IST
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <div className="truncate">
                      <strong className="text-emerald-700">Pickup:</strong> {req.pickup.address}
                    </div>
                    <div className="truncate">
                      <strong className="text-rose-700">Drop:</strong> {req.drop.address}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1 flex items-center gap-3">
                    <span>
                      Passenger: <strong>{req.customerName}</strong> ({req.customerPhone})
                    </span>
                    <span>• Est. {req.distanceKm} km</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">Estimated Fare</span>
                    <span className="text-lg font-black text-[#078A32]">
                      ₹{req.fare.totalFare.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAcceptRide(req.id)}
                    disabled={acceptingId === req.id}
                    className="flex items-center gap-1.5 bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all"
                  >
                    {acceptingId === req.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Assign Cab</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. STANDBY OVERVIEW IF NO ACTIVE OR NEXT TRIP */}
      {!currentTrip && !nextBooking && !isReturningToGarage && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#078A32]" />
          </div>
          <h3 className="text-base font-black text-slate-900">Standby at Dhanbad Garage Base</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your single primary cab is parked and available. When a rider booking is assigned or requested, details and 1-tap navigation will appear here.
          </p>
        </div>
      )}

      {/* 7. ALL ASSIGNED TRIPS LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Trip History & Assigned Runs ({driverBookings.length})
          </h2>
          <Link href="/driver/bookings" className="text-xs font-bold text-[#078A32] hover:underline">
            View All →
          </Link>
        </div>

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
      </div>

      {/* COLLECT PAYMENT MODAL */}
      {paymentTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fade-in">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ride Concluded</span>
              <h3 className="text-xl font-black text-[#061B33]">Collect Fare from Passenger</h3>
              <div className="text-3xl font-black text-[#078A32] mt-1">
                ₹{paymentTrip.fare.totalFare.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Passenger: <strong>{paymentTrip.customerName}</strong> ({paymentTrip.customerPhone})
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Payment Mode Received:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-3 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === 'CASH'
                      ? 'border-[#078A32] bg-emerald-50 text-[#078A32] ring-2 ring-[#078A32]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Cash Handed Over</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-3 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === 'UPI'
                      ? 'border-[#078A32] bg-emerald-50 text-[#078A32] ring-2 ring-[#078A32]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Radio className="w-5 h-5 text-emerald-600" />
                  <span>UPI / QR / Bank</span>
                </button>
              </div>
            </div>

            {/* UPI QR & Ref info */}
            {paymentMethod === 'UPI' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Travel BZAR UPI Handle:</span>
                  <strong className="font-mono text-slate-900">travelbzar@icici</strong>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    UPI Transaction ID / UTR (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423589123456"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentTrip(null)}
                className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalizePaymentAndEndRide}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Payment & Return to Garage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
