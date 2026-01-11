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
import { dispensaryItems } from '@/lib/data';
import type { Bill } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

// Mock data representing a bill sent from the billing department
const mockBillFromBilling: Bill = {
  id: 'BILL-2024-07-30-001',
  date: new Date().toISOString(),
  patientName: 'John Doe',
  consultationFee: 50,
  labFee: 0,
  items: [
    { itemId: 'PAR500', quantity: 20, unitPrice: 0.1, total: 2.0 },
    { itemId: 'IBU200', quantity: 15, unitPrice: 0.15, total: 2.25 },
    { itemId: 'VITC1000', quantity: 10, unitPrice: 0.2, total: 2.0 },
  ],
  grandTotal: 56.25,
};

export default function DispensePage() {
  const { toast } = useToast();
  const [bill, setBill] = React.useState<Bill | null>(mockBillFromBilling);

  const handleDispense = () => {
    if (!bill) return;

    let canDispense = true;
    const stockUpdates: { itemId: string; newQuantity: number }[] = [];

    // Check stock availability first
    bill.items.forEach((billItem) => {
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
      
      toast({
        title: 'Items Dispensed',
        description: `Stock has been updated for bill ${bill.id}.`,
      });
      setBill(null); // Clear the bill after dispensing
    }
  };

  if (!bill) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle>No Pending Dispensations</CardTitle>
                    <CardDescription>
                        There are currently no bills awaiting dispensation from the billing department.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispense Medication</CardTitle>
        <CardDescription>
          Dispensing items for Bill <strong>{bill.id}</strong> for patient <strong>{bill.patientName}</strong>.
          Verify stock and confirm dispensation.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {bill.items.map((billItem) => {
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
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleDispense}>Confirm & Dispense All</Button>
      </CardFooter>
    </Card>
  );
}
