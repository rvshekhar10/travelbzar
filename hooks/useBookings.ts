'use client';

import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types';
import { getBookings, getBookingById, subscribeToStore } from '@/lib/firebase/store';

export function useBookings(filter?: { customerId?: string; driverId?: string; status?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getBookings(filter);
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }, [filter?.customerId, filter?.driverId, filter?.status]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  return { bookings, loading, refresh };
}

export function useBooking(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!bookingId) return;
    try {
      const b = await getBookingById(bookingId);
      setBooking(b);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  return { booking, loading, refresh };
}
