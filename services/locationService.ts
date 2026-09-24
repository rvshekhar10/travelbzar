import { DriverLocation, LocationCoordinate } from '@/types';
import { updateDriverLocation, getDriverLocation } from '@/lib/firebase/store';

let trackingInterval: NodeJS.Timeout | null = null;
let simulatedProgress = 0.05; // 0 to 1 progress along route

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
 * Starts broadcasting driver live location periodically (5-8s interval).
 * Only active while TRIP_STARTED.
 */
export function startDriverLiveBroadcaster(
  bookingId: string,
  driverId: string,
  origin: LocationCoordinate,
  destination: LocationCoordinate,
  onUpdate?: (loc: DriverLocation) => void
): () => void {
  stopDriverLiveBroadcaster(bookingId, driverId);

  // Initial broadcast
  const broadcastLocation = () => {
    let lat = origin.latitude;
    let lng = origin.longitude;
    let heading = 45;
    let speed = 40;

    // Check if browser geolocation is actively providing coordinates
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          heading = pos.coords.heading || 0;
          speed = Math.round((pos.coords.speed || 10) * 3.6); // km/h
          sendLocationUpdate(lat, lng, pos.coords.accuracy || 10, heading, speed);
        },
        () => {
          // If browser GPS is fixed indoors, interpolate along the trip route for realistic live demo
          simulatedProgress = (simulatedProgress + 0.04) % 1;
          const simLat = origin.latitude + (destination.latitude - origin.latitude) * simulatedProgress;
          const simLng = origin.longitude + (destination.longitude - origin.longitude) * simulatedProgress;
          sendLocationUpdate(simLat, simLng, 12, 60, 48);
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      simulatedProgress = (simulatedProgress + 0.04) % 1;
      const simLat = origin.latitude + (destination.latitude - origin.latitude) * simulatedProgress;
      const simLng = origin.longitude + (destination.longitude - origin.longitude) * simulatedProgress;
      sendLocationUpdate(simLat, simLng, 12, 60, 48);
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
      bookingId,
      driverId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      updatedAt: new Date().toISOString(),
      isSharing: true,
    };
    await updateDriverLocation(loc);
    if (onUpdate) onUpdate(loc);
  };

  broadcastLocation();
  trackingInterval = setInterval(broadcastLocation, 6000); // 6 second interval as recommended (5-10s)

  return () => stopDriverLiveBroadcaster(bookingId, driverId);
}

export async function stopDriverLiveBroadcaster(bookingId: string, driverId: string) {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  const existing = await getDriverLocation(bookingId);
  if (existing) {
    await updateDriverLocation({
      ...existing,
      isSharing: false,
      updatedAt: new Date().toISOString(),
    });
  }
}
