import { NextRequest, NextResponse } from 'next/server';

export interface PlaceSuggestion {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  state?: string;
  city?: string;
}

// In-memory cache for fast autocomplete repeats
const placesCache = new Map<string, { results: PlaceSuggestion[]; cachedAt: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const lat = searchParams.get('lat') || '23.7957'; // Dhanbad lat
    const lon = searchParams.get('lon') || '86.4304'; // Dhanbad lon

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cacheKey = `${query.toLowerCase()}@${lat},${lon}`;
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return NextResponse.json({ results: cached.results, source: 'cache' });
    }

    const results: PlaceSuggestion[] = [];
    const seenCoordinates = new Set<string>();

    const addSuggestion = (s: PlaceSuggestion) => {
      const coordKey = `${s.latitude.toFixed(3)},${s.longitude.toFixed(3)}`;
      if (!seenCoordinates.has(coordKey) && results.length < 8) {
        seenCoordinates.add(coordKey);
        results.push(s);
      }
    };

    // Provider 1: Photon by Komoot (Ultra-fast real-time OpenStreetMap search engine with location bias)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lat=${lat}&lon=${lon}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2800);

      const res = await fetch(photonUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'TravelBzarApp/1.0' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features)) {
          for (const f of data.features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;

            const name = props.name || '';
            const street = props.street || '';
            const locality = props.locality || props.district || '';
            const city = props.city || props.town || props.village || props.county || '';
            const state = props.state || '';
            const country = props.country || '';

            // Build clean, human-readable address
            const parts = [name, street, locality, city, state, country]
              .map((p) => p.trim())
              .filter(Boolean);

            // Deduplicate consecutive parts
            const uniqueParts = parts.filter((part, idx) => parts.indexOf(part) === idx);
            const address = uniqueParts.join(', ');
            const label = uniqueParts.slice(0, 3).join(', ') || address;

            addSuggestion({
              label,
              address,
              latitude: coords[1],
              longitude: coords[0],
              city,
              state,
            });
          }
        }
      }
    } catch {
      // Fall through to Provider 2
    }

    // Provider 2: Nominatim with nationwide India scope (fallback / enrichment)
    if (results.length < 4) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(nominatimUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'TravelBzarApp/1.0',
            'Accept-Language': 'en',
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: Array<{ display_name: string; lat: string; lon: string; address?: Record<string, string> }> = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              const labelParts = item.display_name.split(',').slice(0, 4).map((p) => p.trim());
              const label = labelParts.join(', ');
              addSuggestion({
                label,
                address: item.display_name,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                city: item.address?.city || item.address?.town || item.address?.district,
                state: item.address?.state,
              });
            }
          }
        }
      } catch {
        // Ignore
      }
    }

    if (results.length > 0) {
      placesCache.set(cacheKey, { results, cachedAt: Date.now() });
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Places search error';
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}

