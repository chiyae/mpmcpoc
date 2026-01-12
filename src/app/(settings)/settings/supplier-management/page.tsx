
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
import type { Vendor } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
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
  const firestore = useFirestore();

  const vendorsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vendors') : null),
    [firestore]
  );
  const { data: vendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);
  
  const [isAddVendorOpen, setIsAddVendorOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isLoading = areVendorsLoading;

  const handleVendorAdded = async (vendorData: Omit<Vendor, 'id'>) => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'vendors'), vendorData);
      setIsAddVendorOpen(false);
      toast({
          title: "Vendor Added",
          description: `Successfully added ${vendorData.name}.`
      })
    } catch(error) {
        console.error("Error adding vendor:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add vendor. Please try again."
        })
    }
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
        {isClient && (
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
                  <AddVendorForm onVendorAdded={handleVendorAdded} />
              </DialogContent>
          </Dialog>
        )}
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
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && vendors && vendors.map(vendor => (
                    <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm">{vendor.email}</span>
                                <span className="text-xs text-muted-foreground">{vendor.contactPerson} ({vendor.phone})</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          {!isLoading && (!vendors || vendors.length === 0) && (
             <p className="py-12 text-center text-muted-foreground">No vendors found. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
