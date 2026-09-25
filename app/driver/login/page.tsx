'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { TravelBzarLogo } from '@/components/common/TravelBzarLogo';
import { DriverPWAInstallPrompt } from '@/components/common/DriverPWAInstallPrompt';
import { Car, Lock, Mail, AlertCircle, ArrowRight, Loader2, Sparkles, Navigation } from 'lucide-react';

export default function DriverLoginPage() {
  const router = useRouter();
  const { user, role, login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as driver, redirect to driver console
  useEffect(() => {
    if (user && (role === 'driver' || role === 'owner')) {
      router.replace('/driver');
    }
  }, [user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check driver email or password.');
      } else {
        router.replace('/driver');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoDriverLogin = () => {
    demoLogin('driver');
    router.replace('/driver');
  };

  return (
    <div className="min-h-screen bg-[#041224] text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow styling */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-3">
        <div className="flex justify-center mb-1">
          <TravelBzarLogo size="md" variant="light" showTagline={false} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-[#42B900] border border-emerald-500/40 text-xs font-black uppercase tracking-widest">
          <Car className="w-3.5 h-3.5" />
          <span>Chauffeur Mobile Portal</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Driver Duty Console
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Sign in to access your next assigned trip, live GPS dispatch, customer navigation, and fare collection.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#061B33] py-7 px-6 sm:px-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Driver Email / Mobile
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@travelbzar.com"
                  className="w-full bg-[#0B223D] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#42B900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Duty Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B223D] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#42B900]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black text-xs sm:text-sm py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Go On Duty</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Driver Sign In for Testing */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 mb-2">1-Click Evaluation Sign In</div>
            <button
              type="button"
              onClick={handleDemoDriverLogin}
              className="w-full flex items-center justify-center gap-2 bg-[#0B223D] hover:bg-[#122F54] border border-slate-700 text-[#42B900] font-bold text-xs py-2.5 rounded-xl transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Sign In as Rajesh Chauffeur (driver@travelbzar.com)</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-5 text-xs text-slate-500">
          Travel BZAR Chauffeur Network • Dhanbad, Jharkhand
        </div>
      </div>

      <DriverPWAInstallPrompt />
    </div>
  );
}
