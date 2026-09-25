'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LocationCoordinate } from '@/types';
import {
  MapPin,
  Navigation,
  Crosshair,
  Sparkles,
  Check,
  Compass,
  Search,
  Maximize2,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import type * as LType from 'leaflet';

interface Props {
  pickup: LocationCoordinate;
  drop: LocationCoordinate;
  onSelectPickup: (loc: LocationCoordinate) => void;
  onSelectDrop: (loc: LocationCoordinate) => void;
  activeTarget: 'pickup' | 'drop';
  setActiveTarget: (target: 'pickup' | 'drop') => void;
  className?: string;
  height?: string;
}

// Popular Dhanbad & Regional Transit Hubs for instant 1-tap positioning
const POPULAR_HUBS = [
  { name: 'Dhanbad Junction', area: 'Station Road', lat: 23.7957, lng: 86.4304 },
  { name: 'Bank More', area: 'Commercial Centre', lat: 23.7915, lng: 86.4255 },
  { name: 'IIT (ISM) Main Gate', area: 'Sardar Patel Nagar', lat: 23.8144, lng: 86.4412 },
  { name: 'Saraidhela / Steel Gate', area: 'Koyla Nagar Road', lat: 23.8219, lng: 86.4589 },
  { name: 'Memco More', area: 'NH-19 Junction', lat: 23.8341, lng: 86.4418 },
  { name: 'Govindpur GT Road', area: 'Highway Corridor', lat: 23.8385, lng: 86.5192 },
  { name: 'Koyla Nagar', area: 'BCCL Township', lat: 23.8182, lng: 86.4674 },
  { name: 'Hirapur Market', area: 'City Centre', lat: 23.8012, lng: 86.4385 },
  { name: 'Ranchi Airport (IXR)', area: 'Hinoo, Ranchi', lat: 23.3143, lng: 85.3216 },
  { name: 'Deoghar Airport (DGH)', area: 'Kunda, Deoghar', lat: 24.4439, lng: 86.7081 },
  { name: 'Durgapur Airport (RDP)', area: 'Andal, Durgapur', lat: 23.6231, lng: 87.2435 },
];

export const LocationPickerMap: React.FC<Props> = ({
  pickup,
  drop,
  onSelectPickup,
  onSelectDrop,
  activeTarget,
  setActiveTarget,
  className = '',
  height = 'h-96 sm:h-[430px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const pickupMarkerRef = useRef<LType.Marker | null>(null);
  const dropMarkerRef = useRef<LType.Marker | null>(null);
  const polylineRef = useRef<LType.Polyline | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lng: number }[]
  >([]);

  // Reverse Geocoding helper (OSM Nominatim with timeout and clean formatting)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'TravelBzarApp/1.0',
          },
        }
      );
      if (!res.ok) throw new Error('Geocoding service unavailable');
      const data = await res.json();

      if (data && data.address) {
        const addr = data.address;
        const parts: string[] = [];

        // Prioritize building/amenity/road
        if (data.name) parts.push(data.name);
        else if (addr.road) parts.push(addr.road);

        if (addr.suburb && !parts.includes(addr.suburb)) parts.push(addr.suburb);
        if (addr.neighbourhood && !parts.includes(addr.neighbourhood)) parts.push(addr.neighbourhood);
        if (addr.city || addr.town || addr.county) {
          const c = addr.city || addr.town || addr.county;
          if (!parts.includes(c)) parts.push(c);
        }
        if (addr.state && !parts.includes(addr.state)) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);

        if (parts.length > 0) {
          return parts.join(', ');
        }
      }

      if (data && data.display_name) {
        return data.display_name.split(',').slice(0, 4).join(', ');
      }
    } catch (err) {
      console.info('Reverse geocode fallback to coords:', err);
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // Helper to create rich custom SVG DivIcons
  const createMarkerIcon = (
    L: typeof LType,
    type: 'pickup' | 'drop',
    isActive: boolean
  ) => {
    const isPickup = type === 'pickup';
    const bgGradient = isPickup
      ? 'from-[#078A32] to-[#42B900]'
      : 'from-[#F0441D] to-[#D43612]';
    const borderColor = isPickup ? '#078A32' : '#F0441D';
    const label = isPickup ? 'A' : 'B';
    const title = isPickup ? 'PICKUP' : 'DESTINATION';

    const pulseHtml = isActive
      ? `<span class="absolute -inset-2 rounded-full ${
          isPickup ? 'bg-emerald-500/30' : 'bg-rose-500/30'
        } animate-ping"></span>`
      : '';

    const html = `
      <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing group">
        <!-- Floating Label Pill -->
        <div class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-md uppercase mb-1 ${
          isPickup ? 'bg-[#078A32]' : 'bg-[#F0441D]'
        } border border-white/80 whitespace-nowrap">
          ${title}
        </div>
        
        <!-- Pin Marker Body -->
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr ${bgGradient} text-white flex items-center justify-center font-black text-xs shadow-xl border-2 border-white ring-2 ring-black/10">
          ${pulseHtml}
          <span class="relative z-10 font-bold">${label}</span>
        </div>

        <!-- Pointer Needle -->
        <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-white -mt-0.5 shadow-sm"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-visual-marker',
      iconSize: [60, 60],
      iconAnchor: [30, 56],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Clean existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: active target or Dhanbad Junction
      const initialLat =
        activeTarget === 'pickup' ? pickup.latitude : drop.latitude;
      const initialLng =
        activeTarget === 'pickup' ? pickup.longitude : drop.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat || 23.7957, initialLng || 86.4304],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // High clarity CartoDB Voyager street tiles
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution pill in bottom-right corner
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '© OpenStreetMap • Travel BZAR',
        })
        .addTo(map);

      // Zoom control in top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Pickup Marker (Draggable)
      const pickupIcon = createMarkerIcon(L, 'pickup', activeTarget === 'pickup');
      const pickupMarker = L.marker([pickup.latitude, pickup.longitude], {
        icon: pickupIcon,
        draggable: true,
      }).addTo(map);

      pickupMarker.on('dragend', async () => {
        const pos = pickupMarker.getLatLng();
        setIsGeocoding(true);
        const resolvedAddress = await reverseGeocode(pos.lat, pos.lng);
        setIsGeocoding(false);
        onSelectPickup({
          address: resolvedAddress,
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });

      // Create Drop Marker (Draggable)
      const dropIcon = createMarkerIcon(L, 'drop', activeTarget === 'drop');
      const dropMarker = L.marker([drop.latitude, drop.longitude], {
        icon: dropIcon,
        draggable: true,
      }).addTo(map);

      dropMarker.on('dragend', async () => {
        const pos = dropMarker.getLatLng();
        setIsGeocoding(true);
        const resolvedAddress = await reverseGeocode(pos.lat, pos.lng);
        setIsGeocoding(false);
        onSelectDrop({
          address: resolvedAddress,
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });

      // Connecting Polyline
      const polyline = L.polyline(
        [
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude],
        ],
        {
          color: '#078A32',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }
      ).addTo(map);

      // Click on Map to Drop or Move Marker
      map.on('click', async (e: LType.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setIsGeocoding(true);

        if (activeTarget === 'pickup') {
          pickupMarker.setLatLng([lat, lng]);
          polyline.setLatLngs([
            [lat, lng],
            [drop.latitude, drop.longitude],
          ]);
          const resolved = await reverseGeocode(lat, lng);
          setIsGeocoding(false);
          onSelectPickup({
            address: resolved,
            latitude: lat,
            longitude: lng,
          });
        } else {
          dropMarker.setLatLng([lat, lng]);
          polyline.setLatLngs([
            [pickup.latitude, pickup.longitude],
            [lat, lng],
          ]);
          const resolved = await reverseGeocode(lat, lng);
          setIsGeocoding(false);
          onSelectDrop({
            address: resolved,
            latitude: lat,
            longitude: lng,
          });
        }
      });

      mapInstanceRef.current = map;
      pickupMarkerRef.current = pickupMarker;
      dropMarkerRef.current = dropMarker;
      polylineRef.current = polyline;
      setMapLoaded(true);

      // Auto-fit both markers if valid
      if (
        pickup.latitude &&
        pickup.longitude &&
        drop.latitude &&
        drop.longitude
      ) {
        const bounds = L.latLngBounds([
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Polyline when pickup, drop, or activeTarget changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const updateVisuals = async () => {
      const L = (await import('leaflet')).default;

      // Update Pickup Marker
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickup.latitude, pickup.longitude]);
        pickupMarkerRef.current.setIcon(
          createMarkerIcon(L, 'pickup', activeTarget === 'pickup')
        );
      }

      // Update Drop Marker
      if (dropMarkerRef.current) {
        dropMarkerRef.current.setLatLng([drop.latitude, drop.longitude]);
        dropMarkerRef.current.setIcon(
          createMarkerIcon(L, 'drop', activeTarget === 'drop')
        );
      }

      // Update Polyline
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude],
        ]);
      }
    };

    updateVisuals();
  }, [pickup.latitude, pickup.longitude, drop.latitude, drop.longitude, activeTarget, mapLoaded]);

  // Pan to Active Target
  const panToActiveTarget = () => {
    if (!mapInstanceRef.current) return;
    const target = activeTarget === 'pickup' ? pickup : drop;
    mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, {
      duration: 1,
    });
  };

  // Center on Both Points
  const fitBothPoints = async () => {
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;
    const bounds = L.latLngBounds([
      [pickup.latitude, pickup.longitude],
      [drop.latitude, drop.longitude],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  // GPS Device Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsDetecting(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
        }

        setIsGeocoding(true);
        const resolved = await reverseGeocode(lat, lng);
        setIsGeocoding(false);

        if (activeTarget === 'pickup') {
          onSelectPickup({
            address: resolved,
            latitude: lat,
            longitude: lng,
          });
        } else {
          onSelectDrop({
            address: resolved,
            latitude: lat,
            longitude: lng,
          });
        }
      },
      (err) => {
        setGpsDetecting(false);
        alert(`Location permission denied: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Select Preset Hub
  const handleSelectPresetHub = (hub: (typeof POPULAR_HUBS)[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 15, { duration: 1 });
    }

    const fullAddr = `${hub.name}, ${hub.area}, Dhanbad, Jharkhand`;
    if (activeTarget === 'pickup') {
      onSelectPickup({
        address: fullAddr,
        latitude: hub.lat,
        longitude: hub.lng,
      });
    } else {
      onSelectDrop({
        address: fullAddr,
        latitude: hub.lat,
        longitude: hub.lng,
      });
    }
  };

  // Search Address / Landmark
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // First check local Dhanbad hubs
    const match = POPULAR_HUBS.find(
      (h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.area.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (match) {
      handleSelectPresetHub(match);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    // Geocode online query via Nominatim
    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Jharkhand, India`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=4`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'TravelBzarApp/1.0',
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(
          data.map((item) => ({
            name: item.display_name.split(',').slice(0, 3).join(', '),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      } else {
        alert(`No locations found for "${searchQuery}". Please try another landmark or click directly on the map.`);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { name: string; lat: number; lng: number }) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 15, { duration: 1 });
    }
    if (activeTarget === 'pickup') {
      onSelectPickup({
        address: result.name,
        latitude: result.lat,
        longitude: result.lng,
      });
    } else {
      onSelectDrop({
        address: result.name,
        latitude: result.lat,
        longitude: result.lng,
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Target Selector Bar & GPS Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Toggle Mode: Pickup vs Drop */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTarget('pickup')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTarget === 'pickup'
                ? 'bg-[#078A32] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>1. Set Pickup Point</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('drop')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTarget === 'drop'
                ? 'bg-[#F0441D] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-white" />
            <span>2. Set Drop Destination</span>
            <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* GPS & Fit Route Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={gpsDetecting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#078A32] border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="Detect My GPS Location"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
            <span>{gpsDetecting ? 'Detecting...' : 'Use My GPS'}</span>
          </button>

          <button
            type="button"
            onClick={fitBothPoints}
            className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-300 shadow-xs"
            title="Show Full Route View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit Route</span>
          </button>
        </div>
      </div>

      {/* 2. Real Visual Leaflet Map Container */}
      <div className={`relative w-full ${height} rounded-3xl overflow-hidden border-2 border-slate-300 shadow-lg bg-slate-100`}>
        {/* Leaflet Render Target */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Integrated Floating Map Search Bar */}
        <div className="absolute top-3 left-3 right-14 sm:right-auto sm:w-80 z-20">
          <form onSubmit={handleSearchSubmit} className="relative shadow-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark or street..."
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-xs font-semibold text-slate-800 placeholder-slate-400 border border-slate-300/80 shadow-md focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            )}
          </form>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-30 divide-y divide-slate-100 animate-fade-in">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-3 text-xs hover:bg-emerald-50 transition-colors flex items-start gap-2 text-slate-700"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#078A32] shrink-0 mt-0.5" />
                  <span className="font-semibold line-clamp-2">{res.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Guide Pill in top center */}
        <div className="absolute bottom-16 sm:bottom-4 left-3 right-3 sm:right-auto sm:max-w-md z-20 pointer-events-none">
          <div className="bg-[#061B33]/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  activeTarget === 'pickup' ? 'bg-[#42B900]' : 'bg-[#F0441D]'
                } animate-ping`}
              />
              <span className="truncate">
                {isGeocoding ? (
                  <span className="text-[#42B900] font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Locating address from pin...
                  </span>
                ) : (
                  <span>
                    <strong>
                      {activeTarget === 'pickup' ? 'Pickup' : 'Drop'}:
                    </strong>{' '}
                    <span className="text-slate-200">
                      {(activeTarget === 'pickup' ? pickup.address : drop.address) || 'Click map to place pin'}
                    </span>
                  </span>
                )}
              </span>
            </div>

            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 hidden sm:inline">
              Drag pin to refine
            </span>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="absolute top-16 left-3 z-10 hidden sm:block">
          <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 shadow-xs flex items-center gap-1">
            <Info className="w-3 h-3 text-[#078A32]" />
            <span>Tap anywhere to place visual marker • Drag marker to adjust</span>
          </div>
        </div>
      </div>

      {/* 3. Quick 1-Tap Dhanbad Landmark Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#078A32]" />
            <span>Quick Dhanbad Transit Landmarks (Tap to Pin):</span>
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            Sets active {activeTarget} marker
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectPresetHub(hub)}
              className="text-xs bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-all active:scale-95 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-slate-400 group-hover:text-[#078A32]" />
              <span>{hub.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
