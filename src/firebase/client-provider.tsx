
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
    // This effect runs only on the client, after the initial render,
    // ensuring environment variables are available.
    if (typeof window !== 'undefined') {
      setServices(initializeFirebase());
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
