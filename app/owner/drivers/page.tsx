'use client';

import React, { useState } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { Driver, DriverStatus } from '@/types';
import { Users, Plus, Phone, Mail, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function OwnerDriversPage() {
  const { drivers, loading, addOrUpdateDriver } = useDrivers();
  const { vehicles } = useVehicles();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2030-12-31');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<DriverStatus>('ACTIVE');

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
      assignedVehicleId: assignedVehicleId || undefined,
      totalTrips: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    await addOrUpdateDriver(newDriver);
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
            Human Resources
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Chauffeurs & Drivers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage professional drivers, commercial licensing, and vehicle assignments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chauffeur</span>
        </button>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drivers.map((d) => (
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

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Completed</span>
                <span className="font-extrabold text-[#061B33]">{d.totalTrips || 0} Trips</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Rating</span>
                <span className="font-extrabold text-[#078A32]">{d.rating || 5.0} ★</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <select
                value={d.status}
                onChange={(e) => addOrUpdateDriver({ ...d, status: e.target.value as DriverStatus })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
              </select>

              <select
                value={d.assignedVehicleId || ''}
                onChange={(e) => addOrUpdateDriver({ ...d, assignedVehicleId: e.target.value || undefined })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold text-slate-700"
              >
                <option value="">No Vehicle Assigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in">
            <h3 className="text-base font-extrabold text-[#061B33]">Add Professional Chauffeur</h3>

            <form onSubmit={handleAddDriver} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Mahato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DL Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] text-white font-extrabold shadow-md"
                >
                  Save Chauffeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
