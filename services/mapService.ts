import { LocationCoordinate, RouteStop } from '@/types';
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

export interface RouteLeg {
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface MultiStopRouteResult {
  distanceKm: number;
  drivingDurationMinutes: number;
  totalHaltMinutes: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
}

/**
 * Calculates complete route distance, driving time, halt wait time,
 * and individual leg breakdowns across multiple stops and halts.
 */
export async function calculateMultiStopRouteDistance(
  pickup: LocationCoordinate,
  stops: RouteStop[] | undefined,
  drop: LocationCoordinate
): Promise<MultiStopRouteResult> {
  const validStops = (stops || []).filter(
    (s) => s.address && s.latitude !== undefined && s.longitude !== undefined
  );

  const totalHaltMinutes = validStops.reduce(
    (acc, stop) => acc + (stop.haltDurationMinutes || 0),
    0
  );

  // Direct A -> B route
  if (validStops.length === 0) {
    const direct = await calculateRouteDistance(pickup, drop);
    return {
      distanceKm: direct.distanceKm,
      drivingDurationMinutes: direct.durationMinutes,
      totalHaltMinutes: 0,
      totalDurationMinutes: direct.durationMinutes,
      legs: [
        {
          fromAddress: pickup.address,
          toAddress: drop.address,
          distanceKm: direct.distanceKm,
          durationMinutes: direct.durationMinutes,
        },
      ],
    };
  }

  // Multi-stop sequential route: Pickup -> Stop 1 -> Stop 2 -> ... -> Drop
  const routePoints: LocationCoordinate[] = [
    pickup,
    ...validStops.map((s) => ({
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      placeId: s.placeId,
      landmark: s.landmark,
    })),
    drop,
  ];

  let cumulativeDistanceKm = 0;
  let cumulativeDrivingMinutes = 0;
  const legs: RouteLeg[] = [];

  for (let i = 0; i < routePoints.length - 1; i++) {
    const fromPoint = routePoints[i];
    const toPoint = routePoints[i + 1];

    const legResult = await calculateRouteDistance(fromPoint, toPoint);
    cumulativeDistanceKm += legResult.distanceKm;
    cumulativeDrivingMinutes += legResult.durationMinutes;

    legs.push({
      fromAddress: fromPoint.address,
      toAddress: toPoint.address,
      distanceKm: legResult.distanceKm,
      durationMinutes: legResult.durationMinutes,
    });
  }

  const roundedDistance = Math.round(cumulativeDistanceKm * 10) / 10;
  const totalDurationMinutes = cumulativeDrivingMinutes + totalHaltMinutes;

  return {
    distanceKm: roundedDistance,
    drivingDurationMinutes: cumulativeDrivingMinutes,
    totalHaltMinutes,
    totalDurationMinutes,
    legs,
  };
}

/**
 * Generates an external Google Maps navigation deep-link with support
 * for multiple intermediate waypoint stops and halts.
 */
export function getGoogleMapsNavigationUrl(
  drop: LocationCoordinate,
  pickup?: LocationCoordinate,
  stops?: RouteStop[]
): string {
  const dest = encodeURIComponent(drop.address || `${drop.latitude},${drop.longitude}`);

  if (pickup) {
    const origin = encodeURIComponent(pickup.address || `${pickup.latitude},${pickup.longitude}`);
    const validStops = (stops || []).filter(
      (s) => s.address || (s.latitude !== undefined && s.longitude !== undefined)
    );

    if (validStops.length > 0) {
      const waypoints = validStops
        .map((s) => encodeURIComponent(s.address || `${s.latitude},${s.longitude}`))
        .join('|');
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoints}&travelmode=driving`;
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}

/**
 * Returns popular preset locations in Dhanbad and nearby airport hubs.
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

/**
 * Popular tourist sightseeing, pilgrimage, and highway refreshment halt destinations
 * in Dhanbad and surrounding Jharkhand circuits.
 */
export function getPopularTouristAndHaltSpots() {
  return [
    {
      label: 'Maithon Dam & Boating Club',
      address: 'Maithon Dam Lake View Point, Damodar Valley, Dhanbad, Jharkhand 828207',
      category: 'Sightseeing',
      latitude: 23.8569,
      longitude: 86.8115,
      recommendedHaltMinutes: 60,
      description: 'Scenic dam lake, boating, and fresh river fish snacks.',
    },
    {
      label: 'Topchanchi Wildlife Sanctuary & Lake',
      address: 'Topchanchi Lake, NH19/Grand Trunk Road, Dhanbad, Jharkhand 828402',
      category: 'Nature & Refreshment',
      latitude: 23.9015,
      longitude: 86.2081,
      recommendedHaltMinutes: 45,
      description: 'Picturesque lake surrounded by Parasnath hills with GT Road dhabas.',
    },
    {
      label: 'Shakti Mandir, Joraphatak',
      address: 'Shakti Mandir, Joraphatak Rd, Dhanbad, Jharkhand 826001',
      category: 'Pilgrimage',
      latitude: 23.7932,
      longitude: 86.4251,
      recommendedHaltMinutes: 30,
      description: 'Renowned temple dedicated to Goddess Durga; eternal flame brought from Jwalaji.',
    },
    {
      label: 'Birsa Munda Park, Bhuda',
      address: 'Birsa Munda Park, Main Road, Bhuda, Dhanbad, Jharkhand 826001',
      category: 'Family Recreation',
      latitude: 23.8219,
      longitude: 86.4429,
      recommendedHaltMinutes: 45,
      description: 'Sprawling city park with floral gardens, fountains, and walking tracks.',
    },
    {
      label: 'Bhatinda Falls, Munidih',
      address: 'Bhatinda Falls, Moonidih, Dhanbad, Jharkhand 828129',
      category: 'Sightseeing',
      latitude: 23.7121,
      longitude: 86.3262,
      recommendedHaltMinutes: 60,
      description: 'Cascading natural water falls over massive boulders, 14 km from Dhanbad station.',
    },
    {
      label: 'Panchet Dam Viewpoint',
      address: 'Panchet Dam Reservoir, Dhanbad-Purulia Border, Jharkhand 828206',
      category: 'Sightseeing',
      latitude: 23.6842,
      longitude: 86.7495,
      recommendedHaltMinutes: 45,
      description: 'Majestic DVC dam nestled against the backdrop of Panchet Hill.',
    },
    {
      label: 'Highway King Dhaba, Govindpur NH19',
      address: 'Highway King Restaurant & Dhaba, NH19 GT Road, Govindpur, Dhanbad 828109',
      category: 'Food & Refreshment',
      latitude: 23.8375,
      longitude: 86.5241,
      recommendedHaltMinutes: 30,
      description: 'Popular clean highway stop for tea, tandoori chai, and authentic North Indian meals.',
    },
  ];
}

