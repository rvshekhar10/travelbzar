// Core Domain Types for Travel BZAR

export type UserRole = 'customer' | 'driver' | 'owner';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export type BookingType = 'LOCAL_CITY' | 'AIRPORT_PICKUP' | 'AIRPORT_DROP';

export type BookingStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER';

export interface LocationCoordinate {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  landmark?: string;
}

export interface AirportDetails {
  name: string; // e.g. "Ranchi Airport (IXR)"
  code: 'IXR' | 'DGH' | 'RDP' | string;
  flightNumber?: string;
  expectedArrival?: string;
  actualArrival?: string;
  delayMinutes?: number;
  isOwnerReviewRequired?: boolean;
}

export interface PricingSnapshot {
  baseFare: number;
  includedKm: number;
  includedHours: number;
  extraKmRate: number;
  extraHourRate: number;
  waitingRate: number;
  nightCharge: number;
  airportDelayCharge: number;
}

export interface FareCalculation {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  waitingCharge: number;
  airportDelayCharge: number;
  nightCharge: number;
  parkingCharge: number;
  tollCharge: number;
  stateTaxCharge: number;
  cleaningCharge: number;
  otherCharge: number;
  totalFare: number;
  estimatedMinFare?: number;
  estimatedMaxFare?: number;
  isOwnerReviewRequired?: boolean;
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. TBZ-20260924-001

  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;

  vehicleId?: string;
  vehicleModel?: string;
  vehicleRegistrationNumber?: string;

  bookingType: BookingType;
  bookingDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm in IST

  pickup: LocationCoordinate;
  drop: LocationCoordinate;

  airport?: AirportDetails;

  distanceKm: number;
  estimatedDurationMinutes: number;

  status: BookingStatus;

  pricingSnapshot: PricingSnapshot;
  fare: FareCalculation;

  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;

  customerNotes?: string;
  driverNotes?: string;
  ownerNotes?: string;

  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  driverAssignedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE' | 'INACTIVE';

export interface VehicleAvailabilitySchedule {
  is24x7: boolean;
  dailyStartTime?: string; // HH:mm format, e.g. "06:00"
  dailyEndTime?: string; // HH:mm format, e.g. "23:00"
  availableDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  notes?: string; // e.g. "Stationed at Dhanbad Base"
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // e.g. JH-10-BX-1234
  make: string; // e.g. Hyundai
  model: string; // e.g. Venue / Creta
  variant?: string; // SX / Turbo
  color: string;
  vehicleType: string; // Premium Sedan / Compact SUV
  year: number;
  photo?: string;
  status: VehicleStatus;
  currentDriverId?: string;
  availabilitySchedule?: VehicleAvailabilitySchedule;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  profilePhoto?: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  assignedVehicleId?: string;
  totalTrips?: number;
  rating?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number | null;
    speed?: number | null;
    updatedAt: string;
    isSharing: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface DriverLocation {
  bookingId?: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
  isSharing: boolean;
  dutyStatus?: 'ON_DUTY' | 'EN_ROUTE' | 'ON_TRIP' | 'RETURNING_TO_GARAGE' | 'OFF_DUTY';
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
    | 'BOOKING_REQUESTED'
    | 'BOOKING_CONFIRMED'
    | 'DRIVER_ASSIGNED'
    | 'DRIVER_ARRIVING'
    | 'TRIP_STARTED'
    | 'TRIP_COMPLETED'
    | 'PAYMENT_RECEIVED'
    | 'BOOKING_CANCELLED'
    | 'SYSTEM_ALERT';
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  action: string;
  performedBy: string;
  role: UserRole;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AirportPricingConfig {
  name: string;
  code: string;
  minimumFare: number;
  maximumFare: number;
  distanceKmApprox: number;
}

export interface PricingConfig {
  localBaseFare: number; // ₹2400
  localIncludedHours: number; // 8
  localIncludedKm: number; // 80
  localExtraKmRate: number; // ₹14
  localExtraHourRate: number; // ₹150

  airports: Record<string, AirportPricingConfig>;

  airportDelayCharge: number; // ₹500 fixed
  airportDelayMaxHours: number; // 4 hours

  waitingFreeMinutes: number; // 15
  waitingRatePerMinute: number; // ₹3

  nightCharge: number; // ₹300
  nightStart: string; // "22:00"
  nightEnd: string; // "06:00"

  cleaningMin: number; // ₹500
  cleaningMax: number; // ₹1500

  bookingBufferMinutes: number; // 30 minutes
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string;
  collectedBy: string;
  transactionReference?: string;
  notes?: string;
}
