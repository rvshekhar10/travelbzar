'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { playNotificationSound, NotificationSoundRole } from '@/services/soundService';

/**
 * Global background audio listener for new incoming real-time notifications.
 * Automatically selects:
 * 1. 4sec Melodic Classic -> Customer notifications
 * 2. 4sec Home Ding-Dong -> Owner notifications
 * 3. 8sec Digital Alarm Buzzer -> Driver ride requests & alert notifications
 */
export function NotificationSoundListener() {
  const { user } = useAuth();
  const userId = user?.id || (user?.role === 'owner' ? 'owner' : undefined);
  const { notifications } = useNotifications(userId);

  const prevNotificationsCountRef = useRef<number | null>(null);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      if (notifications) {
        initialLoadDoneRef.current = true;
      }
      return;
    }

    // On initial mount / load, record all existing IDs without playing audio
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      notifications.forEach((n) => knownNotificationIdsRef.current.add(n.id));
      prevNotificationsCountRef.current = notifications.length;
      return;
    }

    // Check for genuinely brand-new incoming unread notifications
    const newNotifications = notifications.filter(
      (n) => !n.read && !knownNotificationIdsRef.current.has(n.id)
    );

    if (newNotifications.length > 0) {
      // Record new IDs
      newNotifications.forEach((n) => knownNotificationIdsRef.current.add(n.id));

      // Resolve role
      const role: NotificationSoundRole =
        user?.role === 'driver'
          ? 'driver'
          : user?.role === 'owner'
          ? 'owner'
          : 'customer';

      // Play role-tailored audio tune
      playNotificationSound(role);
    }

    prevNotificationsCountRef.current = notifications.length;
  }, [notifications, user?.role]);

  return null;
}

