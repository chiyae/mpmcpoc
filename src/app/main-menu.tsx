'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Pill, DollarSign } from 'lucide-react';

export default function MainMenu() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Welcome to MediTrack Pro</h2>
            <p className="text-muted-foreground">Please select a module to continue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <Link href="/bulk-store/dashboard" passHref>
                <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <Building className="h-12 w-12 mb-4 text-primary" />
                    <CardTitle>Bulk Store</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                    Manage main inventory, procurement, and internal stock transfers.
                    </p>
                </CardContent>
                </Card>
            </Link>
            
            <Link href="/dispensary/dashboard" passHref>
                <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <Pill className="h-12 w-12 mb-4 text-primary" />
                    <CardTitle>Dispensary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                    Handle medication dispensing, patient sales, and local stock.
                    </p>
                </CardContent>
                </Card>
            </Link>

            <Link href="/billing/dashboard" passHref>
                <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <DollarSign className="h-12 w-12 mb-4 text-primary" />
                    <CardTitle>Billing</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                    Create patient bills, manage invoices, and view financial reports.
                    </p>
                </CardContent>
                </Card>
            </Link>
            </div>
        </main>
    );
}
