'use client';

export type NotificationSoundRole = 'customer' | 'owner' | 'driver';

export const NOTIFICATION_SOUNDS: Record<NotificationSoundRole, string> = {
  // 1. 4sec melodic classic for customer notifications
  customer: '/notification-tunes/mixkit-melodic-classic-door-bell-111.wav',

  // 2. 4sec melody home for owner notifications
  owner: '/notification-tunes/mixkit-home-standard-ding-dong-109.wav',

  // 3. 8sec buzzer for driver ride requests & alerts
  driver: '/notification-tunes/mixkit-digital-clock-digital-alarm-buzzer-992.wav',
};

// Singleton audio instances to reuse
let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays the role-specific notification sound tune.
 * Automatically handles browser user-interaction audio autoplay policies gracefully.
 */
export function playNotificationSound(role: NotificationSoundRole = 'customer') {
  if (typeof window === 'undefined') return;

  try {
    const soundPath = NOTIFICATION_SOUNDS[role] || NOTIFICATION_SOUNDS.customer;
    
    // Stop any existing playing notification sound
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(soundPath);
    currentAudio = audio;

    // Driver alert volume is prioritized to be clearly audible
    audio.volume = role === 'driver' ? 1.0 : 0.85;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be blocked by browser until user touches / clicks anywhere on the page
        console.warn('Audio autoplay blocked or user gesture required:', err);
      });
    }
  } catch (err) {
    console.error('Failed to play notification audio:', err);
  }
}

