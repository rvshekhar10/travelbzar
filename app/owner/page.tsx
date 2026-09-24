'use client';

import React from 'react';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { computeAnalytics } from '@/services/analyticsService';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Navigation,
} from 'lucide-react';

export default function OwnerDashboardPage() {
  const { bookings, loading: bookingsLoading } = useBookings();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();

  const analytics = computeAnalytics(bookings);

  // Pending bookings requiring immediate owner action
  const pendingConfirmation = bookings.filter((b) => b.status === 'PENDING_CONFIRMATION');

  // Active trips
  const activeTripsList = bookings.filter((b) =>
    ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)
  );

  const availableVehiclesCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const activeDriversCount = drivers.filter((d) => d.status === 'ACTIVE').length;

  // Business readiness logic (1 Vehicle + 1 Assigned Driver)
  const hasVehicle = vehicles.length > 0;
  const primaryVehicle = vehicles[0];
  const assignedDriver = primaryVehicle
    ? drivers.find((d) => d.assignedVehicleId === primaryVehicle.id)
    : null;
  const isBusinessReady = hasVehicle && Boolean(assignedDriver);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome & Operations Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Operations Management Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Travel BZAR Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dhanbad Fleet & Chauffeur Dispatch • Live Operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/owner/bookings"
            className="bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Manage Bookings
          </Link>
          <Link
            href="/owner/pricing"
            className="bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Edit Tariffs
          </Link>
        </div>
      </div>

      {/* BUSINESS READINESS & FLEET ONBOARDING STATUS CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isBusinessReady ? 'bg-[#078A32] animate-pulse' : 'bg-amber-500'
              }`}
            />
            <h2 className="text-sm font-black uppercase text-[#061B33] tracking-wide">
              Business Readiness: {isBusinessReady ? 'Live & Operational' : 'Setup Required'}
            </h2>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${
              isBusinessReady
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isBusinessReady
              ? '✓ 1 Cab & Chauffeur Active'
              : !hasVehicle
              ? 'Step 1 of 2: Add Vehicle'
              : 'Step 2 of 2: Assign Chauffeur'}
          </span>
        </div>

        {/* 3-Step Visual Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Vehicle Listing (Max 1) */}
          <div
            className={`p-3.5 rounded-2xl border ${
              hasVehicle
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            } space-y-1.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Step 1 • Fleet (1 Cab Limit)
              </span>
              {hasVehicle ? (
                <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 animate-bounce" />
              )}
            </div>
            <div className="text-xs font-bold">
              {hasVehicle
                ? `${primaryVehicle.make} ${primaryVehicle.model}`
                : 'No Vehicle Listed (0/1)'}
            </div>
            <div className="text-[11px] text-slate-600">
              {hasVehicle ? (
                <span className="font-mono font-bold text-slate-800">
                  {primaryVehicle.registrationNumber}
                </span>
              ) : (
                <Link
                  href="/owner/vehicles"
                  className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Add Primary Cab →</span>
                </Link>
              )}
            </div>
          </div>

          {/* Step 2: Chauffeur Provisioning & Assignment */}
          <div
            className={`p-3.5 rounded-2xl border ${
              assignedDriver
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : !hasVehicle
                ? 'bg-slate-50 border-slate-200 text-slate-400'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            } space-y-1.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Step 2 • Chauffeur & Auth
              </span>
              {assignedDriver ? (
                <CheckCircle2 className="w-4 h-4 text-[#078A32]" />
              ) : (
                <Users className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="text-xs font-bold">
              {assignedDriver
                ? assignedDriver.name
                : hasVehicle
                ? 'Chauffeur Not Assigned'
                : 'Awaiting Vehicle'}
            </div>
            <div className="text-[11px] text-slate-600">
              {assignedDriver ? (
                <span className="text-emerald-700 font-semibold">
                  {assignedDriver.phone} • Login Provisioned
                </span>
              ) : hasVehicle ? (
                <Link
                  href="/owner/drivers"
                  className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Assign Chauffeur →</span>
                </Link>
              ) : (
                <span>Register vehicle first</span>
              )}
            </div>
          </div>

          {/* Step 3: Business Dispatch Operational */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isBusinessReady
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            } space-y-1.5`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isBusinessReady ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                Step 3 • Dispatch Status
              </span>
              <ShieldCheck
                className={`w-4 h-4 ${isBusinessReady ? 'text-white' : 'text-slate-400'}`}
              />
            </div>
            <div className="text-xs font-black">
              {isBusinessReady ? 'Ready for Bookings' : 'Setup Incomplete'}
            </div>
            <div
              className={`text-[11px] ${
                isBusinessReady ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              {isBusinessReady
                ? '1 Cab + Chauffeur ready to serve Dhanbad riders'
                : 'Complete Steps 1 & 2 to begin'}
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Attention Alert for Pending Bookings */}
      {pendingConfirmation.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">
                {pendingConfirmation.length} Booking(s) Awaiting Confirmation
              </h3>
              <p className="text-xs text-amber-900 mt-0.5">
                Customers are waiting for vehicle and chauffeur assignment.
              </p>
            </div>
          </div>

          <Link
            href={`/owner/bookings/${pendingConfirmation[0].id}`}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Review & Assign →
          </Link>
        </div>
      )}

      {/* TOP KPI CARDS (TOTAL BOOKINGS, TODAY'S BOOKINGS, COMPLETED TRIPS, TOTAL REVENUE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#078A32] tracking-tight">
            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            Today: <strong className="text-slate-800">₹{analytics.todayRevenue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#061B33] tracking-tight">
            {analytics.totalBookings}
          </div>
          <div className="text-[11px] text-slate-500">
            Pending:{' '}
            <strong className="text-amber-700 font-bold">{analytics.pendingBookings}</strong>
          </div>
        </div>

        {/* Completed Trips */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completed Trips
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {analytics.completedBookings}
          </div>
          <div className="text-[11px] text-slate-500">
            This Month: <strong className="text-slate-800">{analytics.thisMonthTrips}</strong>
          </div>
        </div>

        {/* Fleet & Duty Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fleet Capacity
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {vehicles.length} / 1 Cab
          </div>
          <div className="text-[11px] text-slate-500">
            Available:{' '}
            <strong className="text-[#078A32]">{availableVehiclesCount} ready</strong>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: ACTIVE TRIPS & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trips Monitor (1 Column) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#078A32] animate-ping" />
              <h2 className="text-sm font-extrabold uppercase text-[#061B33]">Active Trips ({activeTripsList.length})</h2>
            </div>
            <Link href="/owner/bookings" className="text-xs font-bold text-[#078A32] hover:underline">
              View All
            </Link>
          </div>

          {activeTripsList.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs text-slate-400">
              <Navigation className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No active trips on the road right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTripsList.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/owner/bookings/${trip.id}`}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 block transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {trip.bookingNumber}
                    </span>
                    <BookingStatusBadge status={trip.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">{trip.customerName}</span> • Driver:{' '}
                    <span className="font-bold text-[#078A32]">{trip.driverName || 'Assigned'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {trip.pickup.address.split(',')[0]} → {trip.drop.address.split(',')[0]}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Lightweight Daily Revenue Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold uppercase text-[#061B33]">
                Daily Revenue Performance (Past 7 Days)
              </h2>
              <span className="text-xs text-slate-400">Total verified earnings in INR</span>
            </div>
            <Link href="/owner/analytics" className="text-xs font-bold text-[#078A32] hover:underline">
              Full Analytics →
            </Link>
          </div>

          {/* Responsive Bar Chart Visualization */}
          <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {analytics.recentDailyRevenue.map((d) => {
              const maxRev = Math.max(...analytics.recentDailyRevenue.map((r) => r.revenue), 10000);
              const heightPercent = Math.max(8, Math.round((d.revenue / maxRev) * 100));

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{d.revenue.toLocaleString('en-IN')}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-[#061B33] to-[#078A32] rounded-t-xl group-hover:brightness-110 transition-all shadow-xs"
                  />
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FLEET & PRIMARY CAB AVAILABILITY GLANCE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold uppercase text-[#061B33]">
              Primary Cab Fleet Status (1 Vehicle Capacity)
            </h2>
            <span className="text-xs text-slate-500">
              Active cab deployment for premium service in Dhanbad
            </span>
          </div>
          <Link href="/owner/vehicles" className="text-xs font-bold text-[#078A32] hover:underline">
            Manage Vehicle →
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <Car className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No primary vehicle registered yet</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Add your single primary cab to activate dispatch and assign your chauffeur.
            </p>
            <Link
              href="/owner/vehicles"
              className="inline-block bg-[#078A32] hover:bg-[#056B27] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              + Register Primary Cab Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {v.make} {v.model}
                    </h4>
                    <div className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                      {v.registrationNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      v.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
