
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
import type { Item, Stock } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type StockTakeItem = {
  id: string; // Stock document ID
  name: string;
  systemQty: number;
  physicalQty: string; // Use string to handle empty input
};

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export default function StockTakingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const stockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null, [firestore]);
  const { data: dispensaryStocks, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);

  const [stockTakeList, setStockTakeList] = React.useState<StockTakeItem[]>([]);

  React.useEffect(() => {
    if (dispensaryStocks && allItems) {
      const list = dispensaryStocks.map((stock) => {
        const itemDetail = allItems.find(item => item.id === stock.itemId);
        return {
          id: stock.id,
          name: itemDetail ? formatItemName(itemDetail) : 'Unknown Item',
          systemQty: stock.currentStockQuantity,
          physicalQty: '',
        };
      });
      setStockTakeList(list);
    }
  }, [dispensaryStocks, allItems]);

  const handlePhysicalQtyChange = (stockId: string, value: string) => {
    setStockTakeList((prevList) =>
      prevList.map((item) =>
        item.id === stockId ? { ...item, physicalQty: value } : item
      )
    );
  };

  const hasPendingChanges = stockTakeList.some(item => item.physicalQty !== '' && parseInt(item.physicalQty, 10) !== item.systemQty);
  const isLoading = isLoadingItems || isLoadingStock;

  const handleFinalizeStockTake = async () => {
    if (!firestore) return;
    const updates = stockTakeList.filter(item => item.physicalQty !== '' && parseInt(item.physicalQty, 10) >= 0);
    
    if (updates.length === 0) {
        toast({
            variant: "destructive",
            title: "No Changes to Apply",
            description: "Please enter physical counts before finalizing.",
        });
        return;
    }
    
    const batch = writeBatch(firestore);
    updates.forEach(update => {
        const stockRef = collection(firestore, 'stocks').doc(update.id);
        batch.update(stockRef, { currentStockQuantity: parseInt(update.physicalQty, 10) });
    });

    try {
        await batch.commit();
        toast({
            title: "Stock Take Finalized",
            description: "Inventory quantities have been updated successfully.",
        });

        // Reset physical counts after finalization
        setStockTakeList(prev => prev.map(item => ({...item, physicalQty: ''})));
    } catch(error) {
        console.error("Stock take failed:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update stock quantities.' });
    }
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
              {isLoading && Array.from({length: 5}).map((_,i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className='h-8 w-full'/></TableCell></TableRow>
              ))}
              {!isLoading && stockTakeList.map((item) => {
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
            <Button disabled={!hasPendingChanges || isLoading}>Finalize & Update Stock</Button>
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
