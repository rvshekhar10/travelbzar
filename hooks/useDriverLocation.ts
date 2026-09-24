'use client';

import { useState, useEffect } from 'react';
import { DriverLocation } from '@/types';
import { getDriverLocation, subscribeToStore } from '@/lib/firebase/store';

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
