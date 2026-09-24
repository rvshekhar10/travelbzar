import { LocationCoordinate } from '@/types';
import { BUSINESS_CONFIG } from '@/config/business';

// Cache for calculated routes to prevent redundant Google Maps API calls
const routeCache = new Map<string, { distanceKm: number; durationMinutes: number }>();

/**
 * Calculates Haversine distance between two coordinates in km.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  // Indian highway & city winding factor ~1.28
  return Math.round(directDistance * 1.28 * 10) / 10;
}

/**
 * Calculates road route distance and duration between pickup and drop.
 * Checks routeCache first to control Google Maps API cost.
 */
export async function calculateRouteDistance(
  pickup: LocationCoordinate,
  drop: LocationCoordinate
): Promise<{ distanceKm: number; durationMinutes: number }> {
  const cacheKey = `${pickup.latitude.toFixed(4)},${pickup.longitude.toFixed(4)}->${drop.latitude.toFixed(4)},${drop.longitude.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey && typeof window !== 'undefined') {
    const win = window as unknown as {
      google?: {
        maps?: {
          DirectionsService: new () => {
            route: (
              request: { origin: { lat: number; lng: number }; destination: { lat: number; lng: number }; travelMode: string },
              callback: (response: { routes?: Array<{ legs?: Array<{ distance?: { value: number }; duration?: { value: number } }> }> } | null, status: string) => void
            ) => void;
          };
          DirectionsStatus: { OK: string };
          TravelMode: { DRIVING: string };
        };
      };
    };

    if (win.google?.maps) {
      try {
        const directionsService = new win.google.maps.DirectionsService();

        const result = await new Promise<{ distanceKm: number; durationMinutes: number }>((resolve, reject) => {
          directionsService.route(
            {
              origin: { lat: pickup.latitude, lng: pickup.longitude },
              destination: { lat: drop.latitude, lng: drop.longitude },
              travelMode: win.google!.maps!.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === win.google!.maps!.DirectionsStatus.OK && response?.routes?.[0]?.legs?.[0]) {
                const leg = response.routes[0].legs[0];
                const distKm = Math.round(((leg.distance?.value || 0) / 1000) * 10) / 10;
                const durationMin = Math.round((leg.duration?.value || 0) / 60);
                resolve({ distanceKm: distKm, durationMinutes: durationMin });
              } else {
                reject(new Error(`Directions status: ${status}`));
              }
            }
          );
        });

        routeCache.set(cacheKey, result);
        return result;
      } catch (err) {
        console.info('Google Maps directions fallback to geographic model:', err);
      }
    }
  }

  // High fidelity regional distance fallback for Dhanbad & Eastern India
  const distanceKm = calculateHaversineDistance(
    pickup.latitude,
    pickup.longitude,
    drop.latitude,
    drop.longitude
  );

  // Average speed in Jharkhand/NH2 routes ~45-50 km/h
  const durationMinutes = Math.max(15, Math.round((distanceKm / 45) * 60));

  const calculated = { distanceKm, durationMinutes };
  routeCache.set(cacheKey, calculated);
  return calculated;
}

/**
 * Generates an external Google Maps navigation deep-link.
 */
export function getGoogleMapsNavigationUrl(drop: LocationCoordinate, pickup?: LocationCoordinate): string {
  const dest = encodeURIComponent(drop.address || `${drop.latitude},${drop.longitude}`);
  if (pickup) {
    const origin = encodeURIComponent(pickup.address || `${pickup.latitude},${pickup.longitude}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}

/**
 * Returns popular preset locations in Dhanbad and nearby airports.
 */
export function getPresetLocations() {
  return [
    {
      label: 'Dhanbad Railway Station (DHN)',
      address: 'Dhanbad Junction Railway Station, Station Rd, Dhanbad, Jharkhand 826001',
      latitude: 23.7915,
      longitude: 86.4295,
    },
    {
      label: 'IIT (ISM) Dhanbad Main Gate',
      address: 'Police Line, Sardar Patel Nagar, Dhanbad, Jharkhand 826004',
      latitude: 23.8143,
      longitude: 86.4412,
    },
    {
      label: 'Bank More, Dhanbad',
      address: 'Bank More Market Area, Katras Rd, Dhanbad, Jharkhand 826001',
      latitude: 23.7845,
      longitude: 86.4211,
    },
    {
      label: 'Saraidhela / Big Bazaar, Dhanbad',
      address: 'Saraidhela Main Road, Near Ozone Galleria Mall, Dhanbad, Jharkhand 826004',
      latitude: 23.8189,
      longitude: 86.4567,
    },
    {
      label: 'Govindpur GT Road Junction',
      address: 'Govindpur, NH19/GT Road, Dhanbad, Jharkhand 828109',
      latitude: 23.8344,
      longitude: 86.5187,
    },
  ];
}
