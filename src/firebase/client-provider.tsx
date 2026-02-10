
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
    // It will attempt to initialize Firebase. If it fails (e.g. missing config)
    // it will throw an error that Next.js can catch and display.
    if (typeof window !== 'undefined') {
        try {
            setServices(initializeFirebase());
        } catch (e) {
            // Re-throw the error to be caught by the nearest error boundary.
            // This is better than just logging it, as it makes the problem visible.
            throw e;
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
