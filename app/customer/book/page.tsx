'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { usePricing } from '@/hooks/usePricing';
import { useVehicles } from '@/hooks/useVehicles';
import { BookingType, LocationCoordinate, AirportDetails, Booking, RouteStop } from '@/types';
import { BUSINESS_CONFIG } from '@/config/business';
import {
  calculateMultiStopRouteDistance,
  getPresetLocations,
  RouteLeg,
} from '@/services/mapService';
import { calculateFare } from '@/services/fareService';
import { createNewBooking } from '@/services/bookingService';
import { getCurrentDeviceLocation } from '@/services/locationService';
import { MapView } from '@/components/maps/MapView';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';
import { MinimalLocationPinModal } from '@/components/maps/MinimalLocationPinModal';
import {
  Car,
  Plane,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Navigation,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function BookCabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, registerCustomer } = useAuth();
  const { pricing } = usePricing();
  const { vehicles } = useVehicles();
  const primaryVehicle = vehicles[0];

  // Simplified 3-Step Flow:
  // Step 1: Ride Details (Pickup, Drop, Service Type, When)
  // Step 2: Route & Fare Preview (Map, Distance, Fare Card, Optional Halts)
  // Step 3: Passenger & Confirmation (Phone, Name, One-Tap Confirm)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [locationDetecting, setLocationDetecting] = useState(false);

  // Auth requirement for guest riders
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

  // Locations
  const defaultDhanbad: LocationCoordinate = {
    address: 'Dhanbad Junction Railway Station, Station Rd, Dhanbad, Jharkhand 826001',
    latitude: 23.7915,
    longitude: 86.4295,
  };

  const presetSuggestions = useMemo(
    () =>
      getPresetLocations().map((p) => ({
        label: p.label,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    []
  );

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

  // Contact Info
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '');

  // Stops & Calculations
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [showStopsSection, setShowStopsSection] = useState(false);
  const [activePinPointer, setActivePinPointer] = useState<string | null>(null); // 'pickup' | 'drop' | 'stop-0' | null
  const [distanceKm, setDistanceKm] = useState<number>(150);
  const [durationMinutes, setDurationMinutes] = useState<number>(210);
  const [drivingDurationMinutes, setDrivingDurationMinutes] = useState<number>(210);
  const [totalHaltMinutes, setTotalHaltMinutes] = useState<number>(0);
  const [driverStayNights, setDriverStayNights] = useState<number>(0);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);

  // Update default locations on booking type change
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
      setPickup(defaultDhanbad);
      setDrop({
        address: 'Local Dhanbad Sightseeing / Corporate Circuit, Dhanbad, Jharkhand',
        latitude: 23.8189,
        longitude: 86.4567,
      });
    }
  }, [bookingType, selectedAirportCode]);

  // Recalculate route whenever locations or stops change
  useEffect(() => {
    let isCurrent = true;
    const calculate = async () => {
      try {
        const route = await calculateMultiStopRouteDistance(pickup, stops, drop);
        if (isCurrent) {
          setDistanceKm(route.distanceKm);
          setDrivingDurationMinutes(route.drivingDurationMinutes);
          setTotalHaltMinutes(route.totalHaltMinutes);
          setDurationMinutes(route.totalDurationMinutes);
          setRouteLegs(route.legs);
        }
      } catch (e) {
        console.info('Route calc info:', e);
      }
    };
    calculate();
    return () => {
      isCurrent = false;
    };
  }, [
    pickup.latitude,
    pickup.longitude,
    drop.latitude,
    drop.longitude,
    JSON.stringify(stops.map((s) => [s.address, s.latitude, s.longitude, s.haltDurationMinutes])),
  ]);

  // Fare
  const currentFare = calculateFare(
    {
      bookingType,
      distanceKm,
      durationMinutes,
      pickupTime,
      airportCode: selectedAirportCode,
      flightDelayMinutes: bookingType === 'AIRPORT_PICKUP' ? flightDelayMinutes : 0,
      isAirportPickup: bookingType === 'AIRPORT_PICKUP',
      haltMinutes: totalHaltMinutes,
      driverStayNights,
    },
    pricing
  );

  // Quick GPS
  const handleUseCurrentLocation = async (target: 'pickup' | 'drop') => {
    setLocationDetecting(true);
    try {
      const loc = await getCurrentDeviceLocation();
      loc.address = `GPS: Near ${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)} (Dhanbad)`;
      if (target === 'pickup') setPickup(loc);
      else setDrop(loc);
    } catch {
      alert('Could not access current location. Please type your location.');
    } finally {
      setLocationDetecting(false);
    }
  };

  // Add Stop
  const handleAddStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      address: '',
      latitude: 23.8143,
      longitude: 86.4412,
      stopOrder: stops.length + 1,
      haltDurationMinutes: 30,
      haltReason: 'Refreshment',
    };
    setStops([...stops, newStop]);
    setShowStopsSection(true);
  };

  const handleRemoveStop = (idx: number) => {
    const updated = stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stopOrder: i + 1 }));
    setStops(updated);
    if (updated.length === 0) setShowStopsSection(false);
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    setAuthError(null);
    let activeUser = user;

    if (!activeUser) {
      if (!customerName.trim() || !customerPhone.trim()) {
        setAuthError('Please enter your name and phone number.');
        return;
      }
      if (!authEmail.trim() || !authPassword.trim()) {
        setAuthError('Please enter your email and password to secure your ride.');
        return;
      }
      setSubmitting(true);
      if (authTab === 'signup') {
        const regRes = await registerCustomer(customerName, authEmail, authPassword, customerPhone);
        if (!regRes.success || !regRes.user) {
          setAuthError(regRes.error || 'Failed to create account. Please check details.');
          setSubmitting(false);
          return;
        }
        activeUser = regRes.user;
      } else {
        const loginRes = await login(authEmail, authPassword);
        if (!loginRes.success || !loginRes.user) {
          setAuthError(loginRes.error || 'Invalid credentials. Please verify email and password.');
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
            name:
              selectedAirportCode === 'IXR'
                ? 'Ranchi Airport'
                : selectedAirportCode === 'DGH'
                  ? 'Deoghar Airport'
                  : 'Durgapur Airport',
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
        stops: stops.length > 0 ? stops : undefined,
        totalHaltMinutes,
        driverStayNights: driverStayNights > 0 ? driverStayNights : undefined,
        airport: airportDetails,
        distanceKm,
        estimatedDurationMinutes: durationMinutes,
        customerNotes,
      });

      router.push(`/customer/bookings/${newBooking.id}`);
    } catch (err) {
      console.error('Booking failed:', err);
      setSubmitting(false);
    }
  };

  // ── Success Screen ──
  if (confirmedBooking) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Ride Requested!</h1>
        <p className="text-sm text-slate-600">Booking Ref: {confirmedBooking.bookingNumber}</p>
        <button
          onClick={() => router.push(`/customer/bookings/${confirmedBooking.id}`)}
          className="w-full bg-[#078A32] text-white font-extrabold py-4 rounded-2xl shadow-lg"
        >
          Track Cab Live
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6 max-w-2xl mx-auto space-y-4">
      {/* 3-Step Simple Progress Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Book a Cab</h1>
          <p className="text-xs text-slate-500 font-medium">
            {step === 1 && 'Step 1 of 3: Trip details'}
            {step === 2 && 'Step 2 of 3: Fare & Route preview'}
            {step === 3 && 'Step 3 of 3: Passenger details'}
          </p>
        </div>

        {/* Minimal Steps indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              onClick={() => s < step && setStep(s as 1 | 2 | 3)}
              className={`h-2 rounded-full transition-all ${step === s
                  ? 'w-8 bg-[#078A32]'
                  : s < step
                    ? 'w-4 bg-emerald-200 cursor-pointer'
                    : 'w-4 bg-slate-200'
                }`}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 1: RIDE DETAILS (Simple Uber-like inputs)                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          {/* Service Selector Tabs */}
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Select Trip Type
            </div>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setBookingType('AIRPORT_DROP')}
                className={`py-3.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${bookingType === 'AIRPORT_DROP'
                    ? 'bg-white text-slate-900 border-2 border-[#078A32] shadow-md ring-2 ring-emerald-100 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-2 border-transparent'
                  }`}
              >
                <div className={`p-1.5 rounded-lg ${bookingType === 'AIRPORT_DROP' ? 'bg-orange-100 text-[#F0441D]' : 'bg-slate-100 text-slate-500'}`}>
                  <Plane className="w-4 h-4 -rotate-45" />
                </div>
                <div className="flex items-center gap-1">
                  <span>Airport Drop</span>
                  {bookingType === 'AIRPORT_DROP' && <span className="w-1.5 h-1.5 rounded-full bg-[#078A32]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingType('AIRPORT_PICKUP')}
                className={`py-3.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${bookingType === 'AIRPORT_PICKUP'
                    ? 'bg-white text-slate-900 border-2 border-[#078A32] shadow-md ring-2 ring-emerald-100 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-2 border-transparent'
                  }`}
              >
                <div className={`p-1.5 rounded-lg ${bookingType === 'AIRPORT_PICKUP' ? 'bg-orange-100 text-[#F0441D]' : 'bg-slate-100 text-slate-500'}`}>
                  <Plane className="w-4 h-4 rotate-45" />
                </div>
                <div className="flex items-center gap-1">
                  <span>Airport Pickup</span>
                  {bookingType === 'AIRPORT_PICKUP' && <span className="w-1.5 h-1.5 rounded-full bg-[#078A32]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingType('LOCAL_CITY')}
                className={`py-3.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${bookingType === 'LOCAL_CITY'
                    ? 'bg-white text-slate-900 border-2 border-[#078A32] shadow-md ring-2 ring-emerald-100 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-2 border-transparent'
                  }`}
              >
                <div className={`p-1.5 rounded-lg ${bookingType === 'LOCAL_CITY' ? 'bg-emerald-100 text-[#078A32]' : 'bg-slate-100 text-slate-500'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span>Local City</span>
                  {bookingType === 'LOCAL_CITY' && <span className="w-1.5 h-1.5 rounded-full bg-[#078A32]" />}
                </div>
              </button>
            </div>
          </div>

          {/* Quick Airport Selector Chips (Only if Airport Ride) */}
          {bookingType !== 'LOCAL_CITY' && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Choose Airport Destination
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'IXR', name: 'Ranchi', detail: 'IXR Airport' },
                  { code: 'DGH', name: 'Deoghar', detail: 'DGH Airport' },
                  { code: 'RDP', name: 'Durgapur', detail: 'RDP Airport' },
                ].map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => setSelectedAirportCode(a.code)}
                    className={`py-2.5 px-3 rounded-xl text-center border-2 transition-all cursor-pointer ${selectedAirportCode === a.code
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <div className="text-xs font-black">{a.name}</div>
                    <div className={`text-[10px] font-semibold ${selectedAirportCode === a.code ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {a.detail}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Inputs Card */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md space-y-5">
            {/* Pickup */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#078A32] ring-4 ring-emerald-100" />
                  <span>Pickup Location</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActivePinPointer(activePinPointer === 'pickup' ? null : 'pickup')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer border-2 ${
                      activePinPointer === 'pickup'
                        ? 'bg-[#078A32] text-white border-[#078A32] shadow-sm'
                        : 'bg-emerald-50 text-[#078A32] border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{activePinPointer === 'pickup' ? 'Hide Map' : 'Set on Map'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('pickup')}
                    disabled={locationDetecting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-slate-600 ${locationDetecting ? 'animate-spin' : ''}`} />
                    <span>{locationDetecting ? 'Locating...' : 'Use GPS'}</span>
                  </button>
                </div>
              </div>
              <AddressAutocompleteInput
                value={pickup.address}
                onChange={(val) => setPickup({ ...pickup, address: val })}
                onSelect={(suggestion) =>
                  setPickup({
                    address: suggestion.address,
                    latitude: suggestion.latitude,
                    longitude: suggestion.longitude,
                  })
                }
                placeholder="Type pickup hotel, area, or landmark..."
                focusRingClass="focus:ring-emerald-100"
                accentClass="hover:bg-emerald-50"
                accentIconColor="#078A32"
                searchBias="Dhanbad, Jharkhand, India"
                localSuggestions={presetSuggestions}
                required
              />

              {/* Minimal Expandable Map Pin for Pickup */}
              {activePinPointer === 'pickup' && (
                <MinimalLocationPinModal
                  location={pickup}
                  onChange={(loc) => setPickup(loc)}
                  label="Pickup Pin for Driver Navigation"
                  pinColor="#078A32"
                  height="h-48 sm:h-56"
                />
              )}
            </div>

            {/* Optional Stops Added in Step 1 */}
            {stops.map((stop, idx) => {
              const stopKey = `stop-${idx}`;
              return (
                <div key={stop.id || idx} className="pt-4 border-t-2 border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <span>Stop #{idx + 1}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActivePinPointer(activePinPointer === stopKey ? null : stopKey)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer border-2 ${
                          activePinPointer === stopKey
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{activePinPointer === stopKey ? 'Hide Map' : 'Set on Map'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 transition-all active:scale-95 cursor-pointer"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <AddressAutocompleteInput
                    value={stop.address}
                    onChange={(val) => {
                      const updated = [...stops];
                      updated[idx].address = val;
                      setStops(updated);
                    }}
                    onSelect={(sug) => {
                      const updated = [...stops];
                      updated[idx].address = sug.address;
                      updated[idx].latitude = sug.latitude;
                      updated[idx].longitude = sug.longitude;
                      setStops(updated);
                    }}
                    placeholder={`Stop #${idx + 1} address or landmark`}
                    focusRingClass="focus:ring-amber-100"
                    accentClass="hover:bg-amber-50"
                    accentIconColor="#f59e0b"
                    searchBias="Dhanbad, Jharkhand, India"
                    localSuggestions={presetSuggestions}
                  />

                  {/* Minimal Expandable Map Pin for Stop */}
                  {activePinPointer === stopKey && (
                    <MinimalLocationPinModal
                      location={{
                        address: stop.address,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                      }}
                      onChange={(loc) => {
                        const updated = [...stops];
                        updated[idx].address = loc.address;
                        updated[idx].latitude = loc.latitude;
                        updated[idx].longitude = loc.longitude;
                        setStops(updated);
                      }}
                      label={`Stop #${idx + 1} Exact Pin`}
                      pinColor="#f59e0b"
                      height="h-48 sm:h-56"
                    />
                  )}
                </div>
              );
            })}

            {/* Destination */}
            <div className="pt-4 border-t-2 border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F0441D] ring-4 ring-rose-100" />
                  <span>Where To? (Drop)</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActivePinPointer(activePinPointer === 'drop' ? null : 'drop')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer border-2 ${
                      activePinPointer === 'drop'
                        ? 'bg-[#F0441D] text-white border-[#F0441D] shadow-sm'
                        : 'bg-orange-50 text-[#F0441D] border-orange-300 hover:bg-orange-100 hover:border-orange-400'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{activePinPointer === 'drop' ? 'Hide Map' : 'Set on Map'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600" />
                    <span>+ Add Stop</span>
                  </button>
                </div>
              </div>
              <AddressAutocompleteInput
                value={drop.address}
                onChange={(val) => setDrop({ ...drop, address: val })}
                onSelect={(suggestion) =>
                  setDrop({
                    address: suggestion.address,
                    latitude: suggestion.latitude,
                    longitude: suggestion.longitude,
                  })
                }
                placeholder="Enter destination address or airport..."
                focusRingClass="focus:ring-rose-100"
                accentClass="hover:bg-orange-50"
                accentIconColor="#F0441D"
                searchBias="Jharkhand, India"
                localSuggestions={presetSuggestions}
                required
              />

              {/* Minimal Expandable Map Pin for Drop */}
              {activePinPointer === 'drop' && (
                <MinimalLocationPinModal
                  location={drop}
                  onChange={(loc) => setDrop(loc)}
                  label="Drop-off Pin for Driver Navigation"
                  pinColor="#F0441D"
                  height="h-48 sm:h-56"
                />
              )}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pick Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Time</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Big Clear Primary CTA Button */}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-[0.99] text-white font-black text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>See Prices & Route</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 2: ROUTE & FARE PREVIEW (Transparent & Simple)             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          {/* Route Map (Clear visual) */}
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <MapView
              pickup={pickup}
              drop={drop}
              stops={stops}
              distanceKm={distanceKm}
              durationMinutes={durationMinutes}
              totalHaltMinutes={totalHaltMinutes}
              height="h-56 sm:h-64"
            />
          </div>

          {/* Vehicle & Price Card (Like Uber) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Car className="w-6 h-6 text-[#42B900]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model}` : 'Comfort AC Sedan'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {distanceKm} km • ~{Math.round(durationMinutes / 60)} hrs travel time
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-[#078A32]">
                  ₹{currentFare.totalFare.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Fixed Estimate</div>
              </div>
            </div>

            {/* Inclusions summary */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Dedicated AC Cab</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Doorstep Pickup</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#078A32]" />
                <span>No Surge Pricing</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Cash or UPI to driver</span>
              </div>
            </div>

            {/* Extra Costs & Exclusions Notice - Bold & Transparent */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Other Costs & Extras (Payable At Actuals)
                </span>
              </div>
              <ul className="text-xs font-bold space-y-1 list-disc list-inside text-amber-900">
                <li>
                  <span className="font-extrabold text-slate-900">Tolls & State Border Tax:</span> Extra at actual toll receipts during trip
                </li>
                <li>
                  <span className="font-extrabold text-slate-900">Airport / Station Parking:</span> Extra at actuals if applicable
                </li>
                <li>
                  <span className="font-extrabold text-slate-900">Waiting / Extra Halts:</span> 30 mins free; standard waiting rate card applies after
                </li>
              </ul>
            </div>

            {/* Optional Trip Preferences Accordion */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowStopsSection(!showStopsSection)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 py-1"
              >
                <span>Add Halt / Driver Night Stay (Optional)</span>
                {showStopsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showStopsSection && (
                <div className="pt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Overnight Driver Stay:</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setDriverStayNights(n)}
                          className={`px-3 py-1 rounded-lg font-bold border transition-all ${driverStayNights === n
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200'
                            }`}
                        >
                          {n === 0 ? 'None' : `${n} Night`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-4 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Trip</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-[#078A32] hover:bg-[#056B27] active:scale-[0.99] text-white font-black text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue with ₹{currentFare.totalFare.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 3: PASSENGER & CONFIRMATION                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          {/* Booking Summary Pill */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <div className="font-black text-sm text-[#42B900]">
                ₹{currentFare.totalFare.toLocaleString('en-IN')}
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                {bookingDate} at {pickupTime} IST
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <span className="block font-bold text-white">{bookingType.replace('_', ' ')}</span>
              <span>Pay after ride</span>
            </div>
          </div>

          {/* Passenger details */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">Passenger Contact</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 bg-white shadow-xs text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#078A32] focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 bg-white shadow-xs text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#078A32] focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* Special instruction notes */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  Driver Note / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Near main gate, luggage assistance needed"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#078A32] focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Quick account setup if not logged in */}
            {!user ? (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {authTab === 'signup' ? 'Create rider password' : 'Sign In'}
                  </span>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAuthTab('signup')}
                      className={`px-2 py-0.5 rounded-md font-bold ${authTab === 'signup' ? 'bg-[#078A32] text-white' : 'text-slate-500'
                        }`}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('signin')}
                      className={`px-2 py-0.5 rounded-md font-bold ${authTab === 'signin' ? 'bg-slate-900 text-white' : 'text-slate-500'
                        }`}
                    >
                      Login
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                  />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#078A32]" />
                  <span className="font-bold text-slate-800">{user.name || user.email}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-[#078A32]">Logged In</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-4 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={submitting}
              className="flex-1 bg-[#078A32] hover:bg-[#056B27] active:scale-[0.99] disabled:opacity-50 text-white font-black text-base py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {submitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Request Cab Now</span>
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
          Loading booking...
        </div>
      }
    >
      <BookCabContent />
    </Suspense>
  );
}
