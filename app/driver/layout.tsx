'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { Car, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login?redirect=/driver');
      } else if (role !== 'driver' && role !== 'owner') {
        router.replace('/customer');
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#42B900] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Authenticating Chauffeur Duty...</span>
      </div>
    );
  }

  if (!user || (role !== 'driver' && role !== 'owner')) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#078A32] flex items-center justify-center shadow-xs">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-[#061B33]">Chauffeur Portal Protected</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          This portal is reserved for verified Travel BZAR chauffeurs and drivers. Please sign in with your driver credentials.
        </p>
        <Link
          href="/login?redirect=/driver"
          className="bg-[#078A32] hover:bg-[#056B27] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          Sign In as Driver
        </Link>
      </div>
    );
  }

  return <div className="min-h-[calc(100vh-5rem)] bg-[#F5F7F5]">{children}</div>;
}
