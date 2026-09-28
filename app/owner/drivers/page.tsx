'use client';

import React, { useState } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { provisionUserAccount } from '@/lib/firebase/provisioning';
import { Driver, DriverStatus } from '@/types';
import {
  getDriverAuthorizationStatus,
  calculateAuthorizationExpiry,
} from '@/services/complianceService';
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
  Calendar,
  Clock,
  RefreshCw,
  Edit2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerDriversPage() {
  const { drivers, loading, refresh, removeDriver, addOrUpdateDriver } = useDrivers();
  const { vehicles } = useVehicles();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [renewingDriver, setRenewingDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Add Chauffeur
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('driver123');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2030-12-31');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  // Authorization states for Add Chauffeur
  const todayStr = new Date().toISOString().split('T')[0];
  const [authStartDate, setAuthStartDate] = useState(todayStr);
  const [authDurationMonths, setAuthDurationMonths] = useState<number>(3);
  const [authExpiryDate, setAuthExpiryDate] = useState(() =>
    calculateAuthorizationExpiry(todayStr, 3)
  );
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [customVehicleNumber, setCustomVehicleNumber] = useState('');

  // Renewal form states
  const [renewalMonths, setRenewalMonths] = useState<number>(3);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalVehicles, setRenewalVehicles] = useState<string[]>([]);
  const [renewalCustomVehicle, setRenewalCustomVehicle] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editLicenseExpiry, setEditLicenseExpiry] = useState('');
  const [editStatus, setEditStatus] = useState<DriverStatus>('ACTIVE');
  const [editAuthStart, setEditAuthStart] = useState('');
  const [editAuthExpiry, setEditAuthExpiry] = useState('');
  const [editVehicles, setEditVehicles] = useState<string[]>([]);
  const [editCustomVehicle, setEditCustomVehicle] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const primaryVehicle = vehicles[0];

  // Duration preset change for Add modal
  const handleDurationPresetChange = (months: number) => {
    setAuthDurationMonths(months);
    setAuthExpiryDate(calculateAuthorizationExpiry(authStartDate, months));
  };

  // Open Add modal with default vehicle selected
  const handleOpenAddModal = () => {
    setErrorMsg(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('driver123');
    setLicenseNumber('');
    setLicenseExpiry('2030-12-31');
    setAuthStartDate(todayStr);
    setAuthDurationMonths(3);
    setAuthExpiryDate(calculateAuthorizationExpiry(todayStr, 3));
    if (primaryVehicle) {
      setAssignedVehicleId(primaryVehicle.id);
      setSelectedVehicles([primaryVehicle.registrationNumber]);
    } else {
      setAssignedVehicleId('');
      setSelectedVehicles([]);
    }
    setCustomVehicleNumber('');
    setShowAddModal(true);
  };

  // Open Renewal modal
  const handleOpenRenewalModal = (driver: Driver) => {
    setErrorMsg(null);
    setRenewingDriver(driver);
    setRenewalMonths(3);
    // Base renewal expiry from current expiry if valid or from today
    const baseDate = driver.authorizationExpiryDate && new Date(driver.authorizationExpiryDate) > new Date()
      ? driver.authorizationExpiryDate
      : todayStr;
    setRenewalExpiryDate(calculateAuthorizationExpiry(baseDate, 3));
    setRenewalVehicles(
      driver.authorizedVehicleNumbers && driver.authorizedVehicleNumbers.length > 0
        ? [...driver.authorizedVehicleNumbers]
        : primaryVehicle
        ? [primaryVehicle.registrationNumber]
        : []
    );
    setRenewalCustomVehicle('');
    setRenewalNotes('');
  };

  // Open Edit modal
  const handleOpenEditModal = (driver: Driver) => {
    setErrorMsg(null);
    setEditingDriver(driver);
    setEditName(driver.name);
    setEditPhone(driver.phone);
    setEditLicense(driver.licenseNumber);
    setEditLicenseExpiry(driver.licenseExpiry);
    setEditStatus(driver.status);
    setEditAuthStart(driver.authorizationStartDate || todayStr);
    setEditAuthExpiry(driver.authorizationExpiryDate || calculateAuthorizationExpiry(todayStr, 3));
    setEditVehicles(
      driver.authorizedVehicleNumbers && driver.authorizedVehicleNumbers.length > 0
        ? [...driver.authorizedVehicleNumbers]
        : primaryVehicle
        ? [primaryVehicle.registrationNumber]
        : []
    );
    setEditCustomVehicle('');
  };

  // Submit Add Chauffeur
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const finalVehicles = [...selectedVehicles];
      if (customVehicleNumber.trim()) {
        const customPlate = customVehicleNumber.trim().toUpperCase();
        if (!finalVehicles.includes(customPlate)) {
          finalVehicles.push(customPlate);
        }
      }

      // Map vehicle registration numbers to vehicle IDs if possible
      const authorizedIds = vehicles
        .filter((v) => finalVehicles.includes(v.registrationNumber))
        .map((v) => v.id);

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
          authorizationStartDate: authStartDate,
          authorizationExpiryDate: authExpiryDate,
          authorizationDurationMonths: authDurationMonths,
          authorizedVehicleIds: authorizedIds,
          authorizedVehicleNumbers: finalVehicles,
        },
      });

      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create driver account.');
        return;
      }

      await refresh();
      setSuccessMsg(
        `Chauffeur account successfully provisioned for ${name}! Authorized until ${authExpiryDate} for vehicles: ${finalVehicles.join(', ') || 'N/A'}`
      );
      setShowAddModal(false);
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Error provisioning chauffeur account.');
    }
  };

  // Submit Renewal
  const handleRenewAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingDriver) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const finalVehicles = [...renewalVehicles];
      if (renewalCustomVehicle.trim()) {
        const customPlate = renewalCustomVehicle.trim().toUpperCase();
        if (!finalVehicles.includes(customPlate)) {
          finalVehicles.push(customPlate);
        }
      }

      const authorizedIds = vehicles
        .filter((v) => finalVehicles.includes(v.registrationNumber))
        .map((v) => v.id);

      const renewalHistoryItem = {
        renewedAt: new Date().toISOString(),
        renewedBy: 'owner',
        validFrom: renewingDriver.authorizationExpiryDate || todayStr,
        validUntil: renewalExpiryDate,
        durationMonths: renewalMonths,
        authorizedVehicleNumbers: finalVehicles,
        notes: renewalNotes.trim() || `Renewed for ${renewalMonths} month(s) by Owner`,
      };

      const existingHistory = renewingDriver.authorizationHistory || [];

      const updatedDriver: Driver = {
        ...renewingDriver,
        authorizationStartDate: renewingDriver.authorizationStartDate || todayStr,
        authorizationExpiryDate: renewalExpiryDate,
        authorizationDurationMonths: renewalMonths,
        authorizedVehicleIds: authorizedIds,
        authorizedVehicleNumbers: finalVehicles,
        authorizationHistory: [renewalHistoryItem, ...existingHistory],
      };

      await addOrUpdateDriver(updatedDriver);
      setSubmitting(false);
      setSuccessMsg(`Chauffeur ${renewingDriver.name}'s authorization renewed until ${renewalExpiryDate}!`);
      setRenewingDriver(null);
      await refresh();
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to renew driver authorization.');
    }
  };

  // Submit Edit Chauffeur
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const finalVehicles = [...editVehicles];
      if (editCustomVehicle.trim()) {
        const customPlate = editCustomVehicle.trim().toUpperCase();
        if (!finalVehicles.includes(customPlate)) {
          finalVehicles.push(customPlate);
        }
      }

      const authorizedIds = vehicles
        .filter((v) => finalVehicles.includes(v.registrationNumber))
        .map((v) => v.id);

      const updatedDriver: Driver = {
        ...editingDriver,
        name: editName.trim(),
        phone: editPhone.trim(),
        licenseNumber: editLicense.trim().toUpperCase(),
        licenseExpiry: editLicenseExpiry,
        status: editStatus,
        authorizationStartDate: editAuthStart,
        authorizationExpiryDate: editAuthExpiry,
        authorizedVehicleIds: authorizedIds,
        authorizedVehicleNumbers: finalVehicles,
      };

      await addOrUpdateDriver(updatedDriver);
      setSubmitting(false);
      setSuccessMsg(`Updated records & authorization for chauffeur ${editName}!`);
      setEditingDriver(null);
      await refresh();
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update chauffeur details.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            Human Resources & Chauffeur Fleet
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Chauffeurs & Authorizations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set driver authorization dates, manage periodic renewal cycles, and certify authorized vehicle numbers.
          </p>
        </div>

        {primaryVehicle ? (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chauffeur & Set Authorization</span>
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
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
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
            Add a chauffeur to set their authorization duration, specify which car(s) they are permitted to drive, and provision their credentials.
          </p>
          {primaryVehicle && (
            <button
              onClick={handleOpenAddModal}
              className="bg-[#078A32] hover:bg-[#056B27] text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md mt-2 cursor-pointer"
            >
              + Provision First Chauffeur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((d) => {
            const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);
            const authStatus = getDriverAuthorizationStatus(d);
            const authorizedVehList = d.authorizedVehicleNumbers && d.authorizedVehicleNumbers.length > 0
              ? d.authorizedVehicleNumbers
              : assignedVeh
              ? [assignedVeh.registrationNumber]
              : [];

            return (
              <div
                key={d.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 relative ${
                  authStatus.isExpired
                    ? 'border-rose-300 ring-2 ring-rose-200'
                    : authStatus.isExpiringSoon
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row */}
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
                      onClick={() => handleOpenEditModal(d)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                      title="Edit Chauffeur Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove chauffeur ${d.name} from Firestore?`)) {
                          removeDriver(d.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                      title="Remove Chauffeur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Driver basic profile */}
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
                      Commercial DL: <span className="font-mono font-bold text-slate-600">{d?.licenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* DRIVER AUTHORIZATION CARD */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                    authStatus.isExpired
                      ? 'bg-rose-50 border-rose-200'
                      : authStatus.isExpiringSoon
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-900">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          authStatus.isExpired
                            ? 'text-rose-600'
                            : authStatus.isExpiringSoon
                            ? 'text-amber-600'
                            : 'text-[#078A32]'
                        }`}
                      />
                      <span>Driver Authorization Status</span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${authStatus.colorClass}`}
                    >
                      {authStatus.status === 'EXPIRED'
                        ? 'EXPIRED'
                        : authStatus.status === 'EXPIRING_SOON'
                        ? 'RENEWAL DUE'
                        : authStatus.status === 'VALID'
                        ? 'AUTHORIZED'
                        : 'PENDING'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Valid Until:</span>
                      <strong className="text-slate-900 font-bold">
                        {d.authorizationExpiryDate || 'Not configured'}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block">Remaining:</span>
                      <strong
                        className={`font-black ${
                          authStatus.isExpired
                            ? 'text-rose-600'
                            : authStatus.isExpiringSoon
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {authStatus.label}
                      </strong>
                    </div>
                  </div>

                  {/* Renew Button */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Cycle: {d.authorizationDurationMonths || 3} months renewal
                    </span>
                    <button
                      onClick={() => handleOpenRenewalModal(d)}
                      className="flex items-center gap-1 text-[11px] font-black text-white bg-[#061B33] hover:bg-[#0B223D] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-[#42B900]" />
                      <span>Renew Authorization</span>
                    </button>
                  </div>
                </div>

                {/* AUTHORIZED FOR VEHICLES SECTION */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-[#078A32]" />
                      <span>Authorised For Cars / Vehicle No:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {authorizedVehList.length} Vehicle(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {authorizedVehList.length > 0 ? (
                      authorizedVehList.map((plate) => (
                        <span
                          key={plate}
                          className="bg-white border border-slate-300 text-slate-800 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg shadow-2xs inline-flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#078A32]" />
                          <span>{plate}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        No specific vehicle authorized yet
                      </span>
                    )}
                  </div>
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

      {/* ==================================================== */}
      {/* 1. ADD CHAUFFEUR MODAL */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div>
              <span className="text-[10px] font-black uppercase text-[#078A32] tracking-wider">
                Chauffeur Onboarding
              </span>
              <h3 className="text-lg font-black text-[#061B33]">Add Chauffeur & Set Authorization</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Sets the authorization validity period, authorized cars, and provisions login credentials.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-3.5">
              {/* Profile fields */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chauffeur Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Mahato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#078A32] focus:outline-hidden"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login Email</label>
                  <input
                    type="email"
                    required
                    placeholder="driver@travelbzar.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DL Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* AUTHORIZATION DATES & RENEWAL PERIOD SECTION */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 space-y-3">
                <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#078A32]" />
                  <span>Driver Authorization Period & Renewal</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Each driver is authorized to drive for a set time (e.g. 1, 3, or 6 months), after which the owner must renew authorization.
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    Authorization Duration:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => handleDurationPresetChange(m)}
                        className={`py-1.5 px-2 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                          authDurationMonths === m
                            ? 'bg-[#078A32] text-white border-[#078A32] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {m === 12 ? '1 Year' : `${m} Month${m > 1 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Authorization Start Date</label>
                    <input
                      type="date"
                      required
                      value={authStartDate}
                      onChange={(e) => {
                        setAuthStartDate(e.target.value);
                        setAuthExpiryDate(calculateAuthorizationExpiry(e.target.value, authDurationMonths));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Expires / Renewal Date</label>
                    <input
                      type="date"
                      required
                      value={authExpiryDate}
                      onChange={(e) => setAuthExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-[#078A32]"
                    />
                  </div>
                </div>
              </div>

              {/* AUTHORIZED VEHICLES SECTION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-[#078A32]" />
                    <span>Authorised for Cars / Vehicle No.</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Select all allowed cabs</span>
                </div>

                <div className="space-y-1.5">
                  {vehicles.map((v) => {
                    const isChecked = selectedVehicles.includes(v.registrationNumber);
                    return (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVehicles([...selectedVehicles, v.registrationNumber]);
                              setAssignedVehicleId(v.id);
                            } else {
                              setSelectedVehicles(selectedVehicles.filter((reg) => reg !== v.registrationNumber));
                            }
                          }}
                          className="rounded text-[#078A32] focus:ring-[#078A32] w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 block text-xs">
                            {v.make} {v.model}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{v.registrationNumber}</span>
                        </div>
                        {v.registrationNumber === primaryVehicle?.registrationNumber && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Add Custom Vehicle Plate (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JH-10-BX-9999"
                    value={customVehicleNumber}
                    onChange={(e) => setCustomVehicleNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono uppercase bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Provision & Authorize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. RENEW AUTHORIZATION MODAL */}
      {/* ==================================================== */}
      {renewingDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-[#078A32] tracking-wider">
                Periodic Authorization Renewal
              </span>
              <h3 className="text-lg font-black text-[#061B33]">
                Renew Authorization: {renewingDriver.name}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Current authorization valid until:{' '}
                <strong className="text-slate-900">{renewingDriver.authorizationExpiryDate || 'Unset'}</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRenewAuthorization} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Select Renewal Duration:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => {
                    const baseDate =
                      renewingDriver.authorizationExpiryDate &&
                      new Date(renewingDriver.authorizationExpiryDate) > new Date()
                        ? renewingDriver.authorizationExpiryDate
                        : todayStr;
                    const calculated = calculateAuthorizationExpiry(baseDate, m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => {
                          setRenewalMonths(m);
                          setRenewalExpiryDate(calculated);
                        }}
                        className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                          renewalMonths === m
                            ? 'bg-[#078A32] text-white border-[#078A32] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        +{m === 12 ? '1 Year' : `${m} Month${m > 1 ? 's' : ''}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  New Authorization Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={renewalExpiryDate}
                  onChange={(e) => setRenewalExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-[#078A32]"
                />
              </div>

              {/* Authorized Cars selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Authorised for Cars / Vehicle No.:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {vehicles.map((v) => {
                    const isChecked = renewalVehicles.includes(v.registrationNumber);
                    return (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRenewalVehicles([...renewalVehicles, v.registrationNumber]);
                            } else {
                              setRenewalVehicles(
                                renewalVehicles.filter((reg) => reg !== v.registrationNumber)
                              );
                            }
                          }}
                          className="rounded text-[#078A32] focus:ring-[#078A32] w-4 h-4"
                        />
                        <span className="font-bold text-slate-800 text-xs">
                          {v.make} {v.model} ({v.registrationNumber})
                        </span>
                      </label>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="+ Add vehicle plate (e.g. JH-10-BX-1234)"
                  value={renewalCustomVehicle}
                  onChange={(e) => setRenewalCustomVehicle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono uppercase text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Renewal Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bi-annual safety check & driving verification completed"
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenewingDriver(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Authorization Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. EDIT CHAUFFEUR & AUTHORIZATION MODAL */}
      {/* ==================================================== */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-[#078A32] tracking-wider">
                Chauffeur Profile
              </span>
              <h3 className="text-lg font-black text-[#061B33]">
                Edit Chauffeur & Authorization Details
              </h3>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chauffeur Duty Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as DriverStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Commercial DL No.</label>
                  <input
                    type="text"
                    required
                    value={editLicense}
                    onChange={(e) => setEditLicense(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DL Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={editLicenseExpiry}
                    onChange={(e) => setEditLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block text-xs">
                  Authorization Dates
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Authorized From</label>
                    <input
                      type="date"
                      value={editAuthStart}
                      onChange={(e) => setEditAuthStart(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Authorized Until</label>
                    <input
                      type="date"
                      value={editAuthExpiry}
                      onChange={(e) => setEditAuthExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-[#078A32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Authorized for Cars / Vehicle No.
                  </label>
                  <div className="space-y-1 max-h-28 overflow-y-auto mb-2">
                    {vehicles.map((v) => {
                      const isChecked = editVehicles.includes(v.registrationNumber);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditVehicles([...editVehicles, v.registrationNumber]);
                              } else {
                                setEditVehicles(
                                  editVehicles.filter((reg) => reg !== v.registrationNumber)
                                );
                              }
                            }}
                            className="rounded text-[#078A32] w-4 h-4"
                          />
                          <span className="font-bold text-slate-800 text-xs">
                            {v.make} {v.model} ({v.registrationNumber})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="+ Add custom vehicle plate"
                    value={editCustomVehicle}
                    onChange={(e) => setEditCustomVehicle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono uppercase bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
