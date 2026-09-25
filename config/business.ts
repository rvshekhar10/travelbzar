import { PricingConfig } from '@/types';

export const BUSINESS_CONFIG = {
  name: 'TRAVEL BZAR',
  tagline: 'PREMIUM CAB SERVICE',
  secondaryTagline: 'COMFORT • SAFETY • RELIABILITY',
  promises: [
    { title: 'SAFE & RELIABLE', desc: 'Verified cars with thorough safety checks' },
    { title: 'PROFESSIONAL DRIVERS', desc: 'Experienced, courteous and punctual chauffeurs' },
    { title: 'CLEAN & WELL MAINTAINED CABS', desc: 'Pristine interiors, sanitised and AC comfort' },
  ],
  features: [
    { title: 'Fuel Efficient Drive', icon: 'leaf' },
    { title: 'Silent & Smooth Ride', icon: 'volume-x' },
    { title: 'Spacious & Comfortable', icon: 'user' },
    { title: 'Safe & Reliable', icon: 'shield-check' },
    { title: 'AC Comfort All The Way', icon: 'snowflake' },
  ],
  location: {
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
    displayName: 'Dhanbad, Jharkhand',
    coordinates: {
      latitude: 23.7957,
      longitude: 86.4304,
    },
  },
  contact: {
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+91 9007210697',
    whatsapp: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP || '+91 9007210697',
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'support@travelbzar.com',
    upiId: process.env.NEXT_PUBLIC_BUSINESS_UPI || '9007210697@upi',
    supportAvailability: '24x7 Customer Support',
    bookingNotice: 'Advance Booking Recommended',
  },
  airportLocations: {
    ranchi: {
      name: 'Ranchi Airport (IXR)',
      fullName: 'Birsa Munda Airport, Ranchi',
      code: 'IXR',
      coordinates: { latitude: 23.3143, longitude: 85.3218 },
      distanceKmApprox: 150,
      minFare: 3500,
      maxFare: 4000,
    },
    deoghar: {
      name: 'Deoghar Airport (DGH)',
      fullName: 'Deoghar International Airport',
      code: 'DGH',
      coordinates: { latitude: 24.4439, longitude: 86.7027 },
      distanceKmApprox: 115,
      minFare: 3000,
      maxFare: 3200,
    },
    durgapur: {
      name: 'Durgapur Airport (RDP)',
      fullName: 'Kazi Nazrul Islam Airport, Andal/Durgapur',
      code: 'RDP',
      coordinates: { latitude: 23.6231, longitude: 87.2415 },
      distanceKmApprox: 120,
      minFare: 2500,
      maxFare: 3000,
    },
  },
  maxVehicles: 1,
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  localBaseFare: 2400,
  localIncludedHours: 8,
  localIncludedKm: 80,
  localExtraKmRate: 14,
  localExtraHourRate: 150,

  airports: {
    ranchi: {
      name: 'Ranchi Airport (IXR)',
      code: 'IXR',
      minimumFare: 3500,
      maximumFare: 4000,
      distanceKmApprox: 150,
    },
    deoghar: {
      name: 'Deoghar Airport (DGH)',
      code: 'DGH',
      minimumFare: 3000,
      maximumFare: 3200,
      distanceKmApprox: 115,
    },
    durgapur: {
      name: 'Durgapur Airport (RDP)',
      code: 'RDP',
      minimumFare: 2500,
      maximumFare: 3000,
      distanceKmApprox: 120,
    },
  },

  airportDelayCharge: 500,
  airportDelayMaxHours: 4,

  waitingFreeMinutes: 15,
  waitingRatePerMinute: 3,

  nightCharge: 300,
  nightStart: '22:00',
  nightEnd: '06:00',

  cleaningMin: 500,
  cleaningMax: 1500,

  bookingBufferMinutes: 30,
};
