import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';
import {
  Booking,
  BookingEvent,
  Driver,
  DriverLocation,
  InAppNotification,
  PricingConfig,
  Vehicle,
  AppUser,
} from '@/types';
import { DEFAULT_PRICING_CONFIG } from '@/config/business';

// Local storage key for fallback persistence
const LOCAL_STORAGE_KEY = 'travelbzar_poc_data_v1';

interface LocalStoreState {
  users: Record<string, AppUser>;
  pricing: PricingConfig;
  vehicles: Record<string, Vehicle>;
  drivers: Record<string, Driver>;
  bookings: Record<string, Booking>;
  notifications: Record<string, InAppNotification>;
  events: Record<string, BookingEvent[]>;
  locations: Record<string, DriverLocation>; // key: bookingId
}

const DEFAULT_STATE: LocalStoreState = {
  users: {
    'user-owner-1': {
      id: 'user-owner-1',
      role: 'owner',
      name: 'Travel BZAR Owner',
      email: 'owner@travelbzar.com',
      phone: '+91 9007210697',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    'user-driver-1': {
      id: 'user-driver-1',
      role: 'driver',
      name: 'Rajesh Kumar (Chauffeur)',
      email: 'driver@travelbzar.com',
      phone: '+91 9876543210',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    'user-customer-1': {
      id: 'user-customer-1',
      role: 'customer',
      name: 'Amit Sharma',
      email: 'customer@travelbzar.com',
      phone: '+91 9431100000',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  },
  pricing: DEFAULT_PRICING_CONFIG,
  vehicles: {
    'veh-1': {
      id: 'veh-1',
      registrationNumber: 'JH-10-BX-1001',
      make: 'Hyundai',
      model: 'Venue SX',
      variant: 'Turbo Petrol',
      color: 'Polar White',
      vehicleType: 'Compact SUV',
      year: 2024,
      status: 'AVAILABLE',
      currentDriverId: 'drv-1',
      notes: 'Pristine AC cab, verified condition',
      createdAt: new Date().toISOString(),
    },
  },
  drivers: {
    'drv-1': {
      id: 'drv-1',
      name: 'Rajesh Kumar',
      phone: '+91 9876543210',
      email: 'driver@travelbzar.com',
      licenseNumber: 'JH10-2018-0045892',
      licenseExpiry: '2030-05-15',
      status: 'ACTIVE',
      assignedVehicleId: 'veh-1',
      totalTrips: 142,
      rating: 4.9,
      createdAt: new Date().toISOString(),
    },
  },
  bookings: {},
  notifications: {},
  events: {},
  locations: {},
};

// Listeners map for in-app reactive events
type ListenerCallback = (data: unknown) => void;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
}

export function subscribeToStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Strip undefined fields recursively so Firestore setDoc never throws Unsupported field value: undefined
function cleanForFirestore<T>(data: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

function getLocalState(): LocalStoreState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveLocalState(state: LocalStoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    notifyListeners();
  } catch (err) {
    console.error('Failed to save store state to localStorage:', err);
  }
}

// ==========================================
// PRICING CONFIG
// ==========================================
export async function getPricingConfig(): Promise<PricingConfig> {
  if (db) {
    try {
      const docRef = doc(db, 'pricingConfig', 'default');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as PricingConfig;
      }
    } catch (err) {
      console.info('Using local pricing store:', err);
    }
  }
  const state = getLocalState();
  return state.pricing || DEFAULT_PRICING_CONFIG;
}

export async function savePricingConfig(config: PricingConfig): Promise<void> {
  const updated = { ...config, updatedAt: new Date().toISOString() };
  if (db) {
    try {
      await setDoc(doc(db, 'pricingConfig', 'default'), cleanForFirestore(updated), { merge: true });
    } catch (err) {
      console.warn('Firestore pricing save fallback to local:', err);
    }
  }
  const state = getLocalState();
  state.pricing = updated;
  saveLocalState(state);
}

// ==========================================
// VEHICLES (Max 2 Vehicles)
// ==========================================
export async function getVehicles(): Promise<Vehicle[]> {
  if (db) {
    try {
      const q = query(collection(db, 'vehicles'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Vehicle);
      }
    } catch (err) {
      console.info('Using local vehicles store:', err);
    }
  }
  const state = getLocalState();
  return Object.values(state.vehicles);
}

export async function saveVehicle(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
  const state = getLocalState();
  const currentVehicles = Object.values(state.vehicles);

  // Check max 1 vehicle rule
  if (!state.vehicles[vehicle.id] && currentVehicles.length >= 1) {
    return { success: false, error: 'Fleet limit reached. Currently only 1 active vehicle is permitted.' };
  }

  const updatedVehicle: Vehicle = {
    ...vehicle,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, 'vehicles', vehicle.id), cleanForFirestore(updatedVehicle), { merge: true });
    } catch (err) {
      console.warn('Firestore vehicle save fallback to local:', err);
    }
  }

  state.vehicles[vehicle.id] = updatedVehicle;
  saveLocalState(state);
  return { success: true };
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  if (db) {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vehicles', vehicleId));
    } catch (err) {
      console.warn('Firestore delete vehicle fallback:', err);
    }
  }
  const state = getLocalState();
  delete state.vehicles[vehicleId];
  // Unassign from drivers
  Object.values(state.drivers).forEach((d) => {
    if (d.assignedVehicleId === vehicleId) {
      d.assignedVehicleId = undefined;
    }
  });
  saveLocalState(state);
}

// ==========================================
// DRIVERS
// ==========================================
export async function getDrivers(): Promise<Driver[]> {
  if (db) {
    try {
      const q = query(collection(db, 'drivers'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Driver);
      }
    } catch (err) {
      console.info('Using local drivers store:', err);
    }
  }
  const state = getLocalState();
  return Object.values(state.drivers);
}

export async function saveDriver(driver: Driver): Promise<void> {
  const updatedDriver: Driver = {
    ...driver,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, 'drivers', driver.id), cleanForFirestore(updatedDriver), { merge: true });
    } catch (err) {
      console.warn('Firestore driver save fallback to local:', err);
    }
  }

  const state = getLocalState();
  state.drivers[driver.id] = updatedDriver;

  // 1. Provision user auth record for driver login
  const driverUserId = `user-${driver.id}`;
  const driverUser: AppUser = {
    id: driverUserId,
    role: 'driver',
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  state.users[driverUserId] = driverUser;

  if (db) {
    try {
      await setDoc(doc(db, 'users', driverUserId), cleanForFirestore(driverUser), { merge: true });
    } catch (e) {
      // non-fatal
    }
  }

  // 2. Link driver to assigned vehicle if provided
  if (driver.assignedVehicleId && state.vehicles[driver.assignedVehicleId]) {
    state.vehicles[driver.assignedVehicleId].currentDriverId = driver.id;
    if (db) {
      try {
        await setDoc(doc(db, 'vehicles', driver.assignedVehicleId), { currentDriverId: driver.id }, { merge: true });
      } catch (e) {
        // non-fatal
      }
    }
  }

  saveLocalState(state);
}

// ==========================================
// BOOKINGS
// ==========================================
export async function getBookings(filters?: {
  customerId?: string;
  driverId?: string;
  status?: string;
}): Promise<Booking[]> {
  if (db) {
    try {
      let q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      if (filters?.customerId) {
        q = query(collection(db, 'bookings'), where('customerId', '==', filters.customerId));
      } else if (filters?.driverId) {
        q = query(collection(db, 'bookings'), where('driverId', '==', filters.driverId));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Booking);
      }
    } catch (err) {
      console.info('Using local bookings store:', err);
    }
  }

  const state = getLocalState();
  let list = Object.values(state.bookings);

  if (filters?.customerId) {
    list = list.filter((b) => b.customerId === filters.customerId);
  }
  if (filters?.driverId) {
    list = list.filter((b) => b.driverId === filters.driverId);
  }
  if (filters?.status) {
    list = list.filter((b) => b.status === filters.status);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'bookings', bookingId));
      if (snap.exists()) {
        return snap.data() as Booking;
      }
    } catch (err) {
      console.info('Using local booking lookup:', err);
    }
  }
  const state = getLocalState();
  return state.bookings[bookingId] || null;
}

export async function saveBooking(booking: Booking): Promise<void> {
  const updatedBooking: Booking = {
    ...booking,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, 'bookings', booking.id), cleanForFirestore(updatedBooking), { merge: true });
    } catch (err) {
      console.warn('Firestore booking save fallback to local:', err);
    }
  }

  const state = getLocalState();
  state.bookings[booking.id] = updatedBooking;
  saveLocalState(state);
}

// ==========================================
// DRIVER LIVE LOCATION (Continuous & Trip-based)
// ==========================================
export async function updateDriverLocation(location: DriverLocation): Promise<void> {
  const payload = {
    ...location,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      // 1. Save to driverLocations for continuous owner tracking
      if (location.driverId) {
        await setDoc(doc(db, 'driverLocations', location.driverId), cleanForFirestore(payload), { merge: true });
        await setDoc(
          doc(db, 'drivers', location.driverId),
          {
            currentLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              heading: location.heading,
              speed: location.speed,
              updatedAt: payload.updatedAt,
              isSharing: location.isSharing,
            },
          },
          { merge: true }
        );
      }

      // 2. If part of an active booking trip, also save to activeTrips
      if (location.bookingId) {
        await setDoc(doc(db, 'activeTrips', location.bookingId), cleanForFirestore(payload), { merge: true });
      }
    } catch (err) {
      console.warn('Firestore driver location fallback to local:', err);
    }
  }

  const state = getLocalState();
  if (location.driverId) {
    state.locations[location.driverId] = payload;
    if (state.drivers[location.driverId]) {
      state.drivers[location.driverId].currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        updatedAt: payload.updatedAt,
        isSharing: location.isSharing,
      };
    }
  }
  if (location.bookingId) {
    state.locations[location.bookingId] = payload;
  }
  saveLocalState(state);
}

export async function getDriverLocation(bookingId: string): Promise<DriverLocation | null> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'activeTrips', bookingId));
      if (snap.exists()) {
        return snap.data() as DriverLocation;
      }
    } catch (err) {
      console.info('Using local driver location lookup:', err);
    }
  }
  const state = getLocalState();
  return state.locations[bookingId] || null;
}

export async function getDriverContinuousLocation(driverId: string): Promise<DriverLocation | null> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'driverLocations', driverId));
      if (snap.exists()) {
        return snap.data() as DriverLocation;
      }
    } catch (err) {
      console.info('Using local driver continuous location lookup:', err);
    }
  }
  const state = getLocalState();
  return state.locations[driverId] || null;
}

// ==========================================
// IN-APP NOTIFICATIONS
// ==========================================
export async function getNotifications(userId: string): Promise<InAppNotification[]> {
  const state = getLocalState();
  const list = Object.values(state.notifications).filter((n) => n.userId === userId || n.userId === 'all');
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addNotification(notification: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: InAppNotification = {
    ...notification,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, 'notifications', id), cleanForFirestore(item));
    } catch (err) {
      console.warn('Firestore notification fallback:', err);
    }
  }

  const state = getLocalState();
  state.notifications[id] = item;
  saveLocalState(state);
}

export async function markNotificationRead(id: string): Promise<void> {
  const state = getLocalState();
  if (state.notifications[id]) {
    state.notifications[id].read = true;
    saveLocalState(state);
  }
  if (db) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      // non-fatal
    }
  }
}

// ==========================================
// AUDIT EVENTS
// ==========================================
export async function addBookingEvent(event: Omit<BookingEvent, 'id' | 'createdAt'>): Promise<void> {
  const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newEvent: BookingEvent = {
    ...event,
    id,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, `bookings/${event.bookingId}/events`, id), cleanForFirestore(newEvent));
    } catch (e) {
      // fallback
    }
  }

  const state = getLocalState();
  if (!state.events[event.bookingId]) {
    state.events[event.bookingId] = [];
  }
  state.events[event.bookingId].push(newEvent);
  saveLocalState(state);
}

export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const state = getLocalState();
  return state.events[bookingId] || [];
}
