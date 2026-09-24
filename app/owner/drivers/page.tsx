'use client';

import React, { useState } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { Driver, DriverStatus } from '@/types';
import { Users, Plus, Phone, Mail, Award, CheckCircle2, ShieldCheck, Car, KeyRound, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function OwnerDriversPage() {
  const { drivers, loading, addOrUpdateDriver } = useDrivers();
  const { vehicles } = useVehicles();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('driver123');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2030-12-31');
  const [assignedVehicleId, setAssignedVehicleId] = useState(vehicles[0]?.id || '');
  const [status, setStatus] = useState<DriverStatus>('ACTIVE');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const primaryVehicle = vehicles[0];

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      name,
      phone,
      email,
      licenseNumber,
      licenseExpiry,
      status,
      assignedVehicleId: assignedVehicleId || primaryVehicle?.id || undefined,
      totalTrips: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    await addOrUpdateDriver(newDriver);
    setSuccessMsg(`Driver account created for ${name}! They can now log in at /driver using ${email}.`);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
    setLicenseNumber('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Human Resources & Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Chauffeurs & Drivers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add drivers, provision their login credentials, and assign them to your primary vehicle.
          </p>
        </div>

        {primaryVehicle ? (
          <button
            onClick={() => {
              setAssignedVehicleId(primaryVehicle.id);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chauffeur & Provision Login</span>
          </button>
        ) : (
          <Link
            href="/owner/vehicles"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs self-start sm:self-auto"
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
            className="text-emerald-700 hover:text-emerald-950 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Warning if no vehicle is listed */}
      {!primaryVehicle && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Vehicle Listing Required Before Driver Assignment</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Travel BZAR manages a dedicated 1-cab fleet. You must list your primary cab before adding and assigning a chauffeur.
          </p>
          <Link
            href="/owner/vehicles"
            className="inline-block bg-[#078A32] hover:bg-[#056B27] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs mt-1"
          >
            Go to Fleet Setup & Add Vehicle →
          </Link>
        </div>
      )}

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drivers.map((d) => {
          const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);
          return (
            <div
              key={d.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-400">ID: {d.id}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    d.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {d.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {d.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{d.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-[#078A32]" />
                    <span>{d.phone}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    DL: {d.licenseNumber} (Valid: {d.licenseExpiry})
                  </div>
                </div>
              </div>

              {/* Assigned Vehicle Badge */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#078A32]" />
                  <span className="text-slate-500">Assigned Cab:</span>
                  <strong className="text-slate-900">
                    {assignedVeh ? `${assignedVeh.make} ${assignedVeh.model} (${assignedVeh.registrationNumber})` : 'Unassigned'}
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
                  <span>Login: {d.email}</span>
                </span>
                <span className="text-[11px] font-bold text-[#078A32]">Auth Provisioned ✓</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in">
            <div>
              <h3 className="text-lg font-black text-[#061B33]">Add Chauffeur & Provision Login</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Creates the chauffeur profile and provisions their driver login account.
              </p>
            </div>

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
                    placeholder="driver2@travelbzar.com"
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
                  className="px-5 py-2.5 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black shadow-md transition-all"
                >
                  Create Account & Assign Cab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
