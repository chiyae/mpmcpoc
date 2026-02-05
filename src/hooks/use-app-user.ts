'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { User as AppUserType } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function useAppUser() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUserType>(userDocRef);

  const isLoading = isAuthLoading || isAppUserLoading;

  const user = {
    name: isLoading ? "Loading..." : appUser?.displayName || authUser?.email || "User",
    role: isLoading ? "..." : appUser?.role || "user",
    avatarUrl: authUser ? `https://picsum.photos/seed/${authUser.uid}/100/100` : "/default-avatar.png"
  };

  return { user, isLoading, authUser, appUser };
}
