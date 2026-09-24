'use client';

import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { Vehicle, VehicleStatus } from '@/types';
import { Car, Plus, ShieldCheck, AlertCircle, Trash2, Edit2, User, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function OwnerVehiclesPage() {
  const { vehicles, loading, addOrUpdateVehicle, removeVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('');
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('Polar White');
  const [year, setYear] = useState(2024);
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newVeh: Vehicle = {
      id: `veh-${Date.now()}`,
      registrationNumber: regNo.toUpperCase().trim(),
      make,
      model,
      color,
      vehicleType: 'Premium Compact SUV',
      year,
      status,
      createdAt: new Date().toISOString(),
    };

    const res = await addOrUpdateVehicle(newVeh);
    if (!res.success) {
      setError(res.error || 'Failed to add vehicle.');
    } else {
      setShowAddModal(false);
      setModel('');
      setRegNo('');
    }
  };

  const currentVehicle = vehicles[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            Fleet Capacity: Max 1 Vehicle (Tier 1 Setup)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Fleet Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your dedicated primary cab. Fleet operations currently support 1 active vehicle.
          </p>
        </div>

        {vehicles.length === 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Primary Vehicle (0/1)</span>
          </button>
        )}
      </div>

      {/* Fleet Capacity Status Banners */}
      {vehicles.length === 0 ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-xs text-amber-900 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Step 1: No Vehicle Listed (0/1 Active Vehicles)</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Before customer bookings can be accepted or dispatched, you must register your primary cab. Currently, you can list 1 dedicated vehicle.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#078A32] hover:bg-[#056B27] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
          >
            Register Primary Vehicle Now →
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
            <span>
              Primary cab registered (<strong>1 of 1</strong> active capacity). To replace this cab, delete the existing record first.
            </span>
          </div>
          <span className="text-[10px] font-black uppercase bg-[#078A32] text-white px-2.5 py-1 rounded-full shrink-0">
            Capacity Full (1/1)
          </span>
        </div>
      )}

      {/* Listed Vehicle Details Card */}
      {currentVehicle && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                <Car className="w-8 h-8 text-[#42B900]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#078A32] block">
                  Primary Fleet Vehicle
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentVehicle.make} {currentVehicle.model}
                </h2>
                <div className="font-mono text-sm font-black text-slate-700 mt-0.5">
                  {currentVehicle.registrationNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <select
                value={currentVehicle.status}
                onChange={(e) =>
                  addOrUpdateVehicle({ ...currentVehicle, status: e.target.value as VehicleStatus })
                }
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
              >
                <option value="AVAILABLE">AVAILABLE (Active)</option>
                <option value="IN_SERVICE">IN SERVICE (On Trip)</option>
                <option value="MAINTENANCE">MAINTENANCE (Offline)</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <button
                onClick={() => {
                  if (confirm('Delete this primary vehicle? Chauffeur assignments linked to this cab will be unlinked.')) {
                    removeVehicle(currentVehicle.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl border border-slate-200 hover:border-rose-300"
                title="Delete Vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Color</span>
              <span className="font-extrabold text-slate-800">{currentVehicle.color}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Year</span>
              <span className="font-extrabold text-slate-800">{currentVehicle.year}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Class</span>
              <span className="font-extrabold text-slate-800">{currentVehicle.vehicleType}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Assigned Chauffeur</span>
              {currentVehicle.currentDriverId ? (
                <span className="font-extrabold text-[#078A32]">
                  {drivers.find((d) => d.id === currentVehicle.currentDriverId)?.name || 'Assigned'}
                </span>
              ) : (
                <Link
                  href="/owner/drivers"
                  className="font-bold text-amber-600 hover:underline block"
                >
                  + Assign Driver →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in">
            <h3 className="text-lg font-black text-[#061B33]">Register Primary Vehicle (1/1)</h3>
            <p className="text-slate-500 text-[11px]">
              Add your primary fleet vehicle. This cab will be assigned to your verified chauffeurs.
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Number Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JH-10-BX-4421"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-[#078A32] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Make / Brand</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model & Variant</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Venue SX Turbo"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color</label>
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
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
                  className="px-5 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black shadow-md transition-all"
                >
                  Save Primary Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
