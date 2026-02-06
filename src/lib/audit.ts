
'use client';
import { collection, doc, setDoc, Firestore } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as AppUser } from '@/lib/types';

export const logAction = async (
    firestore: Firestore,
    user: { authUser: AuthUser | null, appUser: AppUser | null },
    action: string,
    details: Record<string, any> = {}
) => {
    if (!user.authUser || !user.appUser) return;

    try {
        const logRef = doc(collection(firestore, 'logs'));
        const logEntry = {
            id: logRef.id,
            timestamp: new Date().toISOString(),
            userId: user.authUser.uid,
            userDisplayName: user.appUser.displayName,
            action,
            details,
        };
        await setDoc(logRef, logEntry);
    } catch (error) {
        console.error("Failed to write to audit log:", error);
        // We fail silently here so as not to interrupt the user's primary action.
    }
};
