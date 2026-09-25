'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppUser, UserRole } from '@/types';
import { getUsers, saveAppUser, deleteAppUser, subscribeToStore } from '@/lib/firebase/store';

export function useUsers(role?: UserRole) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getUsers(role);
      setUsers(list);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  const addOrUpdateUser = async (user: AppUser) => {
    await saveAppUser(user);
    await refresh();
  };

  const removeUser = async (id: string) => {
    await deleteAppUser(id);
    await refresh();
  };

  return { users, loading, addOrUpdateUser, removeUser, refresh };
}
