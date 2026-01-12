'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { dispensaryItems, pendingDispensations as initialPendingDispensations } from '@/lib/data';
import type { Bill } from '@/lib/types';
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

export default function DispensePage() {
  const { toast } = useToast();
  const [pendingDispensations, setPendingDispensations] = React.useState<Bill[]>(initialPendingDispensations);
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = React.useState(false);

  const handleOpenDispenseDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDispenseDialogOpen(true);
  };

  const handleDispense = () => {
    if (!selectedBill) return;

    let canDispense = true;
    const stockUpdates: { itemId: string; newQuantity: number }[] = [];

    // Check stock availability first
    selectedBill.items.forEach((billItem) => {
      const inventoryItem = dispensaryItems.find((item) => item.id === billItem.itemId);
      if (!inventoryItem || inventoryItem.quantity < billItem.quantity) {
        canDispense = false;
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Not enough stock for ${inventoryItem?.name || billItem.itemId}.`,
        });
      } else {
        stockUpdates.push({
            itemId: billItem.itemId,
            newQuantity: inventoryItem.quantity - billItem.quantity
        });
      }
    });

    if (canDispense) {
      // Apply stock updates (in-memory for now)
      stockUpdates.forEach(update => {
        const itemIndex = dispensaryItems.findIndex(item => item.id === update.itemId);
        if (itemIndex !== -1) {
            dispensaryItems[itemIndex].quantity = update.newQuantity;
        }
      });
      
      // Remove the bill from the pending list
      setPendingDispensations(prev => prev.filter(bill => bill.id !== selectedBill.id));

      toast({
        title: 'Items Dispensed',
        description: `Stock has been updated for bill ${selectedBill.id}.`,
      });
      setIsDispenseDialogOpen(false);
      setSelectedBill(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Dispensations</CardTitle>
          <CardDescription>
            Bills awaiting dispensation from the billing department.
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
              {pendingDispensations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No pending dispensations.
                  </TableCell>
                </TableRow>
              ) : (
                pendingDispensations.map((bill) => (
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
                Verify stock and confirm dispensation.
              </DialogDescription>
            </DialogHeader>
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
                    {selectedBill.items.map((billItem) => {
                    const inventoryItem = dispensaryItems.find((item) => item.id === billItem.itemId);
                    const availableQty = inventoryItem?.quantity || 0;
                    const hasSufficientStock = availableQty >= billItem.quantity;

                    return (
                        <TableRow key={billItem.itemId}>
                        <TableCell className="font-medium">
                            {inventoryItem?.name || billItem.itemId}
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
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleDispense}>Confirm & Dispense All</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
