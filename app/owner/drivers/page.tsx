'use client';

import React, { useState } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { provisionUserAccount } from '@/lib/firebase/provisioning';
import { Driver, DriverStatus } from '@/types';
import {
  Users,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  Car,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerDriversPage() {
  const { drivers, loading, refresh, removeDriver } = useDrivers();
  const { vehicles } = useVehicles();

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('driver123');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2030-12-31');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const primaryVehicle = vehicles[0];

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await provisionUserAccount({
        name,
        email,
        password,
        phone,
        role: 'driver',
        driverDetails: {
          licenseNumber,
          licenseExpiry,
          assignedVehicleId: assignedVehicleId || primaryVehicle?.id || undefined,
        },
      });

      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create driver account.');
        return;
      }

      await refresh();
      setSuccessMsg(
        `Chauffeur account successfully provisioned in Firebase for ${name}! Login email: ${email.toLowerCase()}`
      );
      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setLicenseNumber('');
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Error provisioning chauffeur account.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            Human Resources & Chauffeur Fleet
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Chauffeurs & Drivers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision verified chauffeurs into Firebase Auth & Firestore, and link them to your primary cab.
          </p>
        </div>

        {primaryVehicle ? (
          <button
            onClick={() => {
              setAssignedVehicleId(primaryVehicle.id);
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chauffeur & Provision Login</span>
          </button>
        ) : (
          <Link
            href="/owner/vehicles"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md self-start sm:self-auto"
          >
            <Car className="w-4 h-4" />
            <span>Add Vehicle First (Required) →</span>
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Warning if no vehicle is listed */}
      {!primaryVehicle && !loading && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Vehicle Registration Required Before Chauffeur Assignment</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Travel BZAR manages a dedicated 1-cab fleet in Firestore. You must register your primary cab first before assigning a verified chauffeur.
          </p>
          <Link
            href="/owner/vehicles"
            className="inline-block bg-[#078A32] hover:bg-[#056B27] text-white font-black px-4 py-2 rounded-xl text-xs shadow-xs mt-1"
          >
            Go to Fleet Setup & Add Vehicle →
          </Link>
        </div>
      )}

      {/* Drivers List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#078A32]" />
          <span>Loading chauffeur records from Firestore...</span>
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800">No Chauffeurs Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not registered any drivers in Firestore yet. Add a chauffeur to provision their credentials and assign your cab.
          </p>
          {primaryVehicle && (
            <button
              onClick={() => {
                setAssignedVehicleId(primaryVehicle.id);
                setErrorMsg(null);
                setShowAddModal(true);
              }}
              className="bg-[#078A32] hover:bg-[#056B27] text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md mt-2"
            >
              + Provision First Chauffeur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((d) => {
            const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);
            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-400">ID: {d.id.slice(0, 10)}...</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        d.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {d.status}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove chauffeur ${d.name} from Firestore?`)) {
                          removeDriver(d.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Remove Chauffeur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-xl shadow-md">
                    {(d?.name || 'Chauffeur')
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'DR'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{d?.name || 'Chauffeur'}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-[#078A32]" />
                      <span>{d?.phone || 'No phone'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      DL: {d?.licenseNumber || 'N/A'} (Valid: {d?.licenseExpiry || 'N/A'})
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle Badge */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#078A32]" />
                    <span className="text-slate-500">Assigned Cab:</span>
                    <strong className="text-slate-900">
                      {assignedVeh
                        ? `${assignedVeh.make} ${assignedVeh.model} (${assignedVeh.registrationNumber})`
                        : 'Unassigned'}
                    </strong>
                  </div>
                  {assignedVeh && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Ready
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Login: {d?.email || 'N/A'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#078A32]">Firebase Auth Active ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div>
              <h3 className="text-lg font-black text-[#061B33]">Add Chauffeur & Provision Login</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Creates the chauffeur account in Firebase Auth and saves their record to Firestore.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chauffeur Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Mahato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#078A32] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Login Email</label>
                  <input
                    type="email"
                    required
                    placeholder="driver@travelbzar.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Driver Portal Password (for login)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Commercial DL No.</label>
                  <input
                    type="text"
                    required
                    placeholder="JH10-XXXX-XXXX"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DL Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {primaryVehicle && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-black block">
                    Auto-Assigning to Primary Cab
                  </span>
                  <div className="text-xs font-bold text-emerald-950 mt-0.5">
                    {primaryVehicle.make} {primaryVehicle.model} ({primaryVehicle.registrationNumber})
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Provision in Firebase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
