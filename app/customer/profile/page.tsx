'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { User, Phone, Mail, CheckCircle2, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading, updateUserProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateUserProfile({ name, phone });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  // Unauthenticated / Guest state
  if (!user) {
    return (
      <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">Account</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">My Profile</h1>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8 text-[#078A32]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#061B33]">You are not signed in</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Sign in to manage your customer account, update phone number, and access your booking receipts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login?redirect=/customer/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register?redirect=/customer/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-6 py-3 rounded-xl transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">Account</span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">My Profile</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#061B33]">{user?.name || 'Customer'}</h2>
            <div className="text-xs text-slate-500">{user?.email}</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#078A32] bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Customer</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {saved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold py-3 rounded-xl shadow-md transition-all text-xs"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Travel BZAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
