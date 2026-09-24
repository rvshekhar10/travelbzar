import React from 'react';
import { FareCalculation, BookingType } from '@/types';
import { AlertCircle, Info, Sparkles } from 'lucide-react';

interface Props {
  fare: FareCalculation;
  bookingType: BookingType;
  showEstimatedRange?: boolean;
}

export const FareBreakdown: React.FC<Props> = ({ fare, bookingType, showEstimatedRange = false }) => {
  const isAirport = bookingType !== 'LOCAL_CITY';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#061B33]">
          Fare Breakdown
        </h3>
        <span className="text-xs text-slate-500 font-medium">All charges in INR (₹)</span>
      </div>

      <div className="space-y-2 text-sm">
        {/* Base Package / Base Fare */}
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center gap-1.5">
            {isAirport ? 'Base Airport Fare' : 'Local City Package (8 Hrs / 80 KM)'}
          </span>
          <span className="font-semibold text-slate-900">
            ₹{fare.baseFare.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Local City Extra KM */}
        {fare.distanceCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Extra Distance (above 80 km @ ₹14/km)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.distanceCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Local City Extra Time */}
        {fare.timeCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Extra Duration (above 8 hrs @ ₹150/hr)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.timeCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Flight Delay Charge */}
        {fare.airportDelayCharge > 0 && (
          <div className="flex items-center justify-between text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              Airport Flight Delay (Up to 4 Hours Fixed)
            </span>
            <span className="font-bold">+₹{fare.airportDelayCharge.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Owner Review Flag if flight delay > 4 hours */}
        {fare.isOwnerReviewRequired && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-300 text-orange-900 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Flight delay exceeds 4 hours: OWNER REVIEW REQUIRED for custom waiting tariff.</span>
          </div>
        )}

        {/* Waiting Charges */}
        {fare.waitingCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Waiting Charge (after 15 free mins @ ₹3/min)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.waitingCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Night Charge */}
        {fare.nightCharge > 0 && (
          <div className="flex items-center justify-between text-slate-700 pl-2 border-l-2 border-indigo-200">
            <span>Night Charge (10 PM – 6 AM fixed)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.nightCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Parking */}
        {fare.parkingCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span>Parking Charges</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.parkingCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Toll */}
        {fare.tollCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span>Toll Plaza Charges</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.tollCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* State Tax */}
        {fare.stateTaxCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span>Interstate Tax</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.stateTaxCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Cleaning Charge */}
        {fare.cleaningCharge > 0 && (
          <div className="flex items-center justify-between text-slate-700 bg-emerald-50 px-2 py-1 rounded">
            <span>Car Cleaning Charge</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.cleaningCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Other */}
        {fare.otherCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span>Additional Charges</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.otherCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Estimated range indicator if prior to owner confirmation */}
      {showEstimatedRange && fare.estimatedMinFare && fare.estimatedMaxFare && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-medium">Configured Fare Range:</span>
          <span className="font-bold text-[#061B33]">
            ₹{fare.estimatedMinFare.toLocaleString('en-IN')} – ₹{fare.estimatedMaxFare.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Total Amount */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block">
            {showEstimatedRange ? 'Estimated Total' : 'Total Fare'}
          </span>
          <span className="text-[11px] text-slate-400">Toll, Parking & State Tax extra as actuals</span>
        </div>
        <div className="text-right">
          <span className="text-2xl sm:text-3xl font-black text-[#078A32] tracking-tight">
            ₹{fare.totalFare.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};
