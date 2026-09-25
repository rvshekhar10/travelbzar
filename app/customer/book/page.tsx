'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { usePricing } from '@/hooks/usePricing';
import { useVehicles } from '@/hooks/useVehicles';
import { BookingType, LocationCoordinate, AirportDetails, Booking } from '@/types';
import { BUSINESS_CONFIG } from '@/config/business';
import { calculateRouteDistance, getPresetLocations } from '@/services/mapService';
import { calculateFare } from '@/services/fareService';
import { createNewBooking } from '@/services/bookingService';
import { getCurrentDeviceLocation } from '@/services/locationService';
import { MapView } from '@/components/maps/MapView';
import { LocationPickerMap } from '@/components/maps/LocationPickerMap';
import { FareBreakdown } from '@/components/booking/FareBreakdown';
import {
  Car,
  Plane,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Info,
  AlertCircle,
  Sparkles,
  User,
  KeyRound,
  Mail,
  Loader2,
  Compass,
} from 'lucide-react';

function BookCabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, registerCustomer } = useAuth();
  const { pricing } = usePricing();
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const primaryVehicle = vehicles[0];
  const [activePointerTarget, setActivePointerTarget] = useState<'pickup' | 'drop'>('pickup');

  // Booking Stepper state: 1: TYPE, 2: LOCATIONS, 3: DATE & TIME, 4: FARE & ROUTE, 5: CONFIRM
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Authentication requirement state for guests
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Form Fields
  const [bookingType, setBookingType] = useState<BookingType>(
    (searchParams.get('type') as BookingType) || 'AIRPORT_DROP'
  );

  const [selectedAirportCode, setSelectedAirportCode] = useState<string>(
    searchParams.get('airport') || 'IXR'
  );

  const [flightNumber, setFlightNumber] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [flightDelayMinutes, setFlightDelayMinutes] = useState<number>(0);

  // Default Locations
  const defaultDhanbad: LocationCoordinate = {
    address: 'Dhanbad Junction Railway Station, Station Rd, Dhanbad, Jharkhand 826001',
    latitude: 23.7915,
    longitude: 86.4295,
  };

  const [pickup, setPickup] = useState<LocationCoordinate>(defaultDhanbad);
  const [drop, setDrop] = useState<LocationCoordinate>({
    address: BUSINESS_CONFIG.airportLocations.ranchi.fullName,
    latitude: BUSINESS_CONFIG.airportLocations.ranchi.coordinates.latitude,
    longitude: BUSINESS_CONFIG.airportLocations.ranchi.coordinates.longitude,
  });

  // Date and Time (IST)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState<string>(defaultDateStr);
  const [pickupTime, setPickupTime] = useState<string>('08:30');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Customer Contact Info
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '+91 9431100000');

  // Calculated Route & Fare
  const [distanceKm, setDistanceKm] = useState<number>(150);
  const [durationMinutes, setDurationMinutes] = useState<number>(210);

  // Update locations when airport or booking type changes
  useEffect(() => {
    if (bookingType === 'AIRPORT_DROP') {
      const airport =
        Object.values(BUSINESS_CONFIG.airportLocations).find((a) => a.code === selectedAirportCode) ||
        BUSINESS_CONFIG.airportLocations.ranchi;
      setDrop({
        address: `${airport.fullName} (${airport.code})`,
        latitude: airport.coordinates.latitude,
        longitude: airport.coordinates.longitude,
      });
    } else if (bookingType === 'AIRPORT_PICKUP') {
      const airport =
        Object.values(BUSINESS_CONFIG.airportLocations).find((a) => a.code === selectedAirportCode) ||
        BUSINESS_CONFIG.airportLocations.ranchi;
      setPickup({
        address: `${airport.fullName} (${airport.code})`,
        latitude: airport.coordinates.latitude,
        longitude: airport.coordinates.longitude,
      });
      setDrop(defaultDhanbad);
    } else {
      // LOCAL_CITY
      setPickup(defaultDhanbad);
      setDrop({
        address: 'Local Dhanbad Sightseeing / Corporate Circuit, Dhanbad, Jharkhand',
        latitude: 23.8189,
        longitude: 86.4567,
      });
    }
  }, [bookingType, selectedAirportCode]);

  // Recalculate route whenever pickup/drop changes
  useEffect(() => {
    let isCurrent = true;
    const calculate = async () => {
      try {
        const route = await calculateRouteDistance(pickup, drop);
        if (isCurrent) {
          setDistanceKm(route.distanceKm);
          setDurationMinutes(route.durationMinutes);
        }
      } catch (e) {
        console.info('Route calc notice:', e);
      }
    };
    calculate();
    return () => {
      isCurrent = false;
    };
  }, [pickup.latitude, pickup.longitude, drop.latitude, drop.longitude]);

  // Compute live estimated fare
  const currentFare = calculateFare(
    {
      bookingType,
      distanceKm,
      durationMinutes,
      pickupTime,
      airportCode: selectedAirportCode,
      flightDelayMinutes: bookingType === 'AIRPORT_PICKUP' ? flightDelayMinutes : 0,
      isAirportPickup: bookingType === 'AIRPORT_PICKUP',
    },
    pricing
  );

  // Geolocation handler
  const handleUseCurrentLocation = async (target: 'pickup' | 'drop') => {
    setLocationDetecting(true);
    setLocationError(null);
    try {
      const loc = await getCurrentDeviceLocation();
      loc.address = `GPS Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (Dhanbad)`;
      if (target === 'pickup') setPickup(loc);
      else setDrop(loc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Location permission denied.';
      setLocationError(msg);
    } finally {
      setLocationDetecting(false);
    }
  };

  // Submit booking
  const handleConfirmBooking = async () => {
    setAuthError(null);

    // If user is not authenticated, support registration or login
    let activeUser = user;
    if (!activeUser) {
      if (!customerName || !customerPhone) {
        setAuthError('Please enter passenger full name and contact phone number.');
        return;
      }
      if (!authEmail || !authPassword) {
        setAuthError('Please enter your email address and password.');
        return;
      }
      setSubmitting(true);
      if (authTab === 'signup') {
        const regRes = await registerCustomer(customerName, authEmail, authPassword, customerPhone);
        if (!regRes.success || !regRes.user) {
          setAuthError(regRes.error || 'Failed to create account. Please verify details.');
          setSubmitting(false);
          return;
        }
        activeUser = regRes.user;
      } else {
        const loginRes = await login(authEmail, authPassword);
        if (!loginRes.success || !loginRes.user) {
          setAuthError(loginRes.error || 'Invalid credentials. Please verify your email and password.');
          setSubmitting(false);
          return;
        }
        activeUser = loginRes.user;
      }
    }

    setSubmitting(true);
    try {
      const airportDetails: AirportDetails | undefined =
        bookingType !== 'LOCAL_CITY'
          ? {
              name: selectedAirportCode === 'IXR' ? 'Ranchi Airport' : selectedAirportCode === 'DGH' ? 'Deoghar Airport' : 'Durgapur Airport',
              code: selectedAirportCode,
              flightNumber: flightNumber || undefined,
              expectedArrival: expectedArrival || undefined,
              delayMinutes: flightDelayMinutes,
            }
          : undefined;

      const newBooking = await createNewBooking({
        customerId: activeUser.id,
        customerName: activeUser.name || customerName || 'Valued Customer',
        customerPhone: activeUser.phone || customerPhone || '+91 9431100000',
        customerEmail: activeUser.email,
        bookingType,
        bookingDate,
        pickupTime,
        pickup,
        drop,
        airport: airportDetails,
        distanceKm,
        estimatedDurationMinutes: durationMinutes,
        customerNotes,
      });

      // Transition straight to live tracking / finding driver screen
      router.push(`/customer/bookings/${newBooking.id}`);
    } catch (err) {
      console.error('Booking failed:', err);
      setSubmitting(false);
    }
  };

  // Step 6: Success Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="py-10 sm:py-16 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-2xl text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#078A32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              BOOKING REQUESTED
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-3 font-mono">
              {confirmedBooking.bookingNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thank you for choosing Travel BZAR. Our dispatch desk will confirm your cab shortly.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Service</span>
              <span className="font-extrabold text-[#061B33]">
                {confirmedBooking.bookingType.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Scheduled Date & Time</span>
              <span className="font-bold text-slate-900">
                {confirmedBooking.bookingDate} at {confirmedBooking.pickupTime} IST
              </span>
            </div>

            <div className="space-y-1.5 py-1">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  A
                </span>
                <span className="text-slate-700 truncate">{confirmedBooking.pickup.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  B
                </span>
                <span className="text-slate-700 truncate">{confirmedBooking.drop.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium">
                {confirmedBooking.fare.estimatedMinFare ? 'Estimated Fare' : 'Booking Fare'}
              </span>
              <span className="text-base font-black text-[#078A32]">
                {confirmedBooking.fare.estimatedMinFare
                  ? `₹${confirmedBooking.fare.estimatedMinFare.toLocaleString('en-IN')} – ₹${confirmedBooking.fare.estimatedMaxFare?.toLocaleString('en-IN')}`
                  : `₹${confirmedBooking.fare.totalFare.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push(`/customer/bookings/${confirmedBooking.id}`)}
              className="w-full sm:w-auto bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-md transition-all"
            >
              View Booking Status →
            </button>
            <button
              onClick={() => router.push('/customer')}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Header and Stepper Indicator */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Online Booking System
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">
            Reserve Your Premium Cab
          </h1>
        </div>

        {/* 5-Step Visual Stepper */}
        <div className="flex items-center justify-between max-w-2xl bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
          {[
            { num: 1, label: 'Type' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Schedule' },
            { num: 4, label: 'Route & Fare' },
            { num: 5, label: 'Confirm' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              disabled={s.num > step}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                step === s.num
                  ? 'text-[#078A32]'
                  : s.num < step
                  ? 'text-slate-800 cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === s.num
                    ? 'bg-[#078A32] text-white shadow-xs'
                    : s.num < step
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s.num < step ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: CHOOSE BOOKING TYPE */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-black text-[#061B33]">Step 1: Choose Your Journey Type</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select between our popular airport transfers or full-day Dhanbad local package.
            </p>
          </div>

          {/* Primary Fleet Vehicle & Availability Schedule Banner */}
          {!loadingVehicles && !primaryVehicle ? (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="font-black text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Fleet Setup in Progress</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                The dedicated fleet cab is currently being configured or maintained by Travel BZAR management in Firestore. Bookings are temporarily paused until the fleet cab is activated.
              </p>
            </div>
          ) : primaryVehicle ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#061B33] text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <Car className="w-6 h-6 text-[#42B900]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#078A32] block">
                    Dedicated Fleet Vehicle
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    {primaryVehicle.make} {primaryVehicle.model} {primaryVehicle.variant ? `(${primaryVehicle.variant})` : ''}
                  </h4>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {primaryVehicle.registrationNumber} • {primaryVehicle.color} • {primaryVehicle.vehicleType}
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Operating Schedule
                </span>
                <span className="font-black text-slate-800 text-xs block">
                  {primaryVehicle.availabilitySchedule?.is24x7
                    ? '24/7 Round the Clock'
                    : `${primaryVehicle.availabilitySchedule?.dailyStartTime || '06:00'} — ${primaryVehicle.availabilitySchedule?.dailyEndTime || '23:00'} IST`}
                </span>
                <span className="text-[10px] text-slate-500">
                  {primaryVehicle.availabilitySchedule?.is24x7
                    ? 'Available Daily'
                    : primaryVehicle.availabilitySchedule?.availableDays?.join(', ')}
                </span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Airport Drop */}
            <div
              onClick={() => setBookingType('AIRPORT_DROP')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                bookingType === 'AIRPORT_DROP'
                  ? 'border-[#F0441D] bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F0441D] flex items-center justify-center mb-3">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Airport Drop</h3>
                <p className="text-xs text-slate-500 mt-1">Dhanbad → Ranchi, Deoghar, or Durgapur</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-black text-[#F0441D]">
                From ₹2,500
              </div>
            </div>

            {/* Airport Pickup */}
            <div
              onClick={() => setBookingType('AIRPORT_PICKUP')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                bookingType === 'AIRPORT_PICKUP'
                  ? 'border-[#F0441D] bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F0441D] flex items-center justify-center mb-3">
                  <Plane className="w-5 h-5 rotate-45" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Airport Pickup</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Flight arrival tracking & 4hr delay cover
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-black text-[#F0441D]">
                Flight Delay Protected
              </div>
            </div>

            {/* Local City */}
            <div
              onClick={() => setBookingType('LOCAL_CITY')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                bookingType === 'LOCAL_CITY'
                  ? 'border-[#078A32] bg-emerald-50/50 shadow-md ring-2 ring-emerald-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Local City Package</h3>
                <p className="text-xs text-slate-500 mt-1">8 Hours / 80 KM within Dhanbad district</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-black text-[#078A32]">
                Fixed ₹2,400 Base
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            {primaryVehicle ? (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Continue to Locations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled
                className="opacity-50 cursor-not-allowed flex items-center gap-2 bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl"
              >
                <span>Fleet Cab Unavailable in Firestore</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: LOCATIONS & AIRPORT SPECIFICS */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-black text-[#061B33]">Step 2: Pickup & Drop Off</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select pickup and destination on the map pointer or enter exact addresses.
            </p>
          </div>

          {/* Interactive Visual Map Location Marker Picker */}
          <div id="visual-map-section" className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Visual Map Marker Picker (Leaflet Street View)</span>
              </span>
              <span className="text-[10px] text-[#078A32] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tap anywhere or drag pins
              </span>
            </div>
            <LocationPickerMap
              pickup={pickup}
              drop={drop}
              onSelectPickup={setPickup}
              onSelectDrop={setDrop}
              activeTarget={activePointerTarget}
              setActiveTarget={setActivePointerTarget}
            />
          </div>

          {/* Airport Selection if Airport Booking */}
          {bookingType !== 'LOCAL_CITY' && (
            <div className="space-y-3 p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-xs">
              <label className="font-bold text-slate-800 block">Select Destination Airport:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: 'IXR', name: 'Ranchi Airport (IXR)', fare: '₹3,500 – ₹4,000' },
                  { code: 'DGH', name: 'Deoghar Airport (DGH)', fare: '₹3,000 – ₹3,200' },
                  { code: 'RDP', name: 'Durgapur Airport (RDP)', fare: '₹2,500 – ₹3,000' },
                ].map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => setSelectedAirportCode(a.code)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAirportCode === a.code
                        ? 'border-[#F0441D] bg-white shadow-sm ring-1 ring-orange-400 font-bold'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="text-slate-900 font-extrabold">{a.name}</div>
                    <div className="text-[#F0441D] font-bold text-[11px] mt-1">{a.fare}</div>
                  </button>
                ))}
              </div>

              {/* Extra Flight Details for Airport Pickups */}
              {bookingType === 'AIRPORT_PICKUP' && (
                <div className="pt-3 border-t border-orange-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Flight Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 6E-204"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Expected Arrival Time</label>
                    <input
                      type="time"
                      value={expectedArrival}
                      onChange={(e) => setExpectedArrival(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Flight Delay (mins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={flightDelayMinutes}
                      onChange={(e) => setFlightDelayMinutes(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pickup Address */}
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pickup Location</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActivePointerTarget('pickup');
                    document.getElementById('visual-map-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#078A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[#078A32]" />
                  <span>📍 Pick on Visual Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCurrentLocation('pickup')}
                  disabled={locationDetecting}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{locationDetecting ? 'Detecting GPS...' : 'Use Device GPS'}</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              value={pickup.address}
              onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
              placeholder="Enter pickup address, hotel, or landmark..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
            />

            {/* Live Synchronized Pin Coordinates */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#078A32]" />
                Pin Coordinates: {pickup.latitude.toFixed(4)}° N, {pickup.longitude.toFixed(4)}° E
              </span>
              <span className="text-[#078A32] font-semibold">Marker A Synced</span>
            </div>

            {/* Quick Dhanbad Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">Quick Dhanbad Presets:</span>
              {getPresetLocations().slice(0, 3).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPickup(preset)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Address */}
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Destination / Drop Location</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActivePointerTarget('drop');
                    document.getElementById('visual-map-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#F0441D] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Compass className="w-3 h-3 text-[#F0441D]" />
                  <span>🎯 Pick on Visual Map</span>
                </button>

                {bookingType === 'LOCAL_CITY' && (
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('drop')}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Use My Location</span>
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              required
              value={drop.address}
              onChange={(e) => setDrop({ ...drop, address: e.target.value })}
              placeholder="Enter drop destination address..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
            />

            {/* Live Synchronized Pin Coordinates */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F0441D]" />
                Pin Coordinates: {drop.latitude.toFixed(4)}° N, {drop.longitude.toFixed(4)}° E
              </span>
              <span className="text-[#F0441D] font-semibold">Marker B Synced</span>
            </div>
          </div>

          {locationError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span>Continue to Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-black text-[#061B33]">Step 3: Date & Pickup Time</h2>
            <p className="text-xs text-slate-500 mt-1">
              All timings are strictly scheduled in Indian Standard Time (IST).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trip Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Pickup Time (IST)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>
            </div>
          </div>

          {/* Availability Schedule Notice */}
          {primaryVehicle?.availabilitySchedule && !primaryVehicle.availabilitySchedule.is24x7 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Primary Cab Operating Hours</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Operating Window: <strong>{primaryVehicle.availabilitySchedule.dailyStartTime || '06:00'}</strong> to{' '}
                <strong>{primaryVehicle.availabilitySchedule.dailyEndTime || '23:00'} IST</strong> (
                {primaryVehicle.availabilitySchedule.availableDays?.join(', ')}).
              </p>
            </div>
          )}

          {/* Warning if selected time is outside operating window */}
          {primaryVehicle?.availabilitySchedule &&
            !primaryVehicle.availabilitySchedule.is24x7 &&
            ((primaryVehicle.availabilitySchedule.dailyStartTime && pickupTime < primaryVehicle.availabilitySchedule.dailyStartTime) ||
              (primaryVehicle.availabilitySchedule.dailyEndTime && pickupTime > primaryVehicle.availabilitySchedule.dailyEndTime)) && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Notice: Your selected pickup time ({pickupTime} IST) is outside the cab&apos;s daily operating window ({primaryVehicle.availabilitySchedule.dailyStartTime} — {primaryVehicle.availabilitySchedule.dailyEndTime} IST).
                </span>
              </div>
            )}

          {/* Night Charge Indicator Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#078A32]" />
              <span>Standard Operational Windows</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Journeys beginning during night hours (10:00 PM to 06:00 AM) include the rate-card
              specified fixed night allowance of ₹300.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span>Review Route & Fare</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ROUTE & FARE BREAKDOWN */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#061B33]">Step 4: Route & Calculated Fare</h2>
                <p className="text-xs text-slate-500">
                  {distanceKm} km • ~{durationMinutes} minutes estimated travel time
                </p>
              </div>
              <span className="text-xs font-bold text-[#078A32] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Verified Highway Route
              </span>
            </div>

            {/* Interactive MapView */}
            <MapView
              pickup={pickup}
              drop={drop}
              distanceKm={distanceKm}
              durationMinutes={durationMinutes}
              height="h-64 sm:h-80"
            />

            {/* Itemized Fare Breakdown */}
            <FareBreakdown
              fare={currentFare}
              bookingType={bookingType}
              showEstimatedRange={bookingType !== 'LOCAL_CITY'}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all"
              >
                <span>Proceed to Confirmation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: FINAL CONFIRMATION & CONTACT DETAILS */}
      {step === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-black text-[#061B33]">Step 5: Confirm Passenger Details</h2>
            <p className="text-xs text-slate-500 mt-1">
              Our driver and operations desk will reach out on this phone number.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Passenger Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Amit Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone Number</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 block mb-1">
              Special Instructions / Landmark Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Near gate 2, carrying 2 suitcases, please call on arrival..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
            />
          </div>

          {/* Customer Authentication Requirement */}
          {!user ? (
            <div className="bg-emerald-50/70 border-2 border-emerald-400/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#078A32]" />
                  <span className="font-black text-sm text-[#061B33]">
                    {authTab === 'signup' ? 'Create Rider Account & Request' : 'Sign In to Your Account'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      authTab === 'signup' ? 'bg-[#078A32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Rider
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signin'); setAuthError(null); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      authTab === 'signin' ? 'bg-[#061B33] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {authTab === 'signup'
                  ? 'Create your customer account with your email and password below. Your ride will be dispatched immediately.'
                  : 'Enter your registered email and password to place your booking request.'}
              </p>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. rider@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#078A32] shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block">{user.name}</span>
                  <span className="text-slate-600">{user.phone || user.email}</span>
                </div>
              </div>
              <span className="text-[11px] font-extrabold uppercase bg-emerald-200/70 text-emerald-900 px-2.5 py-1 rounded-full">
                Verified Account ✓
              </span>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="bg-[#061B33] text-white p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-700">
              <span>{bookingType.replace('_', ' ')}</span>
              <span>
                {bookingDate} • {pickupTime} IST
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div className="truncate text-slate-200">
                <strong className="text-emerald-400">From:</strong> {pickup.address}
              </div>
              <div className="truncate text-slate-200">
                <strong className="text-rose-400">To:</strong> {drop.address}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Total Calculated Booking Amount</div>
                <div className="text-xl sm:text-2xl font-black text-[#42B900]">
                  ₹{currentFare.totalFare.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                <span>Payment: Cash / UPI to Driver</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleConfirmBooking}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 disabled:opacity-50 text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-xl transition-all"
            >
              {submitting ? (
                <span>Requesting Cab...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm Booking — ₹{currentFare.totalFare.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookCabPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-500">
          Loading booking wizard...
        </div>
      }
    >
      <BookCabContent />
    </Suspense>
  );
}

