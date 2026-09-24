'use client';

import { useState, useEffect, useCallback } from 'react';
import { InAppNotification } from '@/types';
import { getNotifications, markNotificationRead, subscribeToStore } from '@/lib/firebase/store';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const list = await getNotifications(userId);
      setNotifications(list);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  const markAsRead = async (id: string) => {
    await markNotificationRead(id);
    await refresh();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, refresh };
}
