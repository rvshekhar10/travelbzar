'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { User, Car, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = (selectedRole: UserRole) => {
    demoLogin(selectedRole);
    if (selectedRole === 'customer') router.push('/customer');
    if (selectedRole === 'driver') router.push('/driver');
    if (selectedRole === 'owner') router.push('/owner');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (email.toLowerCase().includes('driver')) {
        router.push('/driver');
      } else if (email.toLowerCase().includes('owner')) {
        router.push('/owner');
      } else {
        router.push('/customer');
      }
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <TravelBzarLogo size="md" variant="dark" showTagline={false} clickable={false} />
          </div>
          <h2 className="text-2xl font-black text-[#061B33]">Welcome to Travel BZAR</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your cab portal</p>
        </div>

        {/* 1-Click Persona Login Boxes for Instant POC Evaluation */}
        <div className="bg-gradient-to-br from-[#061B33] to-[#0B223D] text-white p-5 rounded-2xl border border-slate-700 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#42B900]">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Demo Evaluation Sign In</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Instant test access for all three role-based portals:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemo('customer')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#122B4D] hover:bg-[#183864] border border-slate-600 transition-all text-center active:scale-95"
            >
              <User className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Customer</span>
              <span className="text-[9px] text-slate-400">Book & Track</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('driver')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#122B4D] hover:bg-[#183864] border border-slate-600 transition-all text-center active:scale-95"
            >
              <Car className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Driver</span>
              <span className="text-[9px] text-slate-400">Live Trip</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('owner')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#122B4D] hover:bg-[#183864] border border-slate-600 transition-all text-center active:scale-95"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Owner</span>
              <span className="text-[9px] text-slate-400">Fleet & Rates</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#078A32] font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don’t have an account?{' '}
            <Link href="/register" className="text-[#078A32] font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
