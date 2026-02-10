
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Prioritize local config for development.
  // When running locally, firebaseConfig will have keys from .env.local.
  // When deployed on App Hosting, firebaseConfig values will be undefined,
  // but initializeApp() without arguments will work.
  if (firebaseConfig.apiKey) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If no apiKey in local config, assume it's running on App Hosting and try auto-init.
  try {
    const firebaseApp = initializeApp();
    return getSdks(firebaseApp);
  } catch (e) {
    // If both methods fail, then throw the helpful error.
    console.error("Firebase initialization failed:", e);
    throw new Error(
      'Firebase API Key is missing. Please create a .env.local file in the root of your project and add your Firebase configuration. Refer to .env.example for the required variables.'
    );
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

