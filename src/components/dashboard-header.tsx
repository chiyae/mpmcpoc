
"use client";

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Home } from "lucide-react"
import Link from "next/link"
import Logo from "./logo"
import { useEffect, useState } from "react";

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
                       <DropdownMenuItem disabled>
                         {/* Placeholder for future actions */}
                       </DropdownMenuItem>
                    </DropdownMenuGroup>
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

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <Link href="/" className="hidden md:block">
                <Logo />
            </Link>

            <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>

            {mounted && <HeaderActions user={user} />}
        </header>
    )
}
