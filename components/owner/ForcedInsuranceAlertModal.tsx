'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { getVehicleInsuranceStatus } from '@/services/complianceService';
import {
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { POPULAR_INSURERS } from '@/config/business';

interface Props {
  vehicles: Vehicle[];
  onUpdateVehicleInsurance: (
    vehicleId: string,
    newPolicyNumber: string,
    newInsurer: string,
    newExpiryDate: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ForcedInsuranceAlertModal: React.FC<Props> = ({
  vehicles,
  onUpdateVehicleInsurance,
}) => {
  const [criticalVehicle, setCriticalVehicle] = useState<Vehicle | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);

  // Form states
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurerName, setInsurerName] = useState('Bajaj Allianz General Insurance');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if any vehicle has critical insurance expiry (<= 10 days or expired)
  useEffect(() => {
    const critical = vehicles.find((v) => {
      const ins = getVehicleInsuranceStatus(v.insurance);
      return ins.status === 'CRITICAL_10_DAYS' || ins.status === 'EXPIRED';
    });

    if (critical) {
      setCriticalVehicle(critical);
      setPolicyNumber(critical.insurance?.policyNumber || '');
      setInsurerName(critical.insurance?.insurerName || 'Bajaj Allianz General Insurance');
      // Default new expiry date to 1 year from now
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(nextYear.toISOString().split('T')[0]);
    } else {
      setCriticalVehicle(null);
    }
  }, [vehicles]);

  if (!criticalVehicle || isDismissed) {
    return null;
  }

  const insStatus = getVehicleInsuranceStatus(criticalVehicle.insurance);

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await onUpdateVehicleInsurance(
        criticalVehicle.id,
        policyNumber.trim().toUpperCase(),
        insurerName.trim(),
        expiryDate
      );
      setSaving(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update insurance policy.');
      } else {
        setSuccessMsg('Insurance policy successfully renewed! Critical alert cleared.');
        setTimeout(() => {
          setIsDismissed(true);
        }, 1500);
      }
    } catch (err: unknown) {
      setSaving(false);
      setErrorMsg(err instanceof Error ? err.message : 'Error updating insurance policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-rose-600 overflow-hidden space-y-0 my-8">
        {/* Flashing Urgency Header */}
        <div className="bg-rose-600 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-200 block">
                MANDATORY COMPLIANCE NOTICE • 10-DAY RULE
              </span>
              <h2 className="text-lg sm:text-xl font-black leading-tight text-white">
                FORCED CRITICAL ALERT: Car Insurance Expiry!
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/70 hover:text-white p-1 rounded-lg text-xs font-bold cursor-pointer"
            title="Temporarily Dismiss Notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {successMsg ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#078A32] mx-auto" />
              <h4 className="font-black text-sm">Policy Renewed Successfully!</h4>
              <p className="text-xs text-emerald-800">{successMsg}</p>
            </div>
          ) : (
            <>
              {/* Alert details pill */}
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-rose-700" />
                    <span className="font-extrabold text-slate-900 text-sm">
                      {criticalVehicle.make} {criticalVehicle.model}
                    </span>
                  </div>
                  <span className="font-mono font-black text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded text-xs">
                    {criticalVehicle.registrationNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-rose-200">
                  <div>
                    <span className="text-slate-500 block">Current Policy:</span>
                    <strong className="text-slate-800">
                      {criticalVehicle.insurance?.policyNumber || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Insurer:</span>
                    <strong className="text-slate-800">
                      {criticalVehicle.insurance?.insurerName || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expiration Date:</span>
                    <strong className="text-rose-700 font-black">
                      {criticalVehicle.insurance?.expiryDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <span className="text-rose-800 font-extrabold bg-rose-200 px-2 py-0.5 rounded-md inline-block">
                      {insStatus.badgeText}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-rose-900 font-semibold leading-relaxed pt-1">
                  ⚠️ <strong>Legal Warning:</strong> Motor Vehicles Act requires commercial cabs to carry active insurance at all times. Operating this vehicle without renewing policy exposes the fleet to impoundment, hefty penalties, and zero liability protection.
                </div>
              </div>

              {/* Renewal Form Accordion */}
              {showRenewForm ? (
                <form onSubmit={handleRenewSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-black text-slate-900 text-xs">
                      Update Renewed Insurance Policy Details:
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRenewForm(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Hide Form
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      New Policy / Cover Note Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BAJAJ-COMM-2027-001"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Insurance Provider</label>
                      <select
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {POPULAR_INSURERS.map((ins) => (
                          <option key={ins} value={ins}>
                            {ins}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">New Policy Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#078A32] bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Save & Confirm Policy Renewal</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewForm(true)}
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Renew / Enter New Insurance Policy Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDismissed(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Acknowledge Notice & Remind Again Next Session
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
