'use client';

import { useState, useEffect } from 'react';
import { DriverLocation } from '@/types';
import { getDriverLocation, getDriverContinuousLocation, subscribeToStore } from '@/lib/firebase/store';

export function useDriverLocation(bookingId: string | undefined) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLocation = async () => {
      try {
        const loc = await getDriverLocation(bookingId);
        if (isMounted) setLocation(loc);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLocation();
    const unsub = subscribeToStore(() => {
      fetchLocation();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [bookingId]);

  return { location, loading };
}

/**
 * Hook to track driver live location continuously (for Owner dispatch & Driver self-beacon).
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

    let isMounted = true;
    const fetchLocation = async () => {
      try {
        const loc = await getDriverContinuousLocation(driverId);
        if (isMounted) setLocation(loc);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLocation();
    const unsub = subscribeToStore(() => {
      fetchLocation();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [driverId]);

  return { location, loading };
}
