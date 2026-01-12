'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Logo from '@/components/logo';
import DashboardHeader from '@/components/dashboard-header';
import MainMenu from '@/app/main-menu';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-6 w-80 mx-auto" />
          <div className="flex justify-center gap-4 pt-8">
            <Skeleton className="h-48 w-64" />
            <Skeleton className="h-48 w-64" />
            <Skeleton className="h-48 w-64" />
          </div>
        </div>
      </div>
    );
  }

  const headerUser = {
    name: user.displayName || user.email || "User",
    role: "Admin",
    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
  };

  return (
    <SidebarProvider>
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        <DashboardHeader title="Main Menu" user={headerUser} />
        <MainMenu />
      </SidebarInset>
    </SidebarProvider>
  );
}
