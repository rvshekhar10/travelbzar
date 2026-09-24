'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function OwnerLoginPage() {
  const router = useRouter();
  const { user, role, login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as owner, redirect directly
  React.useEffect(() => {
    if (user && role === 'owner') {
      router.replace('/owner');
    }
  }, [user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        router.replace('/owner');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOwnerLogin = () => {
    demoLogin('owner');
    router.replace('/owner');
  };

  return (
    <div className="min-h-screen bg-[#041224] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow styling */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-4">
        <div className="flex justify-center">
          <TravelBzarLogo size="lg" variant="light" showTagline={false} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 text-xs font-black uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Restricted Executive Portal</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Owner Command Center
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Private administrative access for fleet control, tariff adjustments, and chauffeur assignments.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#061B33] py-8 px-6 sm:px-10 rounded-3xl border-2 border-slate-700/80 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Owner Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@travelbzar.com"
                  className="w-full bg-[#0B223D] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B223D] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Access for Verified Owner */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 mb-2">Development / Fast Access</div>
            <button
              type="button"
              onClick={handleDemoOwnerLogin}
              className="w-full flex items-center justify-center gap-2 bg-[#0B223D] hover:bg-[#122F54] border border-slate-700 text-amber-400 font-bold text-xs py-2.5 rounded-xl transition-all active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>1-Click Sign In as Owner (owner@travelbzar.com)</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Travel BZAR Operations Console • Confirmed Access Only
        </div>
      </div>
    </div>
  );
}
