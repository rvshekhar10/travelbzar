'use client';

import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Vehicle, VehicleStatus } from '@/types';
import { Car, Plus, ShieldCheck, AlertCircle, Trash2, Edit2 } from 'lucide-react';

export default function OwnerVehiclesPage() {
  const { vehicles, loading, addOrUpdateVehicle, removeVehicle } = useVehicles();
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('');
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('White');
  const [year, setYear] = useState(2024);
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newVeh: Vehicle = {
      id: `veh-${Date.now()}`,
      registrationNumber: regNo.toUpperCase(),
      make,
      model,
      color,
      vehicleType: 'Compact SUV',
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Fleet Capacity: Max 2 Vehicles
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Fleet Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your dedicated premium cabs. Strict maximum 2 vehicle capacity.
          </p>
        </div>

        {vehicles.length < 2 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle ({vehicles.length}/2)</span>
          </button>
        )}
      </div>

      {vehicles.length >= 2 && (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#078A32] shrink-0" />
          <span>
            Fleet at full operational capacity (2 vehicles). To add another vehicle, archive or remove an existing vehicle first.
          </span>
        </div>
      )}

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map((v, idx) => (
          <div
            key={v.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase text-slate-400">
                Vehicle {idx + 1} of 2
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  v.status === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {v.status}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Car className="w-7 h-7 text-[#42B900]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {v.make} {v.model}
                </h3>
                <div className="font-mono text-xs font-bold text-slate-600 mt-0.5">
                  {v.registrationNumber}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {v.color} • {v.year} • {v.vehicleType}
                </div>
              </div>
            </div>

            {v.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {v.notes}
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <select
                value={v.status}
                onChange={(e) => addOrUpdateVehicle({ ...v, status: e.target.value as VehicleStatus })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="IN_SERVICE">IN SERVICE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <button
                onClick={() => removeVehicle(v.id)}
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                title="Remove vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in">
            <h3 className="text-base font-extrabold text-[#061B33]">Add Fleet Vehicle</h3>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JH-10-BX-3003"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model & Variant</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta SX"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
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
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
