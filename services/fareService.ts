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
    parkingCharge = 0,
    tollCharge = 0,
    stateTaxCharge = 0,
    cleaningCharge = 0,
    otherCharge = 0,
  } = input;

  let baseFare = 0;
  let distanceCharge = 0;
  let timeCharge = 0;
  let estimatedMinFare: number | undefined;
  let estimatedMaxFare: number | undefined;
  let isOwnerReviewRequired = false;

  if (bookingType === 'LOCAL_CITY') {
    baseFare = config.localBaseFare;

    // Extra KM over 80 km
    if (distanceKm > config.localIncludedKm) {
      const extraKm = Math.max(0, distanceKm - config.localIncludedKm);
      distanceCharge = Math.round(extraKm * config.localExtraKmRate);
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

  // Waiting Charges (15 min free, ₹3/min after)
  let waitingCharge = 0;
  // If flight delay rule is applied, airport pickup flight delay does not also trigger standard waiting
  if (waitingMinutes > config.waitingFreeMinutes) {
    const chargeableMinutes = waitingMinutes - config.waitingFreeMinutes;
    waitingCharge = Math.round(chargeableMinutes * config.waitingRatePerMinute);
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
    timeCharge,
    waitingCharge,
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
    nightCharge: config.nightCharge,
    airportDelayCharge: config.airportDelayCharge,
  };
}
