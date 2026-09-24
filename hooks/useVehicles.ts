'use client';

import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '@/types';
import { getVehicles, saveVehicle, deleteVehicle, subscribeToStore } from '@/lib/firebase/store';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getVehicles();
      setVehicles(list);
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

  const addOrUpdateVehicle = async (vehicle: Vehicle) => {
    const res = await saveVehicle(vehicle);
    if (res.success) {
      await refresh();
    }
    return res;
  };

  const removeVehicle = async (id: string) => {
    await deleteVehicle(id);
    await refresh();
  };

  return { vehicles, loading, addOrUpdateVehicle, removeVehicle, refresh };
}
