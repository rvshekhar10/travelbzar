'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Save,
  RotateCcw,
  ShieldCheck,
  Plane,
  AlertCircle,
  Building2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  MarkupSettings,
  DEFAULT_MARKUP_SETTINGS,
  getStoredMarkupSettings,
  saveStoredMarkupSettings,
} from '@/services/flightQuoteService';

export default function MarkupSettingsPage() {
  const [form, setForm] = useState<MarkupSettings>(DEFAULT_MARKUP_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const settings = await getStoredMarkupSettings();
        setForm(settings);
      } catch (err: any) {
        console.error('Failed to load markup settings:', err);
        setErrorMsg('Failed to fetch remote settings; loaded cached or default values.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleNumberChange = (field: keyof MarkupSettings, value: string) => {
    const num = Number(value);
    setForm((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      await saveStoredMarkupSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving markup settings:', err);
      setErrorMsg('Failed to save to cloud database. Please check your network or permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset all markup and cancellation charges to system defaults?')) {
      setForm(DEFAULT_MARKUP_SETTINGS);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sliders className="w-4 h-4" />
            Business Tools &middot; Global Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Flight Markup & Cancellation Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally stored in Firestore. Applied automatically across all flight quotation OCR scans and customer quotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/owner/tools/flight-quote"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            &larr; Back to Flight Quote OCR
          </Link>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset form to system defaults"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold">Settings successfully saved in Firestore & synced!</p>
            <p className="text-xs text-emerald-700">All new quotation OCR readings will instantly use these rates.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading stored flight markup settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Fare Category Markups */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">1. Category Markups (Per Ticket)</h2>
                  <p className="text-xs text-slate-500">
                    Profit margin added on top of base agent partner rates when generating client quotes.
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full">
                Auto-added in Quotation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Value Fare */}
              <div className="space-y-1.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Value Fare Markup</label>
                  <span className="text-xs text-slate-400">Default: ₹100</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Standard economy entry tier fare</p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.valueMarkup}
                    onChange={(e) => handleNumberChange('valueMarkup', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* SME Fare */}
              <div className="space-y-1.5 p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:border-amber-200 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-amber-950">SME / Corporate Markup</label>
                  <span className="text-xs text-amber-700">Default: ₹250</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Corporate benefits, free meal / low cancellation</p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.smeMarkup}
                    onChange={(e) => handleNumberChange('smeMarkup', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Classic Fare */}
              <div className="space-y-1.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Classic Fare Markup</label>
                  <span className="text-xs text-slate-400">Default: ₹150</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Includes seat selection / standard flexibility</p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.classicMarkup}
                    onChange={(e) => handleNumberChange('classicMarkup', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Flex Fare */}
              <div className="space-y-1.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Flex / Flexi Plus Markup</label>
                  <span className="text-xs text-slate-400">Default: ₹200</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Zero date change fee or high flexibility</p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.flexMarkup}
                    onChange={(e) => handleNumberChange('flexMarkup', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Special / Non-Refundable */}
              <div className="space-y-1.5 p-4 rounded-xl border border-rose-100 bg-rose-50/30 hover:border-rose-200 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-rose-950">Special & Non-Refundable Markup</label>
                  <span className="text-xs text-rose-700">Default: ₹250</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Promo non-refundable deal: Fare + markup</p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.specialNonRefundableMarkup}
                    onChange={(e) => handleNumberChange('specialNonRefundableMarkup', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Airline Cancellation Policy Charges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">2. Airline Cancellation Charges (Per Pax)</h2>
                  <p className="text-xs text-slate-500">
                    Exact cancellation fees quoted to customer for corporate/SME vs. standard/normal fares.
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-full flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Client Rules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Air India Express */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900">Air India Express</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                    IX / AIX
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">SME / Corporate Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.airIndiaExpressSmeCancel}
                      onChange={(e) => handleNumberChange('airIndiaExpressSmeCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹1,250 / pax</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Normal / Value Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.airIndiaExpressNormalCancel}
                      onChange={(e) => handleNumberChange('airIndiaExpressNormalCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹4,550 / pax</p>
                </div>
              </div>

              {/* Akasa Air */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900">Akasa Air</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                    QP
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Corporate / SME Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.akasaSmeCancel}
                      onChange={(e) => handleNumberChange('akasaSmeCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹700 / pax</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Normal / Value Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.akasaNormalCancel}
                      onChange={(e) => handleNumberChange('akasaNormalCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹5,250 / pax</p>
                </div>
              </div>

              {/* IndiGo */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900">IndiGo</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    6E
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">SME / Corporate Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.indigoSmeCancel}
                      onChange={(e) => handleNumberChange('indigoSmeCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹1,100 / pax</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Normal / Value Cancellation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.indigoNormalCancel}
                      onChange={(e) => handleNumberChange('indigoNormalCancel', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Client spec: ₹5,250 / pax</p>
                </div>
              </div>
            </div>

            {/* Other Airlines Default */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Other Airlines SME Cancellation (Default)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={form.defaultSmeCancel}
                    onChange={(e) => handleNumberChange('defaultSmeCancel', e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Other Airlines Normal Cancellation (Default)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={form.defaultNormalCancel}
                    onChange={(e) => handleNumberChange('defaultNormalCancel', e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Agency Branding / Signature */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">3. Agency Branding & Footer Signature</h2>
                <p className="text-xs text-slate-500">
                  Included at the bottom of every generated WhatsApp and text quotation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Agency / Brand Name</label>
                <input
                  type="text"
                  value={form.agencyName}
                  onChange={(e) => setForm((p) => ({ ...p, agencyName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={form.agencyPhone}
                  onChange={(e) => setForm((p) => ({ ...p, agencyPhone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location / City</label>
                <input
                  type="text"
                  value={form.agencyLocation}
                  onChange={(e) => setForm((p) => ({ ...p, agencyLocation: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Ready to update your quotation rules?</p>
              <p className="text-xs text-slate-400">Settings will apply immediately to your next OCR quote generation.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving to Firestore...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Markup Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

