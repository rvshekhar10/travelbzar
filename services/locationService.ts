import { DriverLocation, LocationCoordinate } from '@/types';
import { updateDriverLocation, getDriverContinuousLocation } from '@/lib/firebase/store';

let trackingInterval: NodeJS.Timeout | null = null;
let trackingWatchId: number | null = null;
let lastFix: { lat: number; lng: number; timestamp: number; speed: number; heading: number } | null = null;

export const DHANBAD_GARAGE_LOCATION: LocationCoordinate = {
  address: 'Travel BZAR Garage, Bank More, Dhanbad, Jharkhand 826001',
  latitude: 23.7957,
  longitude: 86.4304,
};

/**
 * Returns Google Maps Navigation URL specifically to Travel BZAR Garage base.
 */
export function getGarageNavigationUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${DHANBAD_GARAGE_LOCATION.latitude},${DHANBAD_GARAGE_LOCATION.longitude}`;
}

/**
 * Calculates Great Circle / Haversine distance between two coordinates in meters.
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates compass bearing (heading) in degrees (0 - 360) from point A to point B.
 */
export function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return Math.round(((θ * 180) / Math.PI + 360) % 360);
}

/**
 * Requests device GPS location with graceful fallback.
 */
export async function getCurrentDeviceLocation(): Promise<LocationCoordinate> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          address: 'Current Location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Unable to retrieve location';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please enter your address manually.';
        } else if (err.code === 2) {
          msg = 'Position unavailable.';
        } else if (err.code === 3) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  });
}

/**
 * Continuous Driver GPS Beacon with Real Hardware Speed & Heading Calculation.
 * Broadcasts location live to Firestore so Owner and Customer can track chauffeur movement.
 */
export function startContinuousDriverBeacon(
  driverId: string,
  options?: {
    bookingId?: string;
    origin?: LocationCoordinate;
    destination?: LocationCoordinate;
    dutyStatus?: 'ON_DUTY' | 'EN_ROUTE' | 'ON_TRIP' | 'RETURNING_TO_GARAGE' | 'OFF_DUTY';
    onUpdate?: (loc: DriverLocation) => void;
  }
): () => void {
  // Clear any existing active watch/interval to prevent duplicate broadcasts
  if (trackingWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(trackingWatchId);
    trackingWatchId = null;
  }
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  const sendLocationUpdate = async (
    latitude: number,
    longitude: number,
    accuracy: number,
    heading: number,
    speed: number
  ) => {
    const loc: DriverLocation = {
      bookingId: options?.bookingId,
      driverId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      updatedAt: new Date().toISOString(),
      isSharing: true,
      dutyStatus: options?.dutyStatus || 'ON_DUTY',
    };
    await updateDriverLocation(loc);
    if (options?.onUpdate) options.onUpdate(loc);
  };

  /**
   * Processes a live position reading from the device GPS chip.
   * Calculates realistic speed (0 km/h when stationary) and bearing.
   */
  const handlePosition = (pos: GeolocationPosition) => {
    const now = Date.now();
    const { latitude, longitude, accuracy } = pos.coords;

    let computedSpeed = 0;
    let computedHeading = lastFix?.heading ?? 0;

    // 1. Evaluate speed
    // If device provides pos.coords.speed (in m/s):
    if (typeof pos.coords.speed === 'number' && !isNaN(pos.coords.speed) && pos.coords.speed !== null) {
      if (pos.coords.speed > 0.4) {
        // Moving faster than ~1.4 km/h -> real movement
        computedSpeed = Math.round(pos.coords.speed * 3.6);
      } else {
        // Stationary / stopped at red light / parked -> 0 km/h
        computedSpeed = 0;
      }
    } else if (lastFix) {
      // 2. Hardware didn't supply speed (common on desktop/certain mobile browsers)
      // Derive speed from coordinate displacement / elapsed time
      const distMeters = calculateDistanceMeters(lastFix.lat, lastFix.lng, latitude, longitude);
      const deltaSec = (now - lastFix.timestamp) / 1000;

      // Discard GPS jitter noise (< 5 meters drift when vehicle is stationary)
      if (distMeters < 5 || deltaSec < 0.8) {
        computedSpeed = 0;
      } else {
        const rawSpeed = Math.round((distMeters / deltaSec) * 3.6);
        // Cap at 130 km/h to discard GPS teleport spikes
        computedSpeed = rawSpeed > 130 ? 0 : rawSpeed;
      }
    } else {
      // First fix: vehicle assumed stationary at start
      computedSpeed = 0;
    }

    // 3. Evaluate heading
    if (
      typeof pos.coords.heading === 'number' &&
      !isNaN(pos.coords.heading) &&
      pos.coords.heading !== null &&
      pos.coords.heading >= 0
    ) {
      computedHeading = Math.round(pos.coords.heading);
    } else if (lastFix && computedSpeed > 2) {
      computedHeading = calculateBearingDegrees(lastFix.lat, lastFix.lng, latitude, longitude);
    }

    lastFix = {
      lat: latitude,
      lng: longitude,
      timestamp: now,
      speed: computedSpeed,
      heading: computedHeading,
    };

    sendLocationUpdate(latitude, longitude, accuracy || 8, computedHeading, computedSpeed);
  };

  const handlePositionError = () => {
    // If GPS permission is blocked or unavailable, broadcast Dhanbad garage base as stationary
    const baseLat = DHANBAD_GARAGE_LOCATION.latitude;
    const baseLng = DHANBAD_GARAGE_LOCATION.longitude;
    sendLocationUpdate(baseLat, baseLng, 15, 0, 0);
  };

  // 1. Initial immediate location check
  if (typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 2000,
    });

    // 2. Continuous real-time movement streaming via watchPosition
    try {
      trackingWatchId = navigator.geolocation.watchPosition(handlePosition, handlePositionError, {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      });
    } catch (err) {
      console.warn('Geolocation watchPosition unavailable:', err);
    }

    // 3. Periodic heartbeat interval (every 4s) so stationary status (0 km/h) & timestamp stay fresh in Firestore
    trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 3000,
      });
    }, 4000);
  } else {
    handlePositionError();
  }

  return () => stopContinuousDriverBeacon(driverId, options?.bookingId);
}

export async function stopContinuousDriverBeacon(driverId: string, bookingId?: string) {
  if (trackingWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    try {
      navigator.geolocation.clearWatch(trackingWatchId);
    } catch {
      // ignore
    }
    trackingWatchId = null;
  }
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  lastFix = null;

  const existing = await getDriverContinuousLocation(driverId);
  if (existing) {
    await updateDriverLocation({
      ...existing,
      bookingId,
      driverId,
      isSharing: false,
      dutyStatus: 'OFF_DUTY',
      speed: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Legacy wrapper for active trip broadcaster.
 */
export function startDriverLiveBroadcaster(
  bookingId: string,
  driverId: string,
  origin: LocationCoordinate,
  destination: LocationCoordinate,
  onUpdate?: (loc: DriverLocation) => void
): () => void {
  return startContinuousDriverBeacon(driverId, {
    bookingId,
    origin,
    destination,
    dutyStatus: 'ON_TRIP',
    onUpdate,
  });
}

export async function stopDriverLiveBroadcaster(bookingId: string, driverId: string) {
  return stopContinuousDriverBeacon(driverId, bookingId);
}
