'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // In a real app with roles, you'd redirect based on user.role
        // For now, we'll default to the bulk-store dashboard.
        router.push('/bulk-store/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  // Display a loading state while checking for the user
  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-8 w-80" />
        <div className="flex justify-center gap-4 pt-8">
            <Skeleton className="h-48 w-64" />
            <Skeleton className="h-48 w-64" />
            <Skeleton className="h-48 w-64" />
        </div>
      </div>
    </div>
  );
}
