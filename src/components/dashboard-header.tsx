
"use client";

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Home, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import Logo from "./logo"
import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
    title: string;
    user: {
        name: string;
        role: string;
        avatarUrl?: string;
    }
}

function HeaderActions({ user }: { user: DashboardHeaderProps['user'] }) {
    const avatarFallback = user.name.split(' ').map(n => n[0]).join('');
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (auth) {
        await auth.signOut();
        }
        router.push('/login');
    };

    return (
        <div className="ml-auto flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" aria-label="Home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                       <DropdownMenuItem asChild>
                         <Link href="/settings/dashboard">
                           <Settings className="mr-2 h-4 w-4" />
                           <span>Settings</span>
                         </Link>
                       </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default function DashboardHeader({ title, user }: DashboardHeaderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // This prevents a hydration mismatch by ensuring the header content (which depends on client-side state) 
    // is only rendered on the client.
    if (!mounted) {
        return (
             <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <SidebarTrigger className="md:hidden" />
                 <div className="hidden md:block">
                    <Logo />
                </div>
                 <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
             </header>
        );
    }

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
                <Logo />
            </div>

            <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>

            <HeaderActions user={user} />
        </header>
    )
}
