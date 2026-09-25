'use client';

import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { Vehicle, VehicleStatus, VehicleAvailabilitySchedule } from '@/types';
import {
  Car,
  Plus,
  AlertCircle,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OwnerVehiclesPage() {
  const { vehicles, loading, addOrUpdateVehicle, removeVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const [showModal, setShowModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('Venue SX');
  const [variant, setVariant] = useState('Turbo Petrol');
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('Polar White');
  const [year, setYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState('Premium Compact SUV');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');

  // Schedule states
  const [is24x7, setIs24x7] = useState(true);
  const [dailyStartTime, setDailyStartTime] = useState('06:00');
  const [dailyEndTime, setDailyEndTime] = useState('23:00');
  const [availableDays, setAvailableDays] = useState<string[]>(ALL_DAYS);
  const [scheduleNotes, setScheduleNotes] = useState('Stationed at Dhanbad Base, available for local & airport transfers');

  const openAddModal = () => {
    setEditingVehicleId(null);
    setMake('Hyundai');
    setModel('Venue SX');
    setVariant('Turbo Petrol');
    setRegNo('');
    setColor('Polar White');
    setYear(2024);
    setVehicleType('Premium Compact SUV');
    setStatus('AVAILABLE');
    setIs24x7(true);
    setDailyStartTime('06:00');
    setDailyEndTime('23:00');
    setAvailableDays(ALL_DAYS);
    setScheduleNotes('Stationed at Dhanbad Base, available for local & airport transfers');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicleId(veh.id);
    setMake(veh.make);
    setModel(veh.model);
    setVariant(veh.variant || '');
    setRegNo(veh.registrationNumber);
    setColor(veh.color);
    setYear(veh.year);
    setVehicleType(veh.vehicleType);
    setStatus(veh.status);
    setIs24x7(veh.availabilitySchedule?.is24x7 ?? true);
    setDailyStartTime(veh.availabilitySchedule?.dailyStartTime || '06:00');
    setDailyEndTime(veh.availabilitySchedule?.dailyEndTime || '23:00');
    setAvailableDays(veh.availabilitySchedule?.availableDays || ALL_DAYS);
    setScheduleNotes(veh.availabilitySchedule?.notes || '');
    setError(null);
    setShowModal(true);
  };

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const schedule: VehicleAvailabilitySchedule = {
      is24x7,
      dailyStartTime: is24x7 ? undefined : dailyStartTime,
      dailyEndTime: is24x7 ? undefined : dailyEndTime,
      availableDays: is24x7 ? ALL_DAYS : availableDays,
      notes: scheduleNotes.trim(),
    };

    const targetVehicle: Vehicle = {
      id: editingVehicleId || `veh-${Date.now()}`,
      registrationNumber: regNo.toUpperCase().trim(),
      make: make.trim(),
      model: model.trim(),
      variant: variant.trim(),
      color: color.trim(),
      vehicleType: vehicleType.trim(),
      year,
      status,
      availabilitySchedule: schedule,
      currentDriverId: editingVehicleId ? vehicles.find((v) => v.id === editingVehicleId)?.currentDriverId : undefined,
      createdAt: editingVehicleId ? (vehicles.find((v) => v.id === editingVehicleId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await addOrUpdateVehicle(targetVehicle);
    setSaving(false);

    if (!res.success) {
      setError(res.error || 'Failed to save vehicle.');
    } else {
      setShowModal(false);
    }
  };

  const currentVehicle = vehicles[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            Single-Cab Fleet Operations (Tier 1 Architecture)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Fleet & Vehicle Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your 1 dedicated primary cab and its operating availability schedule in Firestore.
          </p>
        </div>

        {vehicles.length === 0 && !loading && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Primary Vehicle (0/1)</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#078A32]" />
          <span>Synchronizing fleet data from Firestore...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-xs text-amber-900 space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>No Fleet Vehicle Registered (0 of 1 Active Vehicles)</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-xs">
            There are currently no vehicles configured in Firebase Firestore. Before rides can be booked by customers or dispatched to chauffeurs, you must register your 1 primary fleet vehicle along with its availability schedule.
          </p>
          <button
            onClick={openAddModal}
            className="bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black px-5 py-3 rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Primary Vehicle & Schedule Now →</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#078A32] shrink-0" />
              <span>
                Dedicated Primary Cab is registered (<strong>1 of 1</strong> active capacity). Only this vehicle will be displayed to riders across all booking channels.
              </span>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#078A32] text-white px-2.5 py-1 rounded-full shrink-0">
              Fleet Active (1/1)
            </span>
          </div>

          {/* Active Vehicle Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  <Car className="w-8 h-8 text-[#42B900]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#078A32] block">
                    Verified Fleet Cab
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {currentVehicle.make} {currentVehicle.model} {currentVehicle.variant ? `(${currentVehicle.variant})` : ''}
                  </h2>
                  <div className="font-mono text-sm font-black text-slate-700 mt-0.5">
                    {currentVehicle.registrationNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <select
                  value={currentVehicle.status}
                  onChange={(e) =>
                    addOrUpdateVehicle({ ...currentVehicle, status: e.target.value as VehicleStatus })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-slate-800"
                >
                  <option value="AVAILABLE">AVAILABLE (Active)</option>
                  <option value="IN_SERVICE">IN SERVICE (On Trip)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Offline)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>

                <button
                  onClick={() => openEditModal(currentVehicle)}
                  className="p-2 text-slate-600 hover:text-[#078A32] transition-colors rounded-xl border border-slate-200 hover:border-emerald-300"
                  title="Edit Vehicle & Schedule"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Delete this vehicle from Firestore? The chauffeur assignment will be cleared.')) {
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

            {/* Vehicle Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                  <Link href="/owner/drivers" className="font-bold text-amber-600 hover:underline block">
                    + Assign Chauffeur →
                  </Link>
                )}
              </div>
            </div>

            {/* Operating Availability Schedule Section */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#078A32]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Live Operating Availability Schedule
                  </h3>
                </div>
                <button
                  onClick={() => openEditModal(currentVehicle)}
                  className="text-[11px] font-bold text-[#078A32] hover:underline"
                >
                  Adjust Schedule →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Operating Hours
                  </span>
                  {currentVehicle.availabilitySchedule?.is24x7 ? (
                    <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                      24/7 Round the Clock
                    </span>
                  ) : (
                    <span className="font-black text-slate-900">
                      {currentVehicle.availabilitySchedule?.dailyStartTime || '06:00'} —{' '}
                      {currentVehicle.availabilitySchedule?.dailyEndTime || '23:00'} IST
                    </span>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Operating Days
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ALL_DAYS.map((d) => {
                      const isActive =
                        currentVehicle.availabilitySchedule?.is24x7 ||
                        currentVehicle.availabilitySchedule?.availableDays?.includes(d);
                      return (
                        <span
                          key={d}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-[#078A32] text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Operating Base & Notes
                  </span>
                  <p className="text-slate-700 text-[11px] font-medium line-clamp-2">
                    {currentVehicle.availabilitySchedule?.notes || 'Stationed at Dhanbad Base'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div>
              <span className="text-[10px] font-black uppercase text-[#078A32] tracking-wider">
                {editingVehicleId ? 'Update Vehicle' : 'Fleet Registration (1/1)'}
              </span>
              <h3 className="text-lg font-black text-[#061B33]">
                {editingVehicleId ? 'Edit Primary Cab & Schedule' : 'Register Primary Fleet Cab'}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Saved directly into Firebase Firestore. Only this vehicle will be active and visible to riders.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JH-10-BX-1001"
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
                  <label className="font-bold text-slate-700 block mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Venue SX"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Variant / Engine</label>
                  <input
                    type="text"
                    placeholder="e.g. Turbo Petrol"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Class</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
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
                  <label className="font-bold text-slate-700 block mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Availability Schedule Sub-section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 block">Availability Schedule</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={is24x7}
                      onChange={(e) => setIs24x7(e.target.checked)}
                      className="rounded text-[#078A32] focus:ring-[#078A32] w-4 h-4"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">24/7 Round the Clock</span>
                  </label>
                </div>

                {!is24x7 && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Daily Start (IST)</label>
                        <input
                          type="time"
                          value={dailyStartTime}
                          onChange={(e) => setDailyStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Daily End (IST)</label>
                        <input
                          type="time"
                          value={dailyEndTime}
                          onChange={(e) => setDailyEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Operating Days</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DAYS.map((d) => {
                          const isSelected = availableDays.includes(d);
                          return (
                            <button
                              type="button"
                              key={d}
                              onClick={() => toggleDay(d)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                isSelected
                                  ? 'bg-[#078A32] text-white border-[#078A32]'
                                  : 'bg-white text-slate-600 border-slate-300'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Schedule Notes / Operating Base</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanbad Base, available daily"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingVehicleId ? 'Update Fleet Cab' : 'Save Primary Cab'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
