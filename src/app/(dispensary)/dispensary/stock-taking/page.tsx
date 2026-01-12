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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { dispensaryItems as initialDispensaryItems } from '@/lib/data';
import type { Item } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type StockTakeItem = {
  id: string;
  name: string;
  systemQty: number;
  physicalQty: string; // Use string to handle empty input
};

export default function StockTakingPage() {
  const { toast } = useToast();
  const [dispensaryItems, setDispensaryItems] = React.useState<Item[]>(initialDispensaryItems);
  const [stockTakeList, setStockTakeList] = React.useState<StockTakeItem[]>([]);

  React.useEffect(() => {
    setStockTakeList(
      dispensaryItems.map((item) => ({
        id: item.id,
        name: item.name,
        systemQty: item.quantity,
        physicalQty: '',
      }))
    );
  }, [dispensaryItems]);

  const handlePhysicalQtyChange = (itemId: string, value: string) => {
    setStockTakeList((prevList) =>
      prevList.map((item) =>
        item.id === itemId ? { ...item, physicalQty: value } : item
      )
    );
  };

  const hasPendingChanges = stockTakeList.some(item => item.physicalQty !== '' && parseInt(item.physicalQty, 10) !== item.systemQty);

  const handleFinalizeStockTake = () => {
    const updates = stockTakeList.filter(item => item.physicalQty !== '' && parseInt(item.physicalQty, 10) >= 0);
    
    if (updates.length === 0) {
        toast({
            variant: "destructive",
            title: "No Changes to Apply",
            description: "Please enter physical counts before finalizing.",
        });
        return;
    }

    // This is where you would typically send the updates to your backend.
    // For now, we update the in-memory `dispensaryItems` array.
    let updatedItems = [...dispensaryItems];
    updates.forEach(update => {
        const itemIndex = updatedItems.findIndex(item => item.id === update.id);
        if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                quantity: parseInt(update.physicalQty, 10),
            };
        }
    });
    setDispensaryItems(updatedItems);
    
    toast({
        title: "Stock Take Finalized",
        description: "Inventory quantities have been updated successfully.",
    });

    // Reset physical counts after finalization
    setStockTakeList(prev => prev.map(item => ({...item, physicalQty: ''})));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Taking</CardTitle>
        <CardDescription>
          Perform a physical count of your inventory. Enter the physical quantity for each item to see the variance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Item Name</TableHead>
                <TableHead className="text-center">System Quantity</TableHead>
                <TableHead className="text-center">Physical Count</TableHead>
                <TableHead className="text-center">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockTakeList.map((item) => {
                const physicalQty = item.physicalQty === '' ? null : parseInt(item.physicalQty, 10);
                const variance = physicalQty === null ? null : physicalQty - item.systemQty;

                let varianceColor = '';
                if (variance !== null) {
                    if (variance < 0) varianceColor = 'text-destructive';
                    if (variance > 0) varianceColor = 'text-green-600';
                }

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={item.physicalQty}
                        onChange={(e) => handlePhysicalQtyChange(item.id, e.target.value)}
                        className="w-24 mx-auto text-center"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className={`text-center font-bold ${varianceColor}`}>
                        {variance !== null ? (variance > 0 ? `+${variance}` : variance) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!hasPendingChanges}>Finalize & Update Stock</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update the system's stock quantities to match your physical counts. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalizeStockTake}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
