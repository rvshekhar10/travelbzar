'use client';

import { useState, useEffect, useCallback } from 'react';
import { Driver } from '@/types';
import { getDrivers, saveDriver, subscribeToStore } from '@/lib/firebase/store';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getDrivers();
      setDrivers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  const addOrUpdateDriver = async (driver: Driver) => {
    await saveDriver(driver);
    await refresh();
  };

  const removeDriver = async (id: string) => {
    const { deleteDriver } = await import('@/lib/firebase/store');
    await deleteDriver(id);
    await refresh();
  };

  return { drivers, loading, addOrUpdateDriver, removeDriver, refresh };
}
