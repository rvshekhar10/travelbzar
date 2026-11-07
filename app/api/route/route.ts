import { NextRequest, NextResponse } from 'next/server';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

// In-memory server-side LRU cache to keep responses fast and save network roundtrips
const serverRouteCache = new Map<string, { distanceKm: number; durationMinutes: number; cachedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = parseFloat(searchParams.get('originLat') || '');
    const originLng = parseFloat(searchParams.get('originLng') || '');
    const destLat = parseFloat(searchParams.get('destLat') || '');
    const destLng = parseFloat(searchParams.get('destLng') || '');

    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destLat) ||
      isNaN(destLng)
    ) {
      return NextResponse.json(
        { error: 'Invalid origin or destination coordinates.' },
        { status: 400 }
      );
    }

    const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
    const cached = serverRouteCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        distanceKm: cached.distanceKm,
        durationMinutes: cached.durationMinutes,
        source: 'cache',
      });
    }

    // Call real OSM Road Network Engine (OSRM)
    // Semicolon separated lng,lat format
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false&alternatives=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TravelBzar-Mobility/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Next.js fetch cache
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMin = Math.max(10, Math.round(route.duration / 60));

        const result = { distanceKm: distKm, durationMinutes: durMin, source: 'osrm' };
        serverRouteCache.set(cacheKey, { ...result, cachedAt: Date.now() });

        return NextResponse.json(result);
      }
    }

    return NextResponse.json(
      { error: 'Routing engine returned non-OK status' },
      { status: 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown routing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

