
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    if (typeof window !== 'undefined') {
        try {
            const initializedServices = initializeFirebase();
            setServices(initializedServices);
        } catch (e) {
            // Don't re-throw the error, which causes a hard crash.
            // Instead, log it and allow the app to render.
            // Components that use Firebase will show a loading/error state.
            console.error("Firebase initialization failed during client setup. The app may not function correctly.", e);
            setServices(null);
        }
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  return (
    <FirebaseProvider
      firebaseApp={services?.firebaseApp ?? null}
      auth={services?.auth ?? null}
      firestore={services?.firestore ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
