import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';
import firebaseConfig from './config';
import { AppUser, Driver } from '@/types';

/**
 * Provisions a new user account directly in Firebase Auth and Firestore
 * using a secondary Firebase App instance. This ensures the Owner's active
 * session in the browser is NEVER interrupted or signed out.
 */
export async function provisionUserAccount(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'driver' | 'customer';
  driverDetails?: {
    licenseNumber: string;
    licenseExpiry: string;
    assignedVehicleId?: string;
  };
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const tempAppName = `provision-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, cleanEmail, params.password);
    const uid = cred.user.uid;
    await signOut(tempAuth);

    const now = new Date().toISOString();

    // 1. Create User Document in Firestore
    const userDoc: AppUser = {
      id: uid,
      role: params.role,
      name: params.name.trim(),
      email: cleanEmail,
      phone: params.phone.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      await setDoc(doc(db, 'users', uid), userDoc, { merge: true });

      // 2. If Driver role, also create Driver record in Firestore
      if (params.role === 'driver' && params.driverDetails) {
        const driverDoc: Driver = {
          id: uid,
          name: params.name.trim(),
          phone: params.phone.trim(),
          email: cleanEmail,
          licenseNumber: params.driverDetails.licenseNumber.trim().toUpperCase(),
          licenseExpiry: params.driverDetails.licenseExpiry,
          status: 'ACTIVE',
          assignedVehicleId: params.driverDetails.assignedVehicleId,
          totalTrips: 0,
          rating: 5.0,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'drivers', uid), driverDoc, { merge: true });

        // Update assigned vehicle's currentDriverId in Firestore
        if (params.driverDetails.assignedVehicleId) {
          await setDoc(
            doc(db, 'vehicles', params.driverDetails.assignedVehicleId),
            { currentDriverId: uid, updatedAt: now },
            { merge: true }
          );
        }
      }
    }

    return { success: true, uid };
  } catch (err: unknown) {
    console.error('Provisioning error:', err);
    let errorMsg = 'Failed to provision account in Firebase Auth.';
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered in Firebase. Please use another email or log in with existing account.';
      } else if (code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      }
    } else if (err instanceof Error) {
      errorMsg = err.message;
    }
    return { success: false, error: errorMsg };
  } finally {
    try {
      await deleteApp(tempApp);
    } catch {
      // ignore
    }
  }
}
