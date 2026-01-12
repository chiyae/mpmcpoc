'use client';

import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { SidebarMenuButton } from './ui/sidebar';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  return (
    <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
      <LogOut />
      <span>Logout</span>
    </SidebarMenuButton>
  );
}
