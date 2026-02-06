
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Pill, DollarSign, Wrench } from 'lucide-react';
import { useAppUser } from '@/hooks/use-app-user';

export default function MainMenu() {
    const { appUser } = useAppUser();

    const modules = [
        {
            href: "/bulk-store/dashboard",
            icon: Building,
            title: "Bulk Store",
            description: "Manage main inventory, procurement, and internal stock transfers.",
            roles: ["admin", "pharmacy"]
        },
        {
            href: "/dispensary/dashboard",
            icon: Pill,
            title: "Dispensary",
            description: "Handle medication dispensing, patient sales, and local stock.",
            roles: ["admin", "pharmacy"]
        },
        {
            href: "/billing/dashboard",
            icon: DollarSign,
            title: "Billing",
            description: "Create patient bills, manage invoices, and view financial reports.",
            roles: ["admin", "cashier"]
        },
        {
            href: "/tools/dashboard",
            icon: Wrench,
            title: "Tools",
            description: "Access powerful assistants and utilities to streamline your workflow.",
            roles: ["admin", "pharmacy"]
        }
    ]

    const accessibleModules = appUser ? modules.filter(module => module.roles.includes(appUser.role)) : [];

    return (
        <main className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Welcome to MediTrack Pro</h2>
            <p className="text-muted-foreground">Please select a module to continue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
                {accessibleModules.map(module => (
                     <Link href={module.href} passHref key={module.title}>
                        <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                            <module.icon className="h-12 w-12 mb-4 text-primary" />
                            <CardTitle>{module.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">
                            {module.description}
                            </p>
                        </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}

    