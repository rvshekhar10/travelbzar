'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useBooking } from '@/hooks/useBookings';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BUSINESS_CONFIG } from '@/config/business';

interface Props {
  params: Promise<{ id: string }>;
}

export default function DigitalReceiptPage({ params }: Props) {
  const { id } = use(params);
  const { booking, loading } = useBooking(id);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading digital receipt...</div>;
  }

  if (!booking) {
    return <div className="p-12 text-center text-xs text-slate-500">Booking not found.</div>;
  }

  return (
    <div className="py-6 sm:py-10 px-4 max-w-2xl mx-auto space-y-6">
      {/* Top action bar - Hidden when printed */}
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/customer/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Printed Receipt Container */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-300 shadow-xl space-y-6 text-slate-900">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-200">
          <div>
            <TravelBzarLogo size="md" variant="dark" showTagline={true} clickable={false} />
            <div className="text-xs text-slate-500 mt-2">
              Dhanbad, Jharkhand, India • Phone: {BUSINESS_CONFIG.contact.phone}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#078A32] block">
              TAX INVOICE / RECEIPT
            </span>
            <div className="text-lg font-black font-mono mt-0.5">{booking.bookingNumber}</div>
            <div className="text-xs text-slate-500">
              Date: {new Date(booking.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </div>
        </div>

        {/* Passenger & Journey Overview */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Billed To</span>
            <div className="font-extrabold text-sm text-slate-900">{booking.customerName}</div>
            <div className="text-slate-600">{booking.customerPhone}</div>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Service Type</span>
            <div className="font-extrabold text-sm text-slate-900">
              {booking.bookingType.replace('_', ' ')}
            </div>
            <div className="text-slate-600">
              {booking.bookingDate} at {booking.pickupTime} IST
            </div>
          </div>
        </div>

        {/* Chauffeur and Cab Details */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Chauffeur</span>
            <span className="font-bold text-slate-800">{booking.driverName || 'Verified Chauffeur'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle</span>
            <span className="font-bold text-slate-800">
              {booking.vehicleModel} ({booking.vehicleRegistrationNumber || 'Commercial Taxi'})
            </span>
          </div>
        </div>

        {/* Route Details */}
        <div className="text-xs space-y-2 border-y border-slate-100 py-3">
          <div>
            <strong className="text-slate-400 uppercase text-[10px] block">Pickup Address</strong>
            <div className="font-medium text-slate-800">{booking.pickup.address}</div>
          </div>
          <div>
            <strong className="text-slate-400 uppercase text-[10px] block">Drop Destination</strong>
            <div className="font-medium text-slate-800">{booking.drop.address}</div>
          </div>
        </div>

        {/* Itemized Fare Breakdown */}
        <div className="border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Base Package / Fare</span>
            <span className="font-bold">₹{booking.fare.baseFare.toLocaleString('en-IN')}</span>
          </div>

          {booking.fare.distanceCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Extra Distance Charges</span>
              <span className="font-bold">+₹{booking.fare.distanceCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.timeCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Extra Time Charges</span>
              <span className="font-bold">+₹{booking.fare.timeCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.airportDelayCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Airport Flight Delay Waiting (Up to 4 hrs)</span>
              <span className="font-bold">+₹{booking.fare.airportDelayCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.waitingCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Standard Waiting Charge</span>
              <span className="font-bold">+₹{booking.fare.waitingCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.nightCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Night Charges (10 PM – 6 AM)</span>
              <span className="font-bold">+₹{booking.fare.nightCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.tollCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Toll Plaza Charges</span>
              <span className="font-bold">+₹{booking.fare.tollCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.parkingCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Parking Charges</span>
              <span className="font-bold">+₹{booking.fare.parkingCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          {booking.fare.cleaningCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Car Cleaning Charge</span>
              <span className="font-bold">+₹{booking.fare.cleaningCharge.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center text-sm">
            <span className="font-black uppercase tracking-wider text-slate-900">Total Amount Paid</span>
            <span className="text-2xl font-black text-[#078A32]">
              ₹{booking.fare.totalFare.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment and Sign Off */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <PaymentStatusBadge status={booking.paymentStatus} size="md" />
            {booking.paymentMethod && (
              <span className="text-xs text-slate-500 font-semibold">
                via {booking.paymentMethod}
              </span>
            )}
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <div>Authorized Digital Invoice</div>
            <div className="font-semibold text-slate-600">Travel BZAR Chauffeur Desk</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-500 italic">
          Thank you for choosing Travel BZAR! Safe travels always. ❤️
        </div>
      </div>
    </div>
  );
}
