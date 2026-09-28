'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { checkAndTriggerComplianceAlerts } from '@/services/complianceService';
import { OwnerSidebar } from '@/components/common/OwnerSidebar';
import { OwnerTopBar } from '@/components/common/OwnerTopBar';
import { OwnerPWAInstallPrompt } from '@/components/common/OwnerPWAInstallPrompt';
import { ForcedInsuranceAlertModal } from '@/components/owner/ForcedInsuranceAlertModal';
import { ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { vehicles, addOrUpdateVehicle } = useVehicles();
  const { drivers } = useDrivers();

  const isLoginPage = pathname === '/owner/login';

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.replace('/owner/login');
      } else if (role !== 'owner') {
        router.replace('/customer');
      }
    }
  }, [user, role, loading, router, isLoginPage]);

  // Periodic and reactive compliance check for insurance & driver authorization
  useEffect(() => {
    if (user && role === 'owner' && vehicles.length > 0) {
      checkAndTriggerComplianceAlerts(vehicles, drivers, user.id);
    }
  }, [user, role, vehicles, drivers]);

  const handleUpdateVehicleInsurance = useCallback(
    async (
      vehicleId: string,
      newPolicyNumber: string,
      newInsurer: string,
      newExpiryDate: string
    ) => {
      const veh = vehicles.find((v) => v.id === vehicleId);
      if (!veh) return { success: false, error: 'Vehicle not found' };
      const updated = {
        ...veh,
        insurance: {
          ...veh.insurance,
          policyNumber: newPolicyNumber,
          insurerName: newInsurer,
          expiryDate: newExpiryDate,
          reminderSent30Days: false,
          forcedReminderSent10Days: false,
        },
        updatedAt: new Date().toISOString(),
      };
      return await addOrUpdateVehicle(updated);
    },
    [vehicles, addOrUpdateVehicle]
  );

  // If on secret login page, render clean without layout shell
  if (isLoginPage) {
    return (
      <>
        <link rel="manifest" href="/owner-manifest.json" />
        {children}
        <OwnerPWAInstallPrompt />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#078A32] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Verifying Owner Credentials...</span>
      </div>
    );
  }

  if (!user || role !== 'owner') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-[#061B33]">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Owner Command Center requires private administrative authorization.
        </p>
        <Link
          href="/owner/login"
          className="bg-[#061B33] hover:bg-[#0B223D] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          Sign In to Owner Portal
        </Link>
      </div>
    );
  }

  return (
    <>
      <link rel="manifest" href="/owner-manifest.json" />
      <div className="min-h-screen bg-[#F5F7F5] flex flex-col">
        <OwnerTopBar />
        <div className="flex flex-1 overflow-hidden">
          <OwnerSidebar />
          <div className="flex-1 bg-[#F5F7F5] overflow-y-auto">{children}</div>
        </div>
      </div>
      <ForcedInsuranceAlertModal
        vehicles={vehicles}
        onUpdateVehicleInsurance={handleUpdateVehicleInsurance}
      />
      <OwnerPWAInstallPrompt />
    </>
  );
}
