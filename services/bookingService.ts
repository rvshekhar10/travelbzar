import {
  Booking,
  BookingStatus,
  BookingType,
  PaymentMethod,
  PaymentStatus,
  LocationCoordinate,
  AirportDetails,
} from '@/types';
import {
  saveBooking,
  getBookingById,
  getBookings,
  addNotification,
  addBookingEvent,
  getPricingConfig,
  getVehicles,
  getDrivers,
  updateDriverLocation,
} from '@/lib/firebase/store';
import { calculateFare, createPricingSnapshot } from './fareService';

// Status transition state machine
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_CONFIRMATION: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['DRIVER_EN_ROUTE', 'CANCELLED'],
  DRIVER_EN_ROUTE: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['TRIP_STARTED', 'CANCELLED'],
  TRIP_STARTED: ['TRIP_COMPLETED', 'CANCELLED'],
  TRIP_COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransitionStatus(current: BookingStatus, target: BookingStatus): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

/**
 * Generates human readable booking number: TBZ-YYYYMMDD-XXX
 */
export function generateBookingNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digits
  return `TBZ-${year}${month}${day}-${randomSuffix}`;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  reason?: string;
}

/**
 * Checks vehicle or driver booking conflicts with 30-minute buffer.
 */
export async function checkBookingConflict(
  vehicleId: string | undefined,
  driverId: string | undefined,
  bookingDate: string,
  pickupTime: string,
  durationMinutes = 120,
  excludeBookingId?: string
): Promise<ConflictCheckResult> {
  if (!vehicleId && !driverId) {
    return { hasConflict: false };
  }

  const allBookings = await getBookings();
  const activeStatuses: BookingStatus[] = [
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'TRIP_STARTED',
  ];

  const bufferMinutes = 30;

  // Convert target window to epoch minutes
  const [h, m] = pickupTime.split(':').map(Number);
  const targetStart = new Date(`${bookingDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).getTime();
  const targetEnd = targetStart + (durationMinutes + bufferMinutes) * 60 * 1000;

  for (const b of allBookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (!activeStatuses.includes(b.status)) continue;
    if (b.bookingDate !== bookingDate) continue;

    // Check same vehicle or same driver
    const isSameVehicle = vehicleId && b.vehicleId === vehicleId;
    const isSameDriver = driverId && b.driverId === driverId;

    if (!isSameVehicle && !isSameDriver) continue;

    const [bh, bm] = b.pickupTime.split(':').map(Number);
    const existingStart = new Date(`${b.bookingDate}T${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}:00`).getTime();
    const existingDuration = b.estimatedDurationMinutes || 120;
    const existingEnd = existingStart + (existingDuration + bufferMinutes) * 60 * 1000;

    // Overlap condition
    if (targetStart < existingEnd && targetEnd > existingStart) {
      const entity = isSameVehicle ? 'vehicle' : 'driver';
      return {
        hasConflict: true,
        conflictingBooking: b,
        reason: `Overlapping booking detected for ${entity} with Booking #${b.bookingNumber} (${b.pickupTime} IST). Includes 30-min buffer.`,
      };
    }
  }

  return { hasConflict: false };
}

export interface CreateBookingInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingType: BookingType;
  bookingDate: string;
  pickupTime: string;
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  airport?: AirportDetails;
  distanceKm: number;
  estimatedDurationMinutes: number;
  customerNotes?: string;
}

export async function createNewBooking(input: CreateBookingInput): Promise<Booking> {
  const config = await getPricingConfig();
  const pricingSnapshot = createPricingSnapshot(config);

  const fare = calculateFare(
    {
      bookingType: input.bookingType,
      distanceKm: input.distanceKm,
      durationMinutes: input.estimatedDurationMinutes,
      pickupTime: input.pickupTime,
      airportCode: input.airport?.code,
      flightDelayMinutes: input.airport?.delayMinutes || 0,
      isAirportPickup: input.bookingType === 'AIRPORT_PICKUP',
    },
    config
  );

  const id = `tbz-book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const bookingNumber = generateBookingNumber();

  const newBooking: Booking = {
    id,
    bookingNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    bookingType: input.bookingType,
    bookingDate: input.bookingDate,
    pickupTime: input.pickupTime,
    pickup: input.pickup,
    drop: input.drop,
    airport: input.airport,
    distanceKm: Math.round(input.distanceKm * 10) / 10,
    estimatedDurationMinutes: input.estimatedDurationMinutes,
    status: 'PENDING_CONFIRMATION',
    pricingSnapshot,
    fare,
    paymentStatus: 'PENDING',
    customerNotes: input.customerNotes,
    createdAt: new Date().toISOString(),
  };

  await saveBooking(newBooking);

  // Notify Owner
  await addNotification({
    userId: 'user-owner-1',
    title: 'New Booking Request',
    body: `${bookingNumber}: ${input.customerName} requested ${input.bookingType.replace('_', ' ')} on ${input.bookingDate} at ${input.pickupTime}.`,
    type: 'BOOKING_REQUESTED',
    bookingId: id,
  });

  // Audit event
  await addBookingEvent({
    bookingId: id,
    action: 'Booking Created',
    performedBy: input.customerName,
    role: 'customer',
    metadata: { bookingNumber, bookingType: input.bookingType, fare: fare.totalFare },
  });

  return newBooking;
}

export async function confirmBookingByOwner(
  bookingId: string,
  confirmedFareAmount?: number,
  assignedDriverId?: string,
  assignedVehicleId?: string
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  if (!canTransitionStatus(booking.status, 'CONFIRMED')) {
    return { success: false, error: `Cannot confirm booking in status ${booking.status}` };
  }

  // Conflict check if vehicle/driver assigned
  if (assignedVehicleId || assignedDriverId) {
    const conflict = await checkBookingConflict(
      assignedVehicleId,
      assignedDriverId,
      booking.bookingDate,
      booking.pickupTime,
      booking.estimatedDurationMinutes,
      booking.id
    );
    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason };
    }
  }

  let driverObj = undefined;
  if (assignedDriverId) {
    const drivers = await getDrivers();
    driverObj = drivers.find((d) => d.id === assignedDriverId);
  }

  let vehicleObj = undefined;
  if (assignedVehicleId) {
    const vehicles = await getVehicles();
    vehicleObj = vehicles.find((v) => v.id === assignedVehicleId);
  }

  // Update fare if confirmed amount provided
  const updatedFare = { ...booking.fare };
  if (confirmedFareAmount && confirmedFareAmount > 0) {
    const diff = confirmedFareAmount - updatedFare.baseFare;
    updatedFare.baseFare = confirmedFareAmount;
    updatedFare.totalFare = Math.round(updatedFare.totalFare + diff);
  }

  const nextStatus: BookingStatus = assignedDriverId ? 'DRIVER_ASSIGNED' : 'CONFIRMED';

  const updatedBooking: Booking = {
    ...booking,
    status: nextStatus,
    driverId: assignedDriverId || booking.driverId,
    driverName: driverObj?.name || booking.driverName,
    driverPhone: driverObj?.phone || booking.driverPhone,
    vehicleId: assignedVehicleId || booking.vehicleId,
    vehicleModel: vehicleObj ? `${vehicleObj.make} ${vehicleObj.model}` : booking.vehicleModel,
    vehicleRegistrationNumber: vehicleObj?.registrationNumber || booking.vehicleRegistrationNumber,
    fare: updatedFare,
    confirmedAt: new Date().toISOString(),
    driverAssignedAt: assignedDriverId ? new Date().toISOString() : undefined,
  };

  await saveBooking(updatedBooking);

  // Notify customer
  await addNotification({
    userId: booking.customerId,
    title: 'Booking Confirmed ✓',
    body: `Your booking #${booking.bookingNumber} is confirmed! Fare: ₹${updatedFare.totalFare.toLocaleString('en-IN')}. Driver details will appear here.`,
    type: 'BOOKING_CONFIRMED',
    bookingId: booking.id,
  });

  // Notify driver if assigned
  if (assignedDriverId) {
    await addNotification({
      userId: assignedDriverId,
      title: 'New Trip Assigned',
      body: `Booking #${booking.bookingNumber}: ${booking.pickup.address} → ${booking.drop.address} on ${booking.bookingDate} at ${booking.pickupTime}.`,
      type: 'DRIVER_ASSIGNED',
      bookingId: booking.id,
    });
  }

  // Audit event
  await addBookingEvent({
    bookingId: booking.id,
    action: 'Booking Confirmed',
    performedBy: 'Owner',
    role: 'owner',
    metadata: {
      confirmedFare: updatedFare.totalFare,
      driver: driverObj?.name,
      vehicle: vehicleObj?.registrationNumber,
    },
  });

  return { success: true };
}

export async function acceptBookingByDriver(
  bookingId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  if (booking.status !== 'PENDING_CONFIRMATION') {
    return { success: false, error: `Booking is already in status ${booking.status}` };
  }

  const drivers = await getDrivers();
  const driver = drivers.find((d) => d.id === driverId) || {
    id: driverId,
    name: 'Rajesh Kumar (Chauffeur)',
    phone: '+91 9876543210',
    assignedVehicleId: 'veh-1',
  };

  const vehicles = await getVehicles();
  const vehicle = vehicles.find((v) => v.id === driver.assignedVehicleId) || vehicles[0];

  const updatedBooking: Booking = {
    ...booking,
    status: 'DRIVER_ASSIGNED',
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    vehicleId: vehicle?.id || 'veh-1',
    vehicleModel: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Hyundai Venue',
    vehicleRegistrationNumber: vehicle?.registrationNumber || 'JH-10-BX-4421',
    confirmedAt: new Date().toISOString(),
    driverAssignedAt: new Date().toISOString(),
  };

  await saveBooking(updatedBooking);

  await addBookingEvent({
    bookingId: booking.id,
    action: 'Driver Accepted Ride',
    performedBy: driver.name,
    role: 'driver',
    metadata: {
      driverId: driver.id,
      vehicleId: vehicle?.id,
    },
  });

  await addNotification({
    userId: booking.customerId,
    title: 'Chauffeur Confirmed! ✓',
    body: `${driver.name} has accepted your trip #${booking.bookingNumber} in ${updatedBooking.vehicleModel} (${updatedBooking.vehicleRegistrationNumber}). Chauffeur is departing from garage.`,
    type: 'DRIVER_ASSIGNED',
    bookingId: booking.id,
  });

  return { success: true };
}

export async function updateBookingTripStatus(
  bookingId: string,
  newStatus: BookingStatus,
  actor: { name: string; role: 'customer' | 'driver' | 'owner'; id: string }
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  if (!canTransitionStatus(booking.status, newStatus)) {
    return { success: false, error: `Invalid transition from ${booking.status} to ${newStatus}` };
  }

  const updates: Partial<Booking> = { status: newStatus };
  const now = new Date().toISOString();

  if (newStatus === 'DRIVER_ARRIVED') {
    updates.arrivedAt = now;
    await addNotification({
      userId: booking.customerId,
      title: 'Driver Arrived at Pickup',
      body: `Your chauffeur ${booking.driverName || 'Driver'} has arrived in ${booking.vehicleModel || 'your cab'} (${booking.vehicleRegistrationNumber || ''}).`,
      type: 'DRIVER_ARRIVING',
      bookingId: booking.id,
    });
  } else if (newStatus === 'TRIP_STARTED') {
    updates.startedAt = now;
    // Activate location sharing
    if (booking.driverId) {
      await updateDriverLocation({
        bookingId: booking.id,
        driverId: booking.driverId,
        latitude: booking.pickup.latitude,
        longitude: booking.pickup.longitude,
        accuracy: 10,
        speed: 35,
        updatedAt: now,
        isSharing: true,
      });
    }
    await addNotification({
      userId: booking.customerId,
      title: 'Trip Started',
      body: `Your ride #${booking.bookingNumber} is now in progress. Track your live route in the app.`,
      type: 'TRIP_STARTED',
      bookingId: booking.id,
    });
  } else if (newStatus === 'TRIP_COMPLETED') {
    updates.completedAt = now;
    // Turn off location sharing
    if (booking.driverId) {
      await updateDriverLocation({
        bookingId: booking.id,
        driverId: booking.driverId,
        latitude: booking.drop.latitude,
        longitude: booking.drop.longitude,
        accuracy: 5,
        speed: 0,
        updatedAt: now,
        isSharing: false,
      });
    }
    await addNotification({
      userId: booking.customerId,
      title: 'Trip Completed ✓',
      body: `Your trip #${booking.bookingNumber} has been completed. Thank you for choosing Travel BZAR! View receipt for fare breakdown.`,
      type: 'TRIP_COMPLETED',
      bookingId: booking.id,
    });
    await addNotification({
      userId: 'user-owner-1',
      title: 'Trip Completed',
      body: `Trip #${booking.bookingNumber} marked completed by ${actor.name}. Total fare: ₹${booking.fare.totalFare.toLocaleString('en-IN')}.`,
      type: 'TRIP_COMPLETED',
      bookingId: booking.id,
    });
  } else if (newStatus === 'CANCELLED') {
    updates.cancelledAt = now;
    // Turn off location sharing
    if (booking.driverId) {
      await updateDriverLocation({
        bookingId: booking.id,
        driverId: booking.driverId,
        latitude: booking.pickup.latitude,
        longitude: booking.pickup.longitude,
        accuracy: 10,
        updatedAt: now,
        isSharing: false,
      });
    }
    await addNotification({
      userId: booking.customerId,
      title: 'Booking Cancelled',
      body: `Booking #${booking.bookingNumber} has been cancelled.`,
      type: 'BOOKING_CANCELLED',
      bookingId: booking.id,
    });
  }

  await saveBooking({ ...booking, ...updates });

  await addBookingEvent({
    bookingId: booking.id,
    action: `Status changed to ${newStatus}`,
    performedBy: actor.name,
    role: actor.role,
    metadata: { previousStatus: booking.status, newStatus },
  });

  return { success: true };
}

export async function cancelBooking(
  bookingId: string,
  reason: string,
  actor: { name: string; role: 'customer' | 'driver' | 'owner'; id: string }
): Promise<{ success: boolean; error?: string }> {
  return updateBookingTripStatus(bookingId, 'CANCELLED', actor);
}

export async function recordBookingPayment(
  bookingId: string,
  input: {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionReference?: string;
    collectedBy: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  const updatedBooking: Booking = {
    ...booking,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    paymentReference: input.transactionReference,
    paidAt: input.paymentStatus === 'PAID' ? new Date().toISOString() : booking.paidAt,
  };

  await saveBooking(updatedBooking);

  await addNotification({
    userId: booking.customerId,
    title: 'Payment Received',
    body: `Payment of ₹${input.amount.toLocaleString('en-IN')} via ${input.paymentMethod} has been recorded for booking #${booking.bookingNumber}.`,
    type: 'PAYMENT_RECEIVED',
    bookingId: booking.id,
  });

  await addBookingEvent({
    bookingId: booking.id,
    action: 'Payment Recorded',
    performedBy: input.collectedBy,
    role: 'driver',
    metadata: {
      amount: input.amount,
      method: input.paymentMethod,
      status: input.paymentStatus,
      reference: input.transactionReference,
    },
  });

  return { success: true };
}

export async function addChargesToBooking(
  bookingId: string,
  charges: {
    parkingCharge?: number;
    tollCharge?: number;
    stateTaxCharge?: number;
    cleaningCharge?: number;
    otherCharge?: number;
  },
  performedBy: string
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingById(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  const prevFare = booking.fare;
  const newParking = charges.parkingCharge !== undefined ? charges.parkingCharge : prevFare.parkingCharge;
  const newToll = charges.tollCharge !== undefined ? charges.tollCharge : prevFare.tollCharge;
  const newTax = charges.stateTaxCharge !== undefined ? charges.stateTaxCharge : prevFare.stateTaxCharge;
  const newCleaning = charges.cleaningCharge !== undefined ? charges.cleaningCharge : prevFare.cleaningCharge;
  const newOther = charges.otherCharge !== undefined ? charges.otherCharge : prevFare.otherCharge;

  const total = Math.round(
    prevFare.baseFare +
      prevFare.distanceCharge +
      prevFare.timeCharge +
      prevFare.waitingCharge +
      prevFare.airportDelayCharge +
      prevFare.nightCharge +
      newParking +
      newToll +
      newTax +
      newCleaning +
      newOther
  );

  const updatedBooking: Booking = {
    ...booking,
    fare: {
      ...prevFare,
      parkingCharge: newParking,
      tollCharge: newToll,
      stateTaxCharge: newTax,
      cleaningCharge: newCleaning,
      otherCharge: newOther,
      totalFare: total,
    },
  };

  await saveBooking(updatedBooking);

  await addBookingEvent({
    bookingId: booking.id,
    action: 'Additional Charges Updated',
    performedBy,
    role: 'owner',
    metadata: { charges, newTotal: total },
  });

  return { success: true };
}
