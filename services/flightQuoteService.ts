import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface MarkupSettings {
  // Fare Type Markups (INR)
  valueMarkup: number; // default: 100
  smeMarkup: number; // default: 250
  classicMarkup: number; // default: 150
  flexMarkup: number; // default: 200
  specialNonRefundableMarkup: number; // default: 250

  // Airline-specific cancellation policy charges per pax
  // Air India Express
  airIndiaExpressSmeCancel: number; // default: 1250
  airIndiaExpressNormalCancel: number; // default: 4550

  // Akasa Air
  akasaSmeCancel: number; // default: 700
  akasaNormalCancel: number; // default: 5250

  // IndiGo
  indigoSmeCancel: number; // default: 1100
  indigoNormalCancel: number; // default: 5250

  // Fallback other airlines
  defaultSmeCancel: number;
  defaultNormalCancel: number;

  // Contact / Agency Signature
  agencyName: string;
  agencyPhone: string;
  agencyLocation: string;
}

export const DEFAULT_MARKUP_SETTINGS: MarkupSettings = {
  valueMarkup: 100,
  smeMarkup: 250,
  classicMarkup: 150,
  flexMarkup: 200,
  specialNonRefundableMarkup: 250,

  airIndiaExpressSmeCancel: 1250,
  airIndiaExpressNormalCancel: 4550,

  akasaSmeCancel: 700,
  akasaNormalCancel: 5250,

  indigoSmeCancel: 1100,
  indigoNormalCancel: 5250,

  defaultSmeCancel: 1200,
  defaultNormalCancel: 4500,

  agencyName: 'Travel BZAR',
  agencyPhone: '+91 9007210697',
  agencyLocation: 'Dhanbad, Jharkhand',
};

const STORAGE_KEY = 'travelbzar_flight_markup_settings_v1';

/**
 * Loads flight markup and cancellation settings from Firestore,
 * with graceful fallback to localStorage and system defaults.
 */
export async function getStoredMarkupSettings(): Promise<MarkupSettings> {
  // 1. Try Firestore First
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'flightMarkupSettings', 'global'));
      if (snap.exists()) {
        const remote = snap.data() as MarkupSettings;
        const merged = { ...DEFAULT_MARKUP_SETTINGS, ...remote };
        // Sync local cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
        return merged;
      }
    } catch (err) {
      console.warn('Firestore flightMarkupSettings fetch error, falling back to local:', err);
    }
  }

  // 2. Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_MARKUP_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
  }

  return DEFAULT_MARKUP_SETTINGS;
}

/**
 * Saves markup settings directly to Firestore and local cache for frequent reliable usage.
 */
export async function saveStoredMarkupSettings(settings: MarkupSettings): Promise<void> {
  // Save local cache immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save markup settings to localStorage:', err);
    }
  }

  // Persist permanently in Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'flightMarkupSettings', 'global'), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save markup settings to Firestore:', err);
    }
  }
}

export type TripType = 'one-way' | 'return';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business';

export interface TripHeaderDetails {
  tripType: TripType;
  fromCity: string; // e.g. "Ranchi (IXR)"
  toCity: string; // e.g. "Delhi (DEL)"
  departDate: string; // e.g. "25 Aug 2026"
  returnDate?: string; // e.g. "30 Aug 2026"
  passengerCount: number; // e.g. 2
  cabinClass: CabinClass; // e.g. "Economy"
  customerName?: string;
}

export interface ExtractedFlightOption {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration?: string;
  stops?: string; // "Non-stop" or "1 Stop"
  baseFare: number; // Original Portal Rate
  offerPrice?: number; // Quoted client rate (baseFare + markup)
  fareCategory: 'value' | 'sme' | 'classic' | 'flex' | 'special_non_refundable';
  cabinBaggage?: string;
  checkInBaggage?: string;
  seatIncluded?: boolean;
  mealIncluded?: boolean;
}

export function getCancellationFee(
  airline: string,
  fareCategory: ExtractedFlightOption['fareCategory'],
  settings: MarkupSettings
): { fee: number; isNonRefundable: boolean; note: string } {
  if (fareCategory === 'special_non_refundable') {
    return { fee: 0, isNonRefundable: true, note: 'Special Non-Refundable Fare' };
  }

  const normAirline = airline.toLowerCase();
  const isSmeOrCorp = fareCategory === 'sme';

  if (normAirline.includes('air india express') || normAirline.includes('ix') || normAirline.includes('express')) {
    const fee = isSmeOrCorp ? settings.airIndiaExpressSmeCancel : settings.airIndiaExpressNormalCancel;
    return {
      fee,
      isNonRefundable: false,
      note: `₹${fee.toLocaleString('en-IN')}/pax (${isSmeOrCorp ? 'SME/Corp' : 'Standard'})`,
    };
  }

  if (normAirline.includes('akasa') || normAirline.includes('qp')) {
    const fee = isSmeOrCorp ? settings.akasaSmeCancel : settings.akasaNormalCancel;
    return {
      fee,
      isNonRefundable: false,
      note: `₹${fee.toLocaleString('en-IN')}/pax (${isSmeOrCorp ? 'SME/Corp' : 'Standard'})`,
    };
  }

  if (normAirline.includes('indigo') || normAirline.includes('6e')) {
    const fee = isSmeOrCorp ? settings.indigoSmeCancel : settings.indigoNormalCancel;
    return {
      fee,
      isNonRefundable: false,
      note: `₹${fee.toLocaleString('en-IN')}/pax (${isSmeOrCorp ? 'SME/Corp' : 'Standard'})`,
    };
  }

  // Fallback
  const fee = isSmeOrCorp ? settings.defaultSmeCancel : settings.defaultNormalCancel;
  return {
    fee,
    isNonRefundable: false,
    note: `₹${fee.toLocaleString('en-IN')}/pax`,
  };
}

export function calculateQuotedFare(
  baseFare: number,
  fareCategory: ExtractedFlightOption['fareCategory'],
  settings: MarkupSettings
): { finalFare: number; markupApplied: number } {
  let markup = settings.valueMarkup;
  if (fareCategory === 'sme') markup = settings.smeMarkup;
  else if (fareCategory === 'classic') markup = settings.classicMarkup;
  else if (fareCategory === 'flex') markup = settings.flexMarkup;
  else if (fareCategory === 'special_non_refundable') markup = settings.specialNonRefundableMarkup;

  return {
    finalFare: Math.round(baseFare + markup),
    markupApplied: markup,
  };
}

export function generateWhatsAppQuoteText(
  trip: TripHeaderDetails,
  options: ExtractedFlightOption[],
  settings: MarkupSettings
): string {
  if (options.length === 0) return '';

  const tripBadge = trip.tripType === 'return' ? 'ROUND TRIP' : 'ONE WAY';
  const sector = `${trip.fromCity} ✈️ ${trip.toCity}`;

  let text = `✈️ *FLIGHT QUOTATION — TRAVEL BZAR*\n`;
  if (trip.customerName) {
    text += `Dear *${trip.customerName}*,\n`;
  }
  text += `Here are the best live flight options for your journey:\n\n`;
  text += `📍 *Sector:* ${sector}\n`;
  text += `🏷️ *Trip Type:* ${tripBadge} · ${trip.cabinClass}\n`;
  text += `🗓️ *Depart Date:* ${trip.departDate}\n`;
  if (trip.tripType === 'return' && trip.returnDate) {
    text += `🔄 *Return Date:* ${trip.returnDate}\n`;
  }
  text += `👥 *Passengers:* ${trip.passengerCount} Pax\n`;
  text += `───────────────────────\n\n`;

  options.forEach((opt, idx) => {
    const { finalFare } = calculateQuotedFare(opt.baseFare, opt.fareCategory, settings);
    const offerPrice = opt.offerPrice && opt.offerPrice > 0 ? opt.offerPrice : finalFare;
    const totalFare = offerPrice * trip.passengerCount;
    const cancel = getCancellationFee(opt.airline, opt.fareCategory, settings);

    const categoryTitle =
      opt.fareCategory === 'sme'
        ? 'SME Corporate Fare'
        : opt.fareCategory === 'special_non_refundable'
        ? 'Special Non-Refundable'
        : opt.fareCategory === 'flex'
        ? 'Flexi Plus'
        : opt.fareCategory === 'classic'
        ? 'Classic Fare'
        : 'Value Saver';

    text += `*Option ${idx + 1}: ${opt.airline}* (${opt.flightNumber || 'Direct'})\n`;
    text += `🕒 *Time:* ${opt.departureTime || '--:--'} ➔ ${opt.arrivalTime || '--:--'}${opt.duration ? ` (${opt.duration})` : ''}\n`;
    text += `🏷️ *Fare Type:* ${categoryTitle}\n`;
    text += `💰 *Offer Price:* *₹${offerPrice.toLocaleString('en-IN')}/pax*`;
    if (trip.passengerCount > 1) {
      text += ` (Total: *₹${totalFare.toLocaleString('en-IN')}*)`;
    }
    text += `\n`;

    // Inclusions
    const inclusions: string[] = [];
    if (opt.cabinBaggage) inclusions.push(`Cabin: ${opt.cabinBaggage}`);
    if (opt.checkInBaggage) inclusions.push(`Check-in: ${opt.checkInBaggage}`);
    if (opt.mealIncluded) inclusions.push(`Free Meal 🍱`);
    if (opt.seatIncluded) inclusions.push(`Free Seat 💺`);

    if (inclusions.length > 0) {
      text += `🎒 *Inclusions:* ${inclusions.join(' • ')}\n`;
    }

    // Cancellation policy
    text += `⚠️ *Cancellation:* ${cancel.note}\n\n`;
  });

  text += `───────────────────────\n`;
  text += `📌 *Booking Policy:*\n`;
  text += `• Fares & seats are live and subject to airline availability at booking.\n`;
  text += `• Instant confirmed e-ticket issued on WhatsApp upon confirmation.\n\n`;
  text += `📞 *To confirm your flight, reply here or call:*\n`;
  text += `*${settings.agencyName} Concierge:* ${settings.agencyPhone}\n`;
  text += `📍 ${settings.agencyLocation}`;

  return text;
}
