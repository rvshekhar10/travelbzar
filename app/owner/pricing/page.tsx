'use client';

import React, { useState, useEffect } from 'react';
import { usePricing } from '@/hooks/usePricing';
import { PricingConfig } from '@/types';
import { Compass, Save, CheckCircle2, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import { DEFAULT_PRICING_CONFIG } from '@/config/business';

export default function OwnerPricingManagementPage() {
  const { pricing, loading, updatePricing } = usePricing();
  const [form, setForm] = useState<PricingConfig>(pricing);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pricing) setForm(pricing);
  }, [pricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updatePricing(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all tariffs to the official Travel BZAR rate-card defaults?')) {
      setForm(DEFAULT_PRICING_CONFIG);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Tariff Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">
            Rate Card & Pricing Rules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure local package rates, airport price ranges, flight delay charges, and waiting rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 bg-white px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Rate Card Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Tariff configuration saved and activated across all portals!</span>
          </div>
        )}

        {/* 1. LOCAL CITY PACKAGE */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-black text-[#078A32] uppercase tracking-wide">
              1. Local City Package (Dhanbad)
            </h2>
            <span className="text-[11px] text-slate-400">Default: 8 Hours / 80 KM @ ₹2,400</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Package Fare (₹)</label>
              <input
                type="number"
                min={0}
                value={form.localBaseFare}
                onChange={(e) => setForm({ ...form, localBaseFare: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Included Hours</label>
              <input
                type="number"
                min={1}
                value={form.localIncludedHours}
                onChange={(e) => setForm({ ...form, localIncludedHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Included Kilometres (KM)</label>
              <input
                type="number"
                min={1}
                value={form.localIncludedKm}
                onChange={(e) => setForm({ ...form, localIncludedKm: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Extra KM Rate (₹ / KM)</label>
              <input
                type="number"
                min={0}
                value={form.localExtraKmRate}
                onChange={(e) => setForm({ ...form, localExtraKmRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Extra Hour Rate (₹ / Hour)</label>
              <input
                type="number"
                min={0}
                value={form.localExtraHourRate}
                onChange={(e) => setForm({ ...form, localExtraHourRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* 2. AIRPORT TRANSFER TARIFF RANGES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-black text-[#F0441D] uppercase tracking-wide">
              2. Airport Transfer Price Ranges (Drop & Pickup)
            </h2>
            <span className="text-[11px] text-slate-400">Configured Minimum & Maximum</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ranchi */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <h3 className="font-black text-slate-900">Ranchi Airport (IXR)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.ranchi.minimumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          ranchi: { ...form.airports.ranchi, minimumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.ranchi.maximumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          ranchi: { ...form.airports.ranchi, maximumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Deoghar */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <h3 className="font-black text-slate-900">Deoghar Airport (DGH)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.deoghar.minimumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          deoghar: { ...form.airports.deoghar, minimumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.deoghar.maximumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          deoghar: { ...form.airports.deoghar, maximumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Durgapur */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <h3 className="font-black text-slate-900">Durgapur Airport (RDP)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.durgapur.minimumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          durgapur: { ...form.airports.durgapur, minimumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Fare (₹)</label>
                  <input
                    type="number"
                    value={form.airports.durgapur.maximumFare}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        airports: {
                          ...form.airports,
                          durgapur: { ...form.airports.durgapur, maximumFare: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FLIGHT DELAY, WAITING, & NIGHT CHARGES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-[#061B33] uppercase tracking-wide pb-2 border-b border-slate-100">
            3. Specialized Rules & Allowances
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Flight Delay Rule */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Airport Flight Delay</div>
              <p className="text-[10px] text-slate-500">Fixed rate covering up to 4 hours delay</p>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Fixed Charge (₹)</label>
                <input
                  type="number"
                  value={form.airportDelayCharge}
                  onChange={(e) => setForm({ ...form, airportDelayCharge: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
            </div>

            {/* Waiting Charges */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Standard Waiting Rate</div>
              <p className="text-[10px] text-slate-500">15 mins free, then ₹3/min</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Free Mins</label>
                  <input
                    type="number"
                    value={form.waitingFreeMinutes}
                    onChange={(e) => setForm({ ...form, waitingFreeMinutes: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">₹ / Min</label>
                  <input
                    type="number"
                    value={form.waitingRatePerMinute}
                    onChange={(e) => setForm({ ...form, waitingRatePerMinute: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Night Charges */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Night Allowance</div>
              <p className="text-[10px] text-slate-500">10 PM to 6 AM window</p>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Fixed Charge (₹)</label>
                <input
                  type="number"
                  value={form.nightCharge}
                  onChange={(e) => setForm({ ...form, nightCharge: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Rates...' : 'Save & Publish Tariffs'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
