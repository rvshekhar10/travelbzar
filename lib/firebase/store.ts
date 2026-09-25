import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
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
  UserRole,
} from '@/types';
import { DEFAULT_PRICING_CONFIG } from '@/config/business';

// Local storage key for fallback persistence only
const LOCAL_STORAGE_KEY = 'travelbzar_clean_store_v2';

interface LocalStoreState {
  users: Record<string, AppUser>;
  pricing: PricingConfig;
  vehicles: Record<string, Vehicle>;
  drivers: Record<string, Driver>;
  bookings: Record<string, Booking>;
  notifications: Record<string, InAppNotification>;
  events: Record<string, BookingEvent[]>;
  locations: Record<string, DriverLocation>;
}

// Clean initial state with ZERO pre-fed mock data
const DEFAULT_STATE: LocalStoreState = {
  users: {},
  pricing: DEFAULT_PRICING_CONFIG,
  vehicles: {},
  drivers: {},
  bookings: {},
  notifications: {},
  events: {},
  locations: {},
};

// Listeners map for in-app reactive events
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
    // Purge old mock storage if present
    if (localStorage.getItem('travelbzar_poc_data_v1')) {
      localStorage.removeItem('travelbzar_poc_data_v1');
    }

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
      console.info('Pricing fetch notice:', err);
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
// VEHICLES (Controlled strictly by Owner in Firestore - Max 1 Vehicle)
// ==========================================
export async function getVehicles(): Promise<Vehicle[]> {
  if (db) {
    try {
      const q = query(collection(db, 'vehicles'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Vehicle);
    } catch (err) {
      console.warn('Firestore getVehicles error, falling back to local cache:', err);
    }
  }
  const state = getLocalState();
  return Object.values(state.vehicles);
}

export async function saveVehicle(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
  const updatedVehicle: Vehicle = {
    ...vehicle,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const q = query(collection(db, 'vehicles'));
      const snap = await getDocs(q);
      const otherVehicles = snap.docs.filter((d) => d.id !== vehicle.id);
      if (otherVehicles.length >= 1) {
        return {
          success: false,
          error: 'Fleet limit reached. Only 1 active vehicle is permitted. Delete the current cab to register another.',
        };
      }

      await setDoc(doc(db, 'vehicles', vehicle.id), cleanForFirestore(updatedVehicle), { merge: true });
      const state = getLocalState();
      state.vehicles[vehicle.id] = updatedVehicle;
      saveLocalState(state);
      return { success: true };
    } catch (err) {
      console.error('Firestore saveVehicle error:', err);
      return { success: false, error: 'Failed to save vehicle to Firestore.' };
    }
  }

  const state = getLocalState();
  const currentVehicles = Object.values(state.vehicles).filter((v) => v.id !== vehicle.id);
  if (currentVehicles.length >= 1) {
    return { success: false, error: 'Fleet limit reached. Only 1 active vehicle is permitted.' };
  }

  state.vehicles[vehicle.id] = updatedVehicle;
  saveLocalState(state);
  return { success: true };
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));

      // Unassign vehicle from drivers in Firestore
      const driversSnap = await getDocs(
        query(collection(db, 'drivers'), where('assignedVehicleId', '==', vehicleId))
      );
      for (const dDoc of driversSnap.docs) {
        await updateDoc(doc(db, 'drivers', dDoc.id), { assignedVehicleId: null });
      }
    } catch (err) {
      console.error('Firestore deleteVehicle error:', err);
    }
  }

  const state = getLocalState();
  delete state.vehicles[vehicleId];
  Object.values(state.drivers).forEach((d) => {
    if (d.assignedVehicleId === vehicleId) {
      d.assignedVehicleId = undefined;
    }
  });
  saveLocalState(state);
}

// ==========================================
// DRIVERS (Controlled strictly by Owner in Firestore)
// ==========================================
export async function getDrivers(): Promise<Driver[]> {
  if (db) {
    try {
      const q = query(collection(db, 'drivers'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Driver);
    } catch (err) {
      console.warn('Firestore getDrivers error, falling back to local cache:', err);
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

      // Ensure user record exists with driver role
      await setDoc(
        doc(db, 'users', driver.id),
        cleanForFirestore({
          id: driver.id,
          role: 'driver',
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          status: 'active',
          createdAt: driver.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );

      // If assigned to vehicle, update vehicle in Firestore
      if (driver.assignedVehicleId) {
        await setDoc(
          doc(db, 'vehicles', driver.assignedVehicleId),
          { currentDriverId: driver.id, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Firestore saveDriver error:', err);
    }
  }

  const state = getLocalState();
  state.drivers[driver.id] = updatedDriver;
  saveLocalState(state);
}

export async function deleteDriver(driverId: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      await deleteDoc(doc(db, 'users', driverId));

      // Unassign driver from vehicle
      const vehSnap = await getDocs(
        query(collection(db, 'vehicles'), where('currentDriverId', '==', driverId))
      );
      for (const vDoc of vehSnap.docs) {
        await updateDoc(doc(db, 'vehicles', vDoc.id), { currentDriverId: null });
      }
    } catch (err) {
      console.error('Firestore deleteDriver error:', err);
    }
  }

  const state = getLocalState();
  delete state.drivers[driverId];
  delete state.users[driverId];
  Object.values(state.vehicles).forEach((v) => {
    if (v.currentDriverId === driverId) {
      v.currentDriverId = undefined;
    }
  });
  saveLocalState(state);
}

// ==========================================
// USERS / CUSTOMERS (Controlled by Owner in Firestore)
// ==========================================
export async function getUsers(role?: UserRole): Promise<AppUser[]> {
  if (db) {
    try {
      let q = query(collection(db, 'users'));
      if (role) {
        q = query(collection(db, 'users'), where('role', '==', role));
      }
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as AppUser);
    } catch (err) {
      console.error('Firestore getUsers error:', err);
    }
  }
  const state = getLocalState();
  const allUsers = Object.values(state.users);
  return role ? allUsers.filter((u) => u.role === role) : allUsers;
}

export async function saveAppUser(user: AppUser): Promise<void> {
  const updated = { ...user, updatedAt: new Date().toISOString() };
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.id), cleanForFirestore(updated), { merge: true });
    } catch (err) {
      console.error('Firestore saveAppUser error:', err);
    }
  }
  const state = getLocalState();
  state.users[user.id] = updated;
  saveLocalState(state);
}

export async function deleteAppUser(userId: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Firestore deleteAppUser error:', err);
    }
  }
  const state = getLocalState();
  delete state.users[userId];
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
      return snap.docs.map((d) => d.data() as Booking);
    } catch (err) {
      console.warn('Firestore getBookings error, falling back to local cache:', err);
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
      console.info('Firestore booking lookup notice:', err);
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
      // Fallback check on drivers collection
      const driverSnap = await getDoc(doc(db, 'drivers', driverId));
      if (driverSnap.exists() && driverSnap.data()?.currentLocation) {
        const cur = driverSnap.data().currentLocation;
        return {
          driverId,
          latitude: cur.latitude,
          longitude: cur.longitude,
          accuracy: cur.accuracy || 10,
          heading: cur.heading || 0,
          speed: cur.speed || 0,
          updatedAt: cur.updatedAt || new Date().toISOString(),
          isSharing: cur.isSharing !== false,
          dutyStatus: 'ON_DUTY',
        };
      }
    } catch (err) {
      console.info('Using local driver continuous location lookup:', err);
    }
  }
  const state = getLocalState();
  return state.locations[driverId] || null;
}

/**
 * Real-time reactive subscription to driver's continuous GPS beacon (for Owner & Dispatch HQ).
 * Uses Firestore onSnapshot so updates from driver mobile device reflect instantly.
 */
export function subscribeToDriverContinuousLocation(
  driverId: string,
  onUpdate: (loc: DriverLocation | null) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (db) {
    try {
      unsubFirestore = onSnapshot(
        doc(db, 'driverLocations', driverId),
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as DriverLocation);
          } else {
            // Check drivers collection fallback
            getDoc(doc(db!, 'drivers', driverId))
              .then((dSnap) => {
                if (dSnap.exists() && dSnap.data()?.currentLocation) {
                  const cur = dSnap.data().currentLocation;
                  onUpdate({
                    driverId,
                    latitude: cur.latitude,
                    longitude: cur.longitude,
                    accuracy: cur.accuracy || 10,
                    heading: cur.heading || 0,
                    speed: cur.speed || 0,
                    updatedAt: cur.updatedAt || new Date().toISOString(),
                    isSharing: cur.isSharing !== false,
                    dutyStatus: 'ON_DUTY',
                  });
                } else {
                  onUpdate(null);
                }
              })
              .catch(() => onUpdate(null));
          }
        },
        (error) => {
          console.warn('Real-time driver location snapshot warning:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to bind Firestore real-time listener for driver location:', err);
    }
  }

  // Also subscribe to in-tab local events
  const unsubLocal = subscribeToStore(() => {
    const state = getLocalState();
    if (state.locations[driverId]) {
      onUpdate(state.locations[driverId]);
    }
  });

  return () => {
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch {
        // cleanup ignore
      }
    }
    unsubLocal();
  };
}

/**
 * Real-time reactive subscription to an active trip's driver GPS location (for Customer booking view).
 */
export function subscribeToActiveTripLocation(
  bookingId: string,
  onUpdate: (loc: DriverLocation | null) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (db) {
    try {
      unsubFirestore = onSnapshot(
        doc(db, 'activeTrips', bookingId),
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as DriverLocation);
          } else {
            onUpdate(null);
          }
        },
        (error) => {
          console.warn('Real-time active trip snapshot warning:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to bind Firestore real-time listener for active trip:', err);
    }
  }

  const unsubLocal = subscribeToStore(() => {
    const state = getLocalState();
    if (state.locations[bookingId]) {
      onUpdate(state.locations[bookingId]);
    }
  });

  return () => {
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch {
        // cleanup ignore
      }
    }
    unsubLocal();
  };
}


// ==========================================
// IN-APP NOTIFICATIONS
// ==========================================
export async function getNotifications(userId: string): Promise<InAppNotification[]> {
  const targetIds = Array.from(new Set([userId, 'owner', 'all'])).filter(Boolean);
  if (db) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', targetIds)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => d.data() as InAppNotification)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      // fallback
    }
  }
  const state = getLocalState();
  const list = Object.values(state.notifications).filter((n) => targetIds.includes(n.userId));
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
  if (db) {
    try {
      const q = query(collection(db, `bookings/${bookingId}/events`), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as BookingEvent);
      }
    } catch {
      // fallback
    }
  }
  const state = getLocalState();
  return state.events[bookingId] || [];
}
