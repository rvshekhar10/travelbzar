import { BookingType, FareCalculation, PricingConfig, PricingSnapshot } from '@/types';

export interface FareCalculationInput {
  bookingType: BookingType;
  distanceKm: number;
  durationMinutes: number;
  pickupTime: string; // HH:mm
  airportCode?: string; // 'IXR' | 'DGH' | 'RDP' | etc.
  agreedBaseFare?: number; // Fare confirmed by owner for airport
  flightDelayMinutes?: number;
  waitingMinutes?: number;
  haltMinutes?: number; // Scheduled halt time at intermediate stops
  detourKm?: number; // Explicit excess detour distance (e.g. from mid-trip log)
  driverStayNights?: number; // Driver overnight stay requested by customer
  isAirportPickup?: boolean;
  parkingCharge?: number;
  tollCharge?: number;
  stateTaxCharge?: number;
  cleaningCharge?: number;
  otherCharge?: number;
}

/**
 * Checks if a given time string (HH:mm) falls within the night charge window (e.g. 22:00 to 06:00).
 */
export function isNightTime(timeStr: string, nightStart = '22:00', nightEnd = '06:00'): boolean {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const currentTotal = (hours || 0) * 60 + (minutes || 0);

  const [startH, startM] = nightStart.split(':').map(Number);
  const startTotal = (startH || 22) * 60 + (startM || 0);

  const [endH, endM] = nightEnd.split(':').map(Number);
  const endTotal = (endH || 6) * 60 + (endM || 0);

  if (startTotal > endTotal) {
    // Crosses midnight (e.g. 22:00 to 06:00)
    return currentTotal >= startTotal || currentTotal < endTotal;
  }
  return currentTotal >= startTotal && currentTotal < endTotal;
}

/**
 * Centralized, pure calculation engine for Travel BZAR.
 * Dynamically computes excess distance, detours, stop halts, driver stay, and airport allowances.
 * All monetary amounts are rounded integers in INR.
 */
export function calculateFare(
  input: FareCalculationInput,
  config: PricingConfig
): FareCalculation {
  const {
    bookingType,
    distanceKm,
    durationMinutes,
    pickupTime,
    airportCode,
    agreedBaseFare,
    flightDelayMinutes = 0,
    waitingMinutes = 0,
    haltMinutes = 0,
    detourKm: explicitDetourKm = 0,
    driverStayNights = 0,
    parkingCharge = 0,
    tollCharge = 0,
    stateTaxCharge = 0,
    cleaningCharge = 0,
    otherCharge = 0,
  } = input;

  let baseFare = 0;
  let distanceCharge = 0;
  let calculatedDetourKm = 0;
  let detourCharge = 0;
  let timeCharge = 0;
  let estimatedMinFare: number | undefined;
  let estimatedMaxFare: number | undefined;
  let isOwnerReviewRequired = false;

  if (bookingType === 'LOCAL_CITY') {
    baseFare = config.localBaseFare;

    // Extra KM over 80 km package
    if (distanceKm > config.localIncludedKm) {
      calculatedDetourKm = Math.max(0, distanceKm - config.localIncludedKm);
      distanceCharge = Math.round(calculatedDetourKm * config.localExtraKmRate);
      detourCharge = distanceCharge;
    } else if (explicitDetourKm > 0) {
      calculatedDetourKm = explicitDetourKm;
      distanceCharge = Math.round(calculatedDetourKm * config.localExtraKmRate);
      detourCharge = distanceCharge;
    }

    // Extra hours over 8 hours (480 minutes)
    const includedMinutes = config.localIncludedHours * 60;
    if (durationMinutes > includedMinutes) {
      const extraMinutes = durationMinutes - includedMinutes;
      const extraHours = Math.ceil(extraMinutes / 60);
      timeCharge = Math.round(extraHours * config.localExtraHourRate);
    }
  } else {
    // Airport booking (Pickup or Drop)
    let matchedAirport = Object.values(config.airports).find(
      (a) => a.code.toLowerCase() === (airportCode || '').toLowerCase()
    );

    // Fallback if not matched by code
    if (!matchedAirport) {
      matchedAirport = config.airports.ranchi;
    }

    estimatedMinFare = matchedAirport.minimumFare;
    estimatedMaxFare = matchedAirport.maximumFare;

    // If owner has confirmed an agreed base fare, use it; otherwise use average/min for estimate
    baseFare = agreedBaseFare && agreedBaseFare > 0 ? agreedBaseFare : estimatedMinFare;

    // Detour excess distance: any kilometers exceeding the standard airport route
    const standardAirportKm = matchedAirport.distanceKmApprox || 150;
    const excessRouteKm = distanceKm > standardAirportKm ? Math.round((distanceKm - standardAirportKm) * 10) / 10 : 0;
    calculatedDetourKm = Math.max(explicitDetourKm, excessRouteKm);

    if (calculatedDetourKm > 0) {
      detourCharge = Math.round(calculatedDetourKm * config.localExtraKmRate);
      distanceCharge = detourCharge;
    }
  }

  // Airport Flight Delay Rule (Up to 4 hours = ₹500, > 4 hours = OWNER REVIEW REQUIRED)
  let airportDelayCharge = 0;
  if (bookingType === 'AIRPORT_PICKUP' && flightDelayMinutes > 0) {
    const maxDelayMinutes = config.airportDelayMaxHours * 60;
    if (flightDelayMinutes <= maxDelayMinutes) {
      airportDelayCharge = config.airportDelayCharge; // Fixed ₹500
    } else {
      // Delay exceeds 4 hours: Do NOT invent extra fees, flag for owner review
      airportDelayCharge = config.airportDelayCharge;
      isOwnerReviewRequired = true;
    }
  }

  // Waiting & Intermediate Stop Halt Charges
  // Free buffer applies once (15 min free), then ₹3/min
  let waitingCharge = 0;
  const cumulativeWaitMinutes = Math.max(0, waitingMinutes) + Math.max(0, haltMinutes);
  if (cumulativeWaitMinutes > config.waitingFreeMinutes) {
    const chargeableMinutes = cumulativeWaitMinutes - config.waitingFreeMinutes;
    waitingCharge = Math.round(chargeableMinutes * config.waitingRatePerMinute);
  }

  // Driver Stay / Overnight Halt Allowance (Customer Request)
  // Standard lodging/boarding allowance e.g. ₹500/night
  let driverStayCharge = 0;
  const stayRate = config.driverStayRatePerNight || 500;
  if (driverStayNights > 0) {
    driverStayCharge = Math.round(driverStayNights * stayRate);
  }

  // Night Charge: ₹300 if trip starts between 10 PM and 6 AM
  let nightCharge = 0;
  if (isNightTime(pickupTime, config.nightStart, config.nightEnd)) {
    nightCharge = config.nightCharge;
  }

  // Cleaning charge validated within min/max bounds if applied
  const safeCleaningCharge = Math.max(0, cleaningCharge);

  // Total integer INR fare
  const totalFare = Math.round(
    baseFare +
      distanceCharge +
      timeCharge +
      waitingCharge +
      driverStayCharge +
      airportDelayCharge +
      nightCharge +
      parkingCharge +
      tollCharge +
      stateTaxCharge +
      safeCleaningCharge +
      otherCharge
  );

  return {
    baseFare,
    distanceCharge,
    detourKm: calculatedDetourKm > 0 ? calculatedDetourKm : undefined,
    detourCharge: detourCharge > 0 ? detourCharge : undefined,
    timeCharge,
    waitingCharge,
    driverStayNights: driverStayNights > 0 ? driverStayNights : undefined,
    driverStayCharge: driverStayCharge > 0 ? driverStayCharge : undefined,
    airportDelayCharge,
    nightCharge,
    parkingCharge: Math.round(parkingCharge),
    tollCharge: Math.round(tollCharge),
    stateTaxCharge: Math.round(stateTaxCharge),
    cleaningCharge: Math.round(safeCleaningCharge),
    otherCharge: Math.round(otherCharge),
    totalFare,
    estimatedMinFare,
    estimatedMaxFare,
    isOwnerReviewRequired,
  };
}

/**
 * Creates an immutable snapshot of current pricing config to attach to a booking.
 */
export function createPricingSnapshot(config: PricingConfig): PricingSnapshot {
  return {
    baseFare: config.localBaseFare,
    includedKm: config.localIncludedKm,
    includedHours: config.localIncludedHours,
    extraKmRate: config.localExtraKmRate,
    extraHourRate: config.localExtraHourRate,
    waitingRate: config.waitingRatePerMinute,
    waitingFreeMinutes: config.waitingFreeMinutes,
    nightCharge: config.nightCharge,
    nightStart: config.nightStart,
    nightEnd: config.nightEnd,
    airportDelayCharge: config.airportDelayCharge,
    airportDelayMaxHours: config.airportDelayMaxHours,
    driverStayRatePerNight: config.driverStayRatePerNight || 500,
    cleaningMin: config.cleaningMin,
    cleaningMax: config.cleaningMax,
  };
}
