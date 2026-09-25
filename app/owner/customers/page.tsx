'use client';

import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { provisionUserAccount } from '@/lib/firebase/provisioning';
import { AppUser } from '@/types';
import {
  Users,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  UserCheck,
  Calendar,
} from 'lucide-react';

export default function OwnerCustomersPage() {
  const { users, loading, refresh, removeUser } = useUsers('customer');

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddCustomer = async (e: React.FormEvent) => {
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
        role: 'customer',
      });

      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create customer account.');
        return;
      }

      await refresh();
      setSuccessMsg(
        `Customer account successfully provisioned for ${name}! Login email: ${email.toLowerCase()}`
      );
      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Error provisioning customer account.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            User & Customer Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner-managed customer accounts stored in Firebase Auth & Firestore.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Customer</span>
        </button>
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

      {/* Customers List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#078A32]" />
          <span>Loading customer accounts from Firestore...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800">No Customers Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no pre-fed customer accounts. As the owner, you can provision customer accounts here in Firebase.
          </p>
          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="bg-[#078A32] hover:bg-[#056B27] text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md mt-2"
          >
            + Provision First Customer Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 relative"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  UID: {c.id.slice(0, 10)}...
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {c.status}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Remove customer account ${c.name} from Firestore?`)) {
                        removeUser(c.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    title="Remove Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {(c?.name || 'Rider')
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'RD'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{c?.name || 'Customer Rider'}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#078A32]" />
                    <span>{c?.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-fade-in my-8">
            <div>
              <h3 className="text-lg font-black text-[#061B33]">Provision Customer Account</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Creates the customer login directly in Firebase Auth and adds their profile to Firestore.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Sharma"
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
                    placeholder="+91 9431100000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address (Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Customer Portal Password
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
