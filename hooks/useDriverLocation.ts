'use client';

import { useState, useEffect } from 'react';
import { DriverLocation } from '@/types';
import {
  subscribeToActiveTripLocation,
  subscribeToDriverContinuousLocation,
  getDriverLocation,
  getDriverContinuousLocation,
} from '@/lib/firebase/store';

export function useDriverLocation(bookingId: string | undefined) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    // Initial cache fetch
    getDriverLocation(bookingId).then((loc) => {
      if (loc) setLocation(loc);
    });

    // Real-time reactive listener
    const unsub = subscribeToActiveTripLocation(bookingId, (loc) => {
      setLocation(loc);
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [bookingId]);

  return { location, loading };
}

/**
 * Hook to track driver live location continuously (for Owner dispatch & Driver self-beacon).
 * Synchronized in real time via Firestore onSnapshot.
 */
export function useDriverContinuousLocation(driverId: string | undefined) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    // Initial lookup
    getDriverContinuousLocation(driverId).then((loc) => {
      if (loc) setLocation(loc);
    });

    // Real-time reactive listener across devices
    const unsub = subscribeToDriverContinuousLocation(driverId, (loc) => {
      setLocation(loc);
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [driverId]);

  return { location, loading };
}
