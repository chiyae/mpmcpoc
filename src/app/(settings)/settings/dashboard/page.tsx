
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Truck, Package, Settings, HandHeart } from "lucide-react";
import Link from "next/link";

const settingsLinks = [
    {
        href: '/settings/user-management',
        icon: Users,
        title: 'User Management',
        description: 'Add, remove, or edit users and their roles.'
    },
    {
        href: '/settings/supplier-management',
        icon: Truck,
        title: 'Supplier Management',
        description: 'Manage vendors and the items they supply.'
    },
    {
        href: '/settings/item-master',
        icon: Package,
        title: 'Item Master Data',
        description: 'Define and manage all inventory item definitions.'
    },
    {
        href: '/settings/service-management',
        icon: HandHeart,
        title: 'Service Management',
        description: 'Define billable services like consultation fees.'
    },
    {
        href: '/settings/general',
        icon: Settings,
        title: 'General Settings',
        description: 'Configure application-wide settings like currency.'
    },
]


export default function SettingsDashboard() {
  return (
    <div className="space-y-6">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-muted-foreground">
                Manage your application's core data and configurations from one place.
            </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsLinks.map((link) => (
                 <Link href={link.href} key={link.title}>
                    <Card className="hover:bg-card-foreground/5 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <link.icon className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>{link.title}</CardTitle>
                                <CardDescription className="mt-1">{link.description}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                 </Link>
            ))}
        </div>
    </div>
  );
}
