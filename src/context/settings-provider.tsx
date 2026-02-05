'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicSettings {
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    currency: string;
}

interface SettingsContextValue {
    settings: ClinicSettings | null;
    isLoading: boolean;
    currency: string;
    formatCurrency: (amount: number) => string;
}

const defaultSettings: ClinicSettings = {
    clinicName: 'MediTrack Pro',
    clinicAddress: '123 Health St, Wellness City',
    clinicPhone: '+123456789',
    currency: 'USD',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const settingsDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'settings', 'clinic') : null),
        [firestore, user]
      );
    const { data: settingsData, isLoading: isSettingsLoading, error } = useDoc<ClinicSettings>(settingsDocRef);
    
    const settings = useMemo(() => settingsData || defaultSettings, [settingsData]);
    const currency = useMemo(() => settings?.currency || 'USD', [settings]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currency,
        }).format(amount)
    };

    const value = useMemo(() => ({
        settings,
        isLoading: isUserLoading || isSettingsLoading,
        currency,
        formatCurrency,
    }), [settings, isUserLoading, isSettingsLoading, currency]);

    // The main page.tsx handles the initial auth loading skeleton, so we don't need a global one here.
    
    if (error) {
        // console.error("Error loading settings, using default. Error:", error);
        // Fallback to default settings if there's an error (like permission denied)
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
