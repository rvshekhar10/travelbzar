'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppUser, UserRole } from '@/types';
import { auth, db } from './config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'travelbzar_active_user_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check local session cache first
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      // Ignore
    }

    // 2. Attach Firebase Auth observer
    let unsubscribe = () => {};
    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            // Fetch live user role & profile from Firestore
            if (db) {
              try {
                const snap = await getDoc(doc(db, 'users', fbUser.uid));
                if (snap.exists()) {
                  const userData = snap.data() as AppUser;
                  setUser(userData);
                  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
                  setLoading(false);
                  return;
                }
              } catch (e) {
                console.info('Firestore profile lookup notice:', e);
              }
            }

            // Fallback for owner if doc was missing
            if (fbUser.email?.toLowerCase() === 'rvshekhar10@gmail.com') {
              const ownerData: AppUser = {
                id: fbUser.uid,
                role: 'owner',
                name: 'Chandra Shekhar (Owner)',
                email: 'rvshekhar10@gmail.com',
                phone: '+91 9007210697',
                status: 'active',
                createdAt: new Date().toISOString(),
              };
              if (db) {
                try {
                  await setDoc(doc(db, 'users', fbUser.uid), ownerData, { merge: true });
                } catch {
                  // ignore
                }
              }
              setUser(ownerData);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(ownerData));
            }
          } else {
            // Signed out in Firebase Auth
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn('Auth state change observer error:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!auth) {
      setLoading(false);
      return { success: false, error: 'Firebase Auth is unavailable. Check network or configuration.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      let appUserData: AppUser | null = null;

      // Fetch user profile from Firestore
      if (db) {
        try {
          const snap = await getDoc(doc(db, 'users', cred.user.uid));
          if (snap.exists()) {
            appUserData = snap.data() as AppUser;
          }
        } catch (err) {
          console.error('Firestore user lookup error:', err);
        }
      }

      // If owner logs in, ensure owner role and document exists in Firestore
      if (cleanEmail === 'rvshekhar10@gmail.com') {
        if (!appUserData || appUserData.role !== 'owner') {
          appUserData = {
            id: cred.user.uid,
            role: 'owner',
            name: 'Chandra Shekhar (Owner)',
            email: 'rvshekhar10@gmail.com',
            phone: '+91 9007210697',
            status: 'active',
            createdAt: appUserData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (db) {
            await setDoc(doc(db, 'users', cred.user.uid), appUserData, { merge: true });
          }
        }
      }

      if (!appUserData) {
        // User exists in Firebase Auth but has not been provisioned in Firestore
        appUserData = {
          id: cred.user.uid,
          role: 'customer',
          name: cred.user.displayName || cleanEmail.split('@')[0],
          email: cred.user.email || cleanEmail,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        if (db) {
          await setDoc(doc(db, 'users', cred.user.uid), appUserData, { merge: true });
        }
      }

      setUser(appUserData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUserData));
      setLoading(false);
      return { success: true, user: appUserData };
    } catch (err: unknown) {
      setLoading(false);
      let errorMsg = 'Invalid credentials. Please verify your email and password.';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          errorMsg = 'Invalid email or password. If you are a driver or customer, ensure your account was created by the owner.';
        } else if (code === 'auth/wrong-password') {
          errorMsg = 'Incorrect password. Please try again.';
        } else if (code === 'auth/too-many-requests') {
          errorMsg = 'Access to this account has been temporarily disabled due to many failed login attempts.';
        } else if (code === 'auth/network-request-failed') {
          errorMsg = 'Network connection failed. Please check your internet connection.';
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {
        // ignore
      }
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const updateUserProfile = async (data: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.id), updated, { merge: true });
      } catch {
        // fallback
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
