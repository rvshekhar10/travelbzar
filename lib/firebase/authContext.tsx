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
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: UserRole) => void;
  register: (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
    role?: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, AppUser> = {
  owner: {
    id: 'user-owner-1',
    role: 'owner',
    name: 'Travel BZAR Owner',
    email: 'owner@travelbzar.com',
    phone: '+91 9007210697',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  driver: {
    id: 'drv-1',
    role: 'driver',
    name: 'Rajesh Kumar (Chauffeur)',
    email: 'driver@travelbzar.com',
    phone: '+91 9876543210',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  customer: {
    id: 'user-customer-1',
    role: 'customer',
    name: 'Amit Sharma',
    email: 'customer@travelbzar.com',
    phone: '+91 9431100000',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
};

const AUTH_STORAGE_KEY = 'travelbzar_active_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check local session persistence first
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      // Ignore
    }

    // 2. Attach Firebase Auth observer if available
    let unsubscribe = () => {};
    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            // Fetch user profile from Firestore if available
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
                console.info('Firestore profile lookup fallback:', e);
              }
            }
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

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Check if user exists in local store (e.g. provisioned by owner in driver/fleet setup)
    if (typeof window !== 'undefined') {
      try {
        const rawStore = localStorage.getItem('travelbzar_poc_data_v1');
        if (rawStore) {
          const parsed = JSON.parse(rawStore);
          const matchedUser = Object.values(parsed.users || {}).find(
            (u: unknown) => (u as AppUser)?.email?.toLowerCase().trim() === lowerEmail
          ) as AppUser | undefined;
          if (matchedUser) {
            setUser(matchedUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
            setLoading(false);
            return { success: true };
          }
        }
      } catch {
        // fallback
      }
    }

    // Check if it's one of the demo credentials
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail.includes('owner')) {
      demoLogin('owner');
      setLoading(false);
      return { success: true };
    }
    if (lowerEmail.includes('driver')) {
      demoLogin('driver');
      setLoading(false);
      return { success: true };
    }
    if (lowerEmail.includes('customer')) {
      demoLogin('customer');
      setLoading(false);
      return { success: true };
    }

    // Attempt Firebase Auth
    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        let appUserData: AppUser = {
          id: cred.user.uid,
          role: 'customer', // default role
          name: cred.user.displayName || (email || 'user').split('@')[0],
          email: cred.user.email || email,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', cred.user.uid));
            if (snap.exists()) {
              appUserData = snap.data() as AppUser;
            }
          } catch {
            // fallback
          }
        }

        setUser(appUserData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUserData));
        setLoading(false);
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid credentials. Please check your email and password.';
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    }

    // Default fallback customer account
    const fallbackUser: AppUser = {
      id: `usr-${Date.now()}`,
      role: 'customer',
      name: (email || 'user').split('@')[0],
      email: email,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setUser(fallbackUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
    setLoading(false);
    return { success: true };
  };

  const demoLogin = (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setUser(demoUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    }
  };

  const register = async (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
    role?: UserRole;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const assignedRole = data.role || 'customer';

    if (auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
        const newUser: AppUser = {
          id: cred.user.uid,
          role: assignedRole,
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        if (db) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), newUser);
          } catch {
            // fallback
          }
        }

        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        setLoading(false);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to register account.';
        setLoading(false);
        return { success: false, error: msg };
      }
    }

    // Fallback registration
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      role: assignedRole,
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setLoading(false);
    return { success: true };
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
        demoLogin,
        register,
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
