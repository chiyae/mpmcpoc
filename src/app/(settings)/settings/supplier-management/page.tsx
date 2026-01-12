
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vendor } from '@/lib/types';
import { bulkStoreItems } from '@/lib/data';
import { vendors as initialVendors } from '@/lib/vendors';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AddVendorForm } from '@/components/add-vendor-form';

export default function SupplierManagementPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = React.useState<Vendor[]>(initialVendors);
  const [isLoading, setIsLoading] = React.useState(false); // Can be tied to data fetching later
  const [isAddVendorOpen, setIsAddVendorOpen] = React.useState(false);

  const handleVendorAdded = (newVendor: Vendor) => {
    setVendors(prev => [...prev, newVendor]);
    setIsAddVendorOpen(false);
    toast({
        title: "Vendor Added",
        description: `Successfully added ${newVendor.name}.`
    })
  }

  return (
    <div className="w-full space-y-6">
       <div className="flex items-center justify-between">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
            <p className="text-muted-foreground">
              Add, view, and manage suppliers and the items they provide.
            </p>
        </header>
        <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
            <DialogTrigger asChild>
                <Button>Add New Vendor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to add a new vendor.
                    </DialogDescription>
                </DialogHeader>
                <AddVendorForm onVendorAdded={handleVendorAdded} allItems={bulkStoreItems} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>
            A list of all registered vendors in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Supplied Items</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && vendors.map(vendor => (
                    <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm">{vendor.email}</span>
                                <span className="text-xs text-muted-foreground">{vendor.contactPerson} ({vendor.phone})</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{vendor.supplies.length} items</Badge>
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          {!isLoading && (!vendors || vendors.length === 0) && (
             <p className="py-12 text-center text-muted-foreground">No vendors found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
