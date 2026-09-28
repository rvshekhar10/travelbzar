import { Driver, Vehicle, VehicleInsurance, VehiclePermit, InAppNotification } from '@/types';
import { addNotification, getNotifications } from '@/lib/firebase/store';

export interface DriverAuthInfo {
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNSET';
  daysRemaining: number;
  label: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
  colorClass: string;
}

export interface InsuranceStatusInfo {
  status: 'VALID' | 'EXPIRING_30_DAYS' | 'CRITICAL_10_DAYS' | 'EXPIRED' | 'UNSET';
  daysRemaining: number;
  isUrgent: boolean;
  isExpiring30Days: boolean;
  label: string;
  colorClass: string;
  badgeText: string;
}

/**
 * Calculates a new expiry date given a start date string (YYYY-MM-DD) and duration in months.
 */
export function calculateAuthorizationExpiry(startDateStr: string, durationMonths: number): string {
  const base = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(base.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  const result = new Date(base);
  result.setMonth(result.getMonth() + durationMonths);
  return result.toISOString().split('T')[0];
}

/**
 * Evaluates driver authorization validity, duration, and expiration countdown.
 */
export function getDriverAuthorizationStatus(driver: Driver): DriverAuthInfo {
  if (!driver.authorizationExpiryDate) {
    return {
      status: 'UNSET',
      daysRemaining: 0,
      label: 'Authorization Date Not Set',
      isExpiringSoon: false,
      isExpired: false,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(driver.authorizationExpiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining,
      label: `Authorization Expired (${Math.abs(daysRemaining)} days ago)`,
      isExpiringSoon: false,
      isExpired: true,
      colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }

  if (daysRemaining <= 15) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining,
      label: `Expires in ${daysRemaining === 0 ? 'Today' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`} (Renewal Due)`,
      isExpiringSoon: true,
      isExpired: false,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }

  return {
    status: 'VALID',
    daysRemaining,
    label: `Authorized (${daysRemaining} days remaining)`,
    isExpiringSoon: false,
    isExpired: false,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
}

/**
 * Checks if a driver is authorized for a specific vehicle by ID or registration plate.
 */
export function isDriverAuthorizedForVehicle(driver: Driver, vehicleRegOrId: string): boolean {
  if (!vehicleRegOrId) return false;
  const cleanInput = vehicleRegOrId.trim().toUpperCase();

  // If driver has explicit authorizedVehicleIds or authorizedVehicleNumbers
  if (driver.authorizedVehicleIds && driver.authorizedVehicleIds.includes(vehicleRegOrId)) {
    return true;
  }

  if (driver.authorizedVehicleNumbers && driver.authorizedVehicleNumbers.length > 0) {
    const match = driver.authorizedVehicleNumbers.some(
      (num) => num.trim().toUpperCase() === cleanInput
    );
    if (match) return true;
  }

  // Fallback check to currently assigned vehicle
  if (driver.assignedVehicleId === vehicleRegOrId) {
    return true;
  }

  // If no vehicles specified yet on driver, default to false so owner is guided to authorize
  return false;
}

/**
 * Evaluates vehicle insurance expiry status:
 * - <= 0 days: Expired
 * - <= 10 days: CRITICAL_10_DAYS (Requires forced notification to owner)
 * - <= 30 days: EXPIRING_30_DAYS (1-month warning notification)
 * - > 30 days: VALID
 */
export function getVehicleInsuranceStatus(insurance?: VehicleInsurance): InsuranceStatusInfo {
  if (!insurance || !insurance.expiryDate) {
    return {
      status: 'UNSET',
      daysRemaining: 0,
      isUrgent: false,
      isExpiring30Days: false,
      label: 'Insurance Not Configured',
      badgeText: 'No Insurance Configured',
      colorClass: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(insurance.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining,
      isUrgent: true,
      isExpiring30Days: true,
      label: `Policy Expired on ${insurance.expiryDate} (${Math.abs(daysRemaining)} days ago)!`,
      badgeText: `EXPIRED (${Math.abs(daysRemaining)}d ago)`,
      colorClass: 'bg-rose-600 text-white border-rose-700 animate-pulse',
    };
  }

  if (daysRemaining <= 10) {
    return {
      status: 'CRITICAL_10_DAYS',
      daysRemaining,
      isUrgent: true,
      isExpiring30Days: true,
      label: `URGENT: Insurance expires in ${daysRemaining === 0 ? 'TODAY' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}! Renewal mandatory.`,
      badgeText: `CRITICAL: ${daysRemaining}d Left (Forced Alert)`,
      colorClass: 'bg-rose-500 text-white border-rose-600 animate-pulse',
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'EXPIRING_30_DAYS',
      daysRemaining,
      isUrgent: false,
      isExpiring30Days: true,
      label: `Insurance renewal due in ${daysRemaining} days (1 Month Notice).`,
      badgeText: `1 Month Notice (${daysRemaining}d left)`,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-400',
    };
  }

  return {
    status: 'VALID',
    daysRemaining,
    isUrgent: false,
    isExpiring30Days: false,
    label: `Insurance Active (${daysRemaining} days remaining)`,
    badgeText: `Active (${daysRemaining}d)`,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
}

/**
 * Formats state permit summary string (e.g. "Jharkhand, West Bengal, Bihar" or "All India").
 */
export function formatPermittedStates(permit?: VehiclePermit): string {
  if (!permit || !permit.permittedStates || permit.permittedStates.length === 0) {
    return 'Jharkhand (Default State Permit)';
  }
  if (permit.isAllIndia || permit.permittedStates.includes('All India (National)')) {
    return 'All India (National Tourist Permit)';
  }
  return permit.permittedStates.join(', ');
}

// In-memory cache to prevent spamming notifications in the same browser session
const checkedTimestamps: Record<string, number> = {};

/**
 * Automatically evaluates vehicles and drivers for insurance expiry and authorization renewals,
 * triggering 1-month and forced 10-day notifications to the Owner.
 */
export async function checkAndTriggerComplianceAlerts(
  vehicles: Vehicle[],
  drivers: Driver[],
  ownerUserId: string = 'owner'
): Promise<{ triggeredCount: number; criticalVehicles: Vehicle[] }> {
  const now = Date.now();
  const cacheKey = `compliance_check_${ownerUserId}`;
  // Run check at most once every 60 seconds per session
  if (checkedTimestamps[cacheKey] && now - checkedTimestamps[cacheKey] < 60000) {
    const critical = vehicles.filter((v) => {
      const status = getVehicleInsuranceStatus(v.insurance);
      return status.status === 'CRITICAL_10_DAYS' || status.status === 'EXPIRED';
    });
    return { triggeredCount: 0, criticalVehicles: critical };
  }
  checkedTimestamps[cacheKey] = now;

  let triggeredCount = 0;
  const criticalVehicles: Vehicle[] = [];

  try {
    const existingNotifications = await getNotifications(ownerUserId);

    // 1. Check Vehicle Insurance Expiries
    for (const veh of vehicles) {
      if (!veh.insurance || !veh.insurance.expiryDate) continue;

      const insStatus = getVehicleInsuranceStatus(veh.insurance);

      if (insStatus.status === 'CRITICAL_10_DAYS' || insStatus.status === 'EXPIRED') {
        criticalVehicles.push(veh);

        // Check if forced 10-day notification was already issued recently
        const alreadyNotified = existingNotifications.some(
          (n) =>
            n.vehicleId === veh.id &&
            n.type === 'FORCED_INSURANCE_EXPIRY_10_DAYS' &&
            // Check if issued within last 2 days
            now - new Date(n.createdAt).getTime() < 48 * 60 * 60 * 1000
        );

        if (!alreadyNotified) {
          await addNotification({
            userId: ownerUserId,
            title: `🚨 FORCED CRITICAL ALERT: Insurance Expires in ${insStatus.daysRemaining > 0 ? insStatus.daysRemaining + ' Days' : 'TODAY'}!`,
            body: `MANDATORY OWNER ACTION: Vehicle ${veh.registrationNumber} (${veh.make} ${veh.model}) insurance with ${veh.insurance.insurerName || 'Insurer'} expires on ${veh.insurance.expiryDate}. Renew policy now to avoid illegal operation under Motor Vehicles Act.`,
            type: 'FORCED_INSURANCE_EXPIRY_10_DAYS',
            vehicleId: veh.id,
            isUrgent: true,
          });
          triggeredCount++;
        }
      } else if (insStatus.status === 'EXPIRING_30_DAYS') {
        // 1-month warning notice
        const alreadyNotified30 = existingNotifications.some(
          (n) =>
            n.vehicleId === veh.id &&
            n.type === 'INSURANCE_EXPIRY_30_DAYS' &&
            now - new Date(n.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
        );

        if (!alreadyNotified30) {
          await addNotification({
            userId: ownerUserId,
            title: `⚠️ Insurance Expiry Warning: ${veh.registrationNumber} (1 Month Notice)`,
            body: `Commercial insurance for ${veh.make} ${veh.model} (${veh.registrationNumber}) expires in ${insStatus.daysRemaining} days on ${veh.insurance.expiryDate}. Please contact ${veh.insurance.insurerName || 'your insurer'} to initiate renewal.`,
            type: 'INSURANCE_EXPIRY_30_DAYS',
            vehicleId: veh.id,
            isUrgent: false,
          });
          triggeredCount++;
        }
      }
    }

    // 2. Check Driver Authorizations
    for (const driver of drivers) {
      if (!driver.authorizationExpiryDate) continue;

      const authStatus = getDriverAuthorizationStatus(driver);

      if (authStatus.isExpired) {
        const alreadyNotified = existingNotifications.some(
          (n) =>
            n.driverId === driver.id &&
            n.type === 'DRIVER_AUTH_EXPIRED' &&
            now - new Date(n.createdAt).getTime() < 48 * 60 * 60 * 1000
        );

        if (!alreadyNotified) {
          await addNotification({
            userId: ownerUserId,
            title: `⛔ Driver Authorization Expired: ${driver.name}`,
            body: `Chauffeur ${driver.name}'s authorization to drive expired on ${driver.authorizationExpiryDate}. Please renew authorization in Chauffeurs & Drivers tab.`,
            type: 'DRIVER_AUTH_EXPIRED',
            driverId: driver.id,
            isUrgent: true,
          });
          triggeredCount++;
        }
      } else if (authStatus.isExpiringSoon) {
        const alreadyNotified = existingNotifications.some(
          (n) =>
            n.driverId === driver.id &&
            n.type === 'DRIVER_AUTH_EXPIRING' &&
            now - new Date(n.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
        );

        if (!alreadyNotified) {
          await addNotification({
            userId: ownerUserId,
            title: `⚠️ Driver Authorization Renewal Due: ${driver.name}`,
            body: `Authorization for ${driver.name} expires in ${authStatus.daysRemaining} days on ${driver.authorizationExpiryDate}. Owner renewal required.`,
            type: 'DRIVER_AUTH_EXPIRING',
            driverId: driver.id,
            isUrgent: false,
          });
          triggeredCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Compliance check error:', err);
  }

  return { triggeredCount, criticalVehicles };
}
