import React from 'react';
import { FareCalculation, BookingType, PricingSnapshot } from '@/types';
import { AlertCircle, Info, Sparkles, Compass, Moon } from 'lucide-react';
import { usePricing } from '@/hooks/usePricing';

interface Props {
  fare: FareCalculation;
  bookingType: BookingType;
  showEstimatedRange?: boolean;
  pricingSnapshot?: PricingSnapshot;
}

export const FareBreakdown: React.FC<Props> = ({
  fare,
  bookingType,
  showEstimatedRange = false,
  pricingSnapshot,
}) => {
  const { pricing } = usePricing();
  const isAirport = bookingType !== 'LOCAL_CITY';

  const includedKm = pricingSnapshot?.includedKm ?? pricing?.localIncludedKm ?? 80;
  const includedHours = pricingSnapshot?.includedHours ?? pricing?.localIncludedHours ?? 8;
  const extraKmRate = pricingSnapshot?.extraKmRate ?? pricing?.localExtraKmRate ?? 14;
  const extraHourRate = pricingSnapshot?.extraHourRate ?? pricing?.localExtraHourRate ?? 150;
  const waitRate = pricingSnapshot?.waitingRate ?? pricing?.waitingRatePerMinute ?? 3;
  const freeMins = pricing?.waitingFreeMinutes ?? 15;
  const stayRate = pricingSnapshot?.driverStayRatePerNight ?? pricing?.driverStayRatePerNight ?? 500;
  const nightStart = pricing?.nightStart ?? '10 PM';
  const nightEnd = pricing?.nightEnd ?? '6 AM';
  const delayMaxHours = pricing?.airportDelayMaxHours ?? 4;

  const detourAmount = fare.detourCharge || (isAirport && fare.distanceCharge > 0 ? fare.distanceCharge : 0);
  const detourDistance = fare.detourKm || (detourAmount > 0 ? Math.round((detourAmount / extraKmRate) * 10) / 10 : 0);

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
            {isAirport ? 'Base Airport Fare' : `Local City Package (${includedHours} Hrs / ${includedKm} KM)`}
          </span>
          <span className="font-semibold text-slate-900">
            ₹{fare.baseFare.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Airport Route Detours */}
        {isAirport && detourAmount > 0 && (
          <div className="flex items-center justify-between text-amber-950 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Route Detour ({detourDistance} km excess @ ₹{extraKmRate}/km)</span>
            </span>
            <span className="font-bold text-amber-900">
              +₹{detourAmount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Local City Extra KM */}
        {!isAirport && fare.distanceCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Extra Distance (above {includedKm} km @ ₹{extraKmRate}/km)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.distanceCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Local City Extra Time */}
        {fare.timeCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Extra Duration (above {includedHours} hrs @ ₹{extraHourRate}/hr)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.timeCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Driver Stay / Overnight Halt Allowance (Customer Request) */}
        {fare.driverStayCharge && fare.driverStayCharge > 0 && (
          <div className="flex items-center justify-between text-indigo-950 bg-indigo-50/70 px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                Driver Stay Allowance ({fare.driverStayNights || 1} Night
                {(fare.driverStayNights || 1) > 1 ? 's' : ''} @ ₹{stayRate}/night)
              </span>
            </span>
            <span className="font-bold text-indigo-900">
              +₹{fare.driverStayCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Flight Delay Charge */}
        {fare.airportDelayCharge > 0 && (
          <div className="flex items-center justify-between text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              Airport Flight Delay (Up to {delayMaxHours} Hours Fixed)
            </span>
            <span className="font-bold">+₹{fare.airportDelayCharge.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Owner Review Flag if flight delay > 4 hours */}
        {fare.isOwnerReviewRequired && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-300 text-orange-900 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Flight delay exceeds {delayMaxHours} hours: OWNER REVIEW REQUIRED for custom waiting tariff.</span>
          </div>
        )}

        {/* Waiting & Halt Charges */}
        {fare.waitingCharge > 0 && (
          <div className="flex items-center justify-between text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>Waiting & Halt Time (after {freeMins} free mins @ ₹{waitRate}/min)</span>
            <span className="font-semibold text-slate-900">
              +₹{fare.waitingCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Night Charge */}
        {fare.nightCharge > 0 && (
          <div className="flex items-center justify-between text-slate-700 pl-2 border-l-2 border-indigo-200">
            <span>Night Charge ({nightStart} – {nightEnd} fixed)</span>
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

        {/* Settled Extra actuals if recorded on invoice/settlement */}
        {(fare.tollCharge > 0 || fare.parkingCharge > 0 || fare.stateTaxCharge > 0) && (
          <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block">Settled Trip Actuals (Recorded Receipts):</span>
            {fare.tollCharge > 0 && (
              <div className="flex items-center justify-between pl-2">
                <span>• Toll Plaza Receipts (at actuals)</span>
                <span className="font-semibold text-slate-900">+₹{fare.tollCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            {fare.parkingCharge > 0 && (
              <div className="flex items-center justify-between pl-2">
                <span>• Parking Fee Receipts (at actuals)</span>
                <span className="font-semibold text-slate-900">+₹{fare.parkingCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            {fare.stateTaxCharge > 0 && (
              <div className="flex items-center justify-between pl-2">
                <span>• Interstate State Tax</span>
                <span className="font-semibold text-slate-900">+₹{fare.stateTaxCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prominent Mandatory Exclusions & Pay-at-Actuals Notice */}
      <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-black text-amber-900 text-xs">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Payable by Customer Apart From Cab Fare:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-900/90">
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-amber-200">
            <span className="font-black text-amber-800">🛣️ Toll Charges:</span>
            <span className="font-bold">@ Actual</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-amber-200">
            <span className="font-black text-amber-800">🅿️ Parking Fee:</span>
            <span className="font-bold">@ Actual</span>
          </div>
        </div>
        <p className="text-[10px] text-amber-800 leading-tight">
          * Toll plaza fees and parking fees are not included in the cab fare tariff and must be paid by the customer directly as incurred.
        </p>
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
            {showEstimatedRange ? 'Estimated Cab Fare' : 'Total Cab Fare'}
          </span>
          <span className="text-[11px] font-semibold text-amber-700">
            + Toll @ actual & parking fee extra (by customer)
          </span>
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
