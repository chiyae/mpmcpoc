
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Bill, Stock } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
  } from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


// A simple helper to differentiate services from items based on ID format.
// This assumes service IDs are non-numeric strings (e.g., 'CONSULTATION-FEE')
// and item IDs are codes (e.g., 'PAR500').
const isService = (itemId: string) => isNaN(parseInt(itemId.substring(itemId.length - 4)));

export default function DispensePage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const pendingBillsQuery = useMemoFirebase(
    () => firestore 
      ? query(collection(firestore, 'billings'), where('paymentDetails.status', '==', 'Paid'), where('isDispensed', '==', false))
      : null,
    [firestore]
  );
  const { data: pendingDispensations, isLoading: isLoadingBills } = useCollection<Bill>(pendingBillsQuery);
  
  const dispensaryStockQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null,
    [firestore]
  );
  const { data: dispensaryStocks, isLoading: isLoadingStock } = useCollection<Stock>(dispensaryStockQuery);


  // --- State ---
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = React.useState(false);

  const handleOpenDispenseDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDispenseDialogOpen(true);
  };
  
  const itemsToDispense = React.useMemo(() => {
    if (!selectedBill) return [];
    // Only include items that are NOT services
    return selectedBill.items.filter(item => !isService(item.itemId));
  }, [selectedBill]);


  const handleDispense = async () => {
    if (!selectedBill || !dispensaryStocks || !firestore) return;

    let canDispense = true;
    const batch = writeBatch(firestore);

    // This stock check only runs against physical items now
    for (const billItem of itemsToDispense) {
      const stockItem = dispensaryStocks.find((s) => s.itemId === billItem.itemId);
      if (!stockItem || stockItem.currentStockQuantity < billItem.quantity) {
        canDispense = false;
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Not enough stock for ${billItem.itemName}. Available: ${stockItem?.currentStockQuantity || 0}, Required: ${billItem.quantity}.`,
        });
        break; 
      }
    }

    if (canDispense) {
      // Deduct stock quantities for physical items only
      for (const billItem of itemsToDispense) {
        const stockItem = dispensaryStocks.find((s) => s.itemId === billItem.itemId);
        if (stockItem) {
          const stockRef = doc(firestore, 'stocks', stockItem.id);
          const newQuantity = stockItem.currentStockQuantity - billItem.quantity;
          batch.update(stockRef, { currentStockQuantity: newQuantity });
        }
      }

      // Mark the entire bill as dispensed
      const billRef = doc(firestore, 'billings', selectedBill.id);
      batch.update(billRef, { isDispensed: true });

      try {
        await batch.commit();
        toast({
          title: 'Items Dispensed',
          description: `Stock has been updated for bill ${selectedBill.id}.`,
        });
        setIsDispenseDialogOpen(false);
        setSelectedBill(null);
      } catch(error) {
        console.error("Dispense failed:", error);
        toast({
            variant: 'destructive',
            title: 'Dispense Failed',
            description: 'Could not update stock and bill status.',
        })
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Dispensations</CardTitle>
          <CardDescription>
            Bills that have been paid and are awaiting collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingBills && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
              ))}
              {!isLoadingBills && pendingDispensations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No pending dispensations.
                  </TableCell>
                </TableRow>
              ) : (
                pendingDispensations?.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.id}</TableCell>
                    <TableCell>{bill.patientName}</TableCell>
                    <TableCell>{bill.items.length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => handleOpenDispenseDialog(bill)}>
                        View Bill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedBill && (
        <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispense Medication</DialogTitle>
              <DialogDescription>
                Dispensing items for Bill <strong>{selectedBill.id}</strong> for patient <strong>{selectedBill.patientName}</strong>.
                Verify stock and confirm dispensation. Services do not require stock verification.
              </DialogDescription>
            </DialogHeader>
            {isLoadingStock ? <Skeleton className='h-48 w-full' /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Required Qty</TableHead>
                        <TableHead>Available Qty</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {itemsToDispense.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No physical items to dispense.</TableCell></TableRow>}
                        {itemsToDispense.map((billItem) => {
                        const stockItem = dispensaryStocks?.find((s) => s.itemId === billItem.itemId);
                        const availableQty = stockItem?.currentStockQuantity || 0;
                        const hasSufficientStock = availableQty >= billItem.quantity;

                        return (
                            <TableRow key={billItem.itemId}>
                            <TableCell className="font-medium">
                                {billItem.itemName}
                            </TableCell>
                            <TableCell>{billItem.quantity}</TableCell>
                            <TableCell>{availableQty}</TableCell>
                            <TableCell>
                                {hasSufficientStock ? (
                                <Badge variant="secondary">Available</Badge>
                                ) : (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Insufficient
                                </Badge>
                                )}
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                </Table>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleDispense} disabled={isLoadingStock}>Confirm & Dispense All</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
