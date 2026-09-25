'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/hooks/useBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import {
  confirmBookingByOwner,
  updateBookingTripStatus,
  addChargesToBooking,
  checkBookingConflict,
} from '@/services/bookingService';
import { getBookingEvents } from '@/lib/firebase/store';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import { MapView } from '@/components/maps/MapView';
import { LiveDriverMap } from '@/components/maps/LiveDriverMap';
import { BookingEvent } from '@/types';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  Printer,
  History,
  Sparkles,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OwnerBookingDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, loading, refresh } = useBooking(id);
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { location: driverLocation } = useDriverLocation(booking?.id);

  const [events, setEvents] = useState<BookingEvent[]>([]);

  // Action states
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [confirmedFare, setConfirmedFare] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Additional charges modal state
  const [showChargesModal, setShowChargesModal] = useState(false);
  const [parking, setParking] = useState<number>(0);
  const [toll, setToll] = useState<number>(0);
  const [stateTax, setStateTax] = useState<number>(0);
  const [cleaning, setCleaning] = useState<number>(0);

  // Conflict warning state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setSelectedDriverId(booking.driverId || '');
      setSelectedVehicleId(booking.vehicleId || '');
      setConfirmedFare(booking.fare.baseFare || 0);
      setParking(booking.fare.parkingCharge || 0);
      setToll(booking.fare.tollCharge || 0);
      setStateTax(booking.fare.stateTaxCharge || 0);
      setCleaning(booking.fare.cleaningCharge || 0);

      getBookingEvents(booking.id).then((evts) => setEvents(evts));
    }
  }, [booking]);

  // Live conflict detection on selection change
  useEffect(() => {
    if (booking && (selectedVehicleId || selectedDriverId)) {
      checkBookingConflict(
        selectedVehicleId || undefined,
        selectedDriverId || undefined,
        booking.bookingDate,
        booking.pickupTime,
        booking.estimatedDurationMinutes,
        booking.id
      ).then((res) => {
        if (res.hasConflict) {
          setConflictWarning(res.reason || 'Overlapping booking window detected with 30-min buffer.');
        } else {
          setConflictWarning(null);
        }
      });
    }
  }, [selectedVehicleId, selectedDriverId, booking]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <Link href="/owner/bookings" className="text-xs text-[#078A32] font-bold">
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  const handleConfirmAndAssign = async () => {
    setActionLoading(true);
    setErrorMessage(null);

    const res = await confirmBookingByOwner(
      booking.id,
      confirmedFare,
      selectedDriverId || undefined,
      selectedVehicleId || undefined
    );

    setActionLoading(false);

    if (res.success) {
      await refresh();
      const evts = await getBookingEvents(booking.id);
      setEvents(evts);
    } else {
      setErrorMessage(res.error || 'Failed to confirm booking.');
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(true);
    await updateBookingTripStatus(booking.id, 'CANCELLED', {
      name: 'Owner',
      role: 'owner',
      id: 'user-owner-1',
    });
    await refresh();
    setActionLoading(false);
  };

  const handleSaveAdditionalCharges = async () => {
    setActionLoading(true);
    await addChargesToBooking(
      booking.id,
      {
        parkingCharge: parking,
        tollCharge: toll,
        stateTaxCharge: stateTax,
        cleaningCharge: cleaning,
      },
      'Owner'
    );
    setShowChargesModal(false);
    await refresh();
    setActionLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/owner/bookings"
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

      {/* Main Details Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-extrabold text-[#078A32]">
            {booking.bookingType.replace('_', ' ')}
          </div>
          <h1 className="text-2xl font-black text-[#061B33] font-mono mt-0.5">
            {booking.bookingNumber}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <User className="w-3.5 h-3.5" />
              {booking.customerName} ({booking.customerPhone})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {booking.bookingDate} at {booking.pickupTime} IST
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChargesModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#078A32]" />
            <span>Add Charges</span>
          </button>

          <Link
            href={`/owner/receipt/${booking.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </Link>
        </div>
      </div>

      {/* Conflict Warning Alert */}
      {conflictWarning && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Vehicle / Driver Availability Conflict Alert</span>
            <p className="mt-0.5 leading-relaxed">{conflictWarning}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-300 p-4 rounded-2xl text-red-800 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Management Controls & Assignment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatch Assignment Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold uppercase text-[#061B33] tracking-wider pb-2 border-b border-slate-100">
              Chauffeur & Fleet Assignment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Vehicle Select (Max 2 rule) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assign Vehicle (Max 1 Fleet)
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                >
                  <option value="">Select Vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registrationNumber}) — {v.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Select */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Chauffeur</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                >
                  <option value="">Select Driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone}) — {d.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirmed Base Fare within Range */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirmed Base Fare (INR ₹)
                </label>
                <input
                  type="number"
                  value={confirmedFare}
                  onChange={(e) => setConfirmedFare(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                />
                {booking.fare.estimatedMinFare && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Configured Range: ₹{booking.fare.estimatedMinFare} – ₹{booking.fare.estimatedMaxFare}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="text-xs font-bold text-rose-600 hover:text-rose-800"
              >
                Cancel Booking
              </button>

              <button
                type="button"
                onClick={handleConfirmAndAssign}
                disabled={actionLoading}
                className="bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all"
              >
                {actionLoading ? 'Updating...' : 'Save & Confirm Assignment'}
              </button>
            </div>
          </div>

          {/* Route Map Preview / Live Chauffeur GPS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase text-[#061B33]">
                {['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(booking.status)
                  ? 'Live Chauffeur GPS Tracking'
                  : 'Route Schematic'}
              </h2>
              {['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(booking.status) && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live GPS Tracking
                </span>
              )}
            </div>

            {['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(booking.status) ? (
              <LiveDriverMap
                bookingId={booking.id}
                driverLocation={driverLocation}
                pickup={booking.pickup}
                drop={booking.drop}
                driverName={booking.driverName}
                driverPhone={booking.customerPhone}
                vehicleModel={booking.vehicleModel}
                vehicleReg={booking.vehicleRegistrationNumber}
                height="h-64 sm:h-80"
              />
            ) : (
              <MapView
                pickup={booking.pickup}
                drop={booking.drop}
                distanceKm={booking.distanceKm}
                durationMinutes={booking.estimatedDurationMinutes}
                height="h-64 sm:h-72"
              />
            )}
          </div>

          {/* Audit Event Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-[#078A32]" />
              <h2 className="text-sm font-extrabold uppercase text-[#061B33]">Booking Audit Trail</h2>
            </div>

            <div className="space-y-3 text-xs">
              {events.length === 0 ? (
                <div className="text-slate-400 italic">No events logged yet.</div>
              ) : (
                events.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#078A32] mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">{evt.action}</span>
                      <span className="text-slate-400 text-[10px] ml-2">
                        by {evt.performedBy} ({evt.role}) • {new Date(evt.createdAt).toLocaleTimeString('en-IN')} IST
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Fare Breakdown */}
        <div className="space-y-6">
          <FareBreakdown fare={booking.fare} bookingType={booking.bookingType} />
        </div>
      </div>

      {/* ADDITIONAL CHARGES MODAL */}
      {showChargesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in text-xs">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#061B33]">
                Add Operational & Extra Charges
              </h3>
              <p className="text-[11px] text-slate-500">
                Toll, Parking, State Tax, or Cleaning as per actual journey receipts.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Parking Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={parking}
                  onChange={(e) => setParking(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Toll Plaza Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={toll}
                  onChange={(e) => setToll(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">State Tax / Interstate (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={stateTax}
                  onChange={(e) => setStateTax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cleaning Charge if Car Gets Dirty (₹500 – ₹1,500)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1500}
                  value={cleaning}
                  onChange={(e) => setCleaning(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowChargesModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAdditionalCharges}
                disabled={actionLoading}
                className="bg-[#078A32] hover:bg-[#056B27] text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md"
              >
                Save Charges
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
