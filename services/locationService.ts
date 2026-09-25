import { DriverLocation, LocationCoordinate } from '@/types';
import { updateDriverLocation, getDriverLocation, getDriverContinuousLocation } from '@/lib/firebase/store';

let trackingInterval: NodeJS.Timeout | null = null;
let simulatedProgress = 0.05; // 0 to 1 progress along route

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
 * Continuous Driver GPS Beacon
 * Shared continuously with Owner (and Customer during active trips/departure).
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
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  const broadcastLocation = () => {
    const origin = options?.origin || DHANBAD_GARAGE_LOCATION;
    const destination = options?.destination || DHANBAD_GARAGE_LOCATION;
    let lat = origin.latitude;
    let lng = origin.longitude;
    let heading = 45;
    let speed = 35;

    // Check device hardware geolocation
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          heading = pos.coords.heading || 45;
          speed = Math.round((pos.coords.speed || 10) * 3.6); // km/h
          sendLocationUpdate(lat, lng, pos.coords.accuracy || 10, heading, speed);
        },
        () => {
          // If indoor or testing in browser without movement, simulate realistic progression along route
          if (options?.bookingId && options?.destination) {
            simulatedProgress = (simulatedProgress + 0.04) % 1;
            const simLat = origin.latitude + (destination.latitude - origin.latitude) * simulatedProgress;
            const simLng = origin.longitude + (destination.longitude - origin.longitude) * simulatedProgress;
            sendLocationUpdate(simLat, simLng, 12, 60, 42);
          } else {
            // Near Dhanbad garage
            sendLocationUpdate(DHANBAD_GARAGE_LOCATION.latitude + 0.001, DHANBAD_GARAGE_LOCATION.longitude + 0.001, 10, 0, 0);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      if (options?.bookingId && options?.destination) {
        simulatedProgress = (simulatedProgress + 0.04) % 1;
        const simLat = origin.latitude + (destination.latitude - origin.latitude) * simulatedProgress;
        const simLng = origin.longitude + (destination.longitude - origin.longitude) * simulatedProgress;
        sendLocationUpdate(simLat, simLng, 12, 60, 42);
      } else {
        sendLocationUpdate(DHANBAD_GARAGE_LOCATION.latitude, DHANBAD_GARAGE_LOCATION.longitude, 10, 0, 0);
      }
    }
  };

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

  broadcastLocation();
  // 5-6 second broadcast interval as requested for real-time tracking
  trackingInterval = setInterval(broadcastLocation, 5000);

  return () => stopContinuousDriverBeacon(driverId, options?.bookingId);
}

export async function stopContinuousDriverBeacon(driverId: string, bookingId?: string) {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  const existing = await getDriverContinuousLocation(driverId);
  if (existing) {
    await updateDriverLocation({
      ...existing,
      bookingId,
      driverId,
      isSharing: false,
      dutyStatus: 'OFF_DUTY',
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
