'use client';

import React from 'react';
import { Vehicle } from '@/types';
import { getVehicleInsuranceStatus } from '@/services/complianceService';
import { AlertCircle, AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Props {
  vehicles: Vehicle[];
}

export const InsuranceAlertBanner: React.FC<Props> = ({ vehicles }) => {
  const alertedVehicles = vehicles
    .map((v) => ({ vehicle: v, status: getVehicleInsuranceStatus(v.insurance) }))
    .filter((item) => item.status.status === 'CRITICAL_10_DAYS' || item.status.status === 'EXPIRING_30_DAYS' || item.status.status === 'EXPIRED');

  if (alertedVehicles.length === 0) return null;

  return (
    <div className="space-y-3">
      {alertedVehicles.map(({ vehicle, status }) => {
        const isCritical = status.status === 'CRITICAL_10_DAYS' || status.status === 'EXPIRED';

        return (
          <div
            key={vehicle.id}
            className={`p-4 rounded-3xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              isCritical
                ? 'bg-rose-50 border-rose-500 text-rose-950 animate-pulse'
                : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isCritical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${
                      isCritical ? 'bg-rose-600' : 'bg-amber-600'
                    }`}
                  >
                    {isCritical ? '🚨 10-DAY FORCED ALERT' : '⚠️ 1-MONTH EXPIRY NOTICE'}
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {vehicle.registrationNumber}
                  </span>
                </div>

                <p className="text-xs font-bold mt-0.5">
                  Insurance for {vehicle.make} {vehicle.model} ({vehicle.insurance?.insurerName || 'Commercial Policy'}) expires on{' '}
                  <span className="underline">{vehicle.insurance?.expiryDate}</span> —{' '}
                  <strong className={isCritical ? 'text-rose-700' : 'text-amber-800'}>
                    {status.daysRemaining <= 0
                      ? 'EXPIRED TODAY!'
                      : `${status.daysRemaining} days left`}
                  </strong>
                </p>
              </div>
            </div>

            <Link
              href="/owner/vehicles"
              className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-colors shrink-0 text-white ${
                isCritical
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Update / Renew Policy →
            </Link>
          </div>
        );
      })}
    </div>
  );
};
