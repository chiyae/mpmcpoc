
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
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
import type { Item, Stock, StockTakeSession, StockTakeItem } from '@/lib/types';
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
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, writeBatch, setDoc, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { formatItemName } from '@/lib/utils';

type EditableStockTakeItem = StockTakeItem & {
  physicalQty: number | ''; // Allow empty string for input
};

export default function StockTakingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const sessionRef = useMemoFirebase(() => sessionId && firestore ? doc(firestore, 'stockTakeSessions', sessionId) : null, [firestore, sessionId]);
  const { data: sessionData, isLoading: isSessionLoading } = useDoc<StockTakeSession>(sessionRef);

  const itemsRef = useMemoFirebase(() => sessionRef ? collection(sessionRef, 'items') : null, [sessionRef]);
  const { data: stockTakeItems, isLoading: areItemsLoading } = useCollection<StockTakeItem>(itemsRef);
  
  const [editableItems, setEditableItems] = React.useState<EditableStockTakeItem[]>([]);
  
  React.useEffect(() => {
    // When a session is loaded and has no items, create them from current stock
    const createStockTakeList = async () => {
      if (firestore && sessionData && stockTakeItems?.length === 0 && sessionData.status === 'Ongoing') {
        const stockQuery = query(collection(firestore, 'stocks'), where('locationId', '==', sessionData.locationId));
        const itemsMasterQuery = collection(firestore, 'items');
        
        const [stockSnapshot, itemsSnapshot] = await Promise.all([
          getDocs(stockQuery),
          getDocs(itemsMasterQuery),
        ]);
        
        const allItems = itemsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Item[];
        const locationStock = stockSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Stock[];
        
        const batch = writeBatch(firestore);

        locationStock.forEach(stock => {
          const itemDetail = allItems.find(item => item.id === stock.itemId);
          if (itemDetail) {
            const newItemRef = doc(itemsRef!);
            const newItem: StockTakeItem = {
              id: newItemRef.id,
              itemId: stock.itemId,
              itemName: formatItemName(itemDetail),
              batchId: stock.batchId,
              expiryDate: stock.expiryDate,
              systemQty: stock.currentStockQuantity,
              physicalQty: stock.currentStockQuantity, // Default to system quantity
              variance: 0,
            };
            batch.set(newItemRef, newItem);
          }
        });
        await batch.commit();
        toast({ title: 'Session Ready', description: 'Stock list has been loaded. You can start counting.' });
      }
    };
    
    if (sessionData && !areItemsLoading && stockTakeItems?.length === 0) {
      createStockTakeList();
    }
  }, [sessionData, stockTakeItems, areItemsLoading, firestore, itemsRef]);


  React.useEffect(() => {
    if (stockTakeItems) {
      setEditableItems(stockTakeItems.map(item => ({ ...item, physicalQty: item.physicalQty ?? '' })));
    }
  }, [stockTakeItems]);
  
  const handlePhysicalQtyChange = (itemId: string, value: string) => {
    setEditableItems(prevList =>
      prevList.map(item =>
        item.id === itemId ? { ...item, physicalQty: value === '' ? '' : parseInt(value, 10) } : item
      )
    );
  };
  
  const handleBlur = async (itemId: string, physicalQty: number | '') => {
    if (!itemsRef || physicalQty === '') return;
    const itemRef = doc(itemsRef, itemId);
    const originalItem = stockTakeItems?.find(i => i.id === itemId);
    if (!originalItem) return;

    const variance = physicalQty - originalItem.systemQty;
    await setDoc(itemRef, { physicalQty, variance }, { merge: true });
    // No toast here to avoid overwhelming the user
  };

  const hasPendingChanges = editableItems.some(item => {
    const original = stockTakeItems?.find(i => i.id === item.id);
    if (!original) return false;
    return (item.physicalQty !== '' && item.physicalQty !== original.physicalQty);
  });
  
  const isLoading = isSessionLoading || areItemsLoading;

  const handleFinalizeStockTake = async () => {
    if (!firestore || !stockTakeItems || !sessionRef || !sessionData) return;
    
    const batch = writeBatch(firestore);

    // 1. Update the actual stock collection
    for (const item of stockTakeItems) {
        if(item.variance !== 0) {
            const stockRefQuery = query(
                collection(firestore, 'stocks'), 
                where('itemId', '==', item.itemId),
                where('batchId', '==', item.batchId),
                where('locationId', '==', sessionData.locationId)
            );
            
            const snapshot = await getDocs(stockRefQuery);

            if(!snapshot.empty) {
                const stockDocId = snapshot.docs[0].id;
                const stockRef = doc(firestore, 'stocks', stockDocId);
                batch.update(stockRef, { currentStockQuantity: item.physicalQty });
            }
        }
    }

    // 2. Mark the session as completed
    batch.update(sessionRef, { status: 'Completed' });

    try {
        await batch.commit();
        toast({
            title: "Stock Take Finalized",
            description: "Inventory quantities have been updated successfully.",
        });
        router.push('/bulk-store/stock-take-history');
    } catch(error) {
        console.error("Stock take failed:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update stock quantities.' });
    }
  };
  
  if (!sessionId) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent><p>No stock-take session ID provided. Please start a session from the inventory page.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Taking Session</CardTitle>
        <CardDescription>
          {sessionData ? `Session for ${sessionData.locationId} started on ${format(new Date(sessionData.date), 'PPpp')}` : 'Loading session...'}
           {sessionData?.status === 'Completed' && <span className="text-destructive font-bold ml-2">(COMPLETED)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Item Name (Batch)</TableHead>
                <TableHead className="text-center">System Qty</TableHead>
                <TableHead className="text-center">Physical Count</TableHead>
                <TableHead className="text-center">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 5}).map((_,i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className='h-8 w-full'/></TableCell></TableRow>
              ))}
              {!isLoading && editableItems.map((item) => {
                const physicalQty = item.physicalQty === '' ? null : Number(item.physicalQty);
                const variance = physicalQty === null ? null : physicalQty - item.systemQty;

                let varianceColor = '';
                if (variance !== null) {
                    if (variance < 0) varianceColor = 'text-destructive';
                    if (variance > 0) varianceColor = 'text-green-600';
                }

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemName} <span className="text-xs text-muted-foreground">({item.batchId})</span>
                    </TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={item.physicalQty}
                        onChange={(e) => handlePhysicalQtyChange(item.id, e.target.value)}
                        onBlur={(e) => handleBlur(item.id, e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-24 mx-auto text-center"
                        min="0"
                        disabled={sessionData?.status === 'Completed'}
                      />
                    </TableCell>
                    <TableCell className={`text-center font-bold ${varianceColor}`}>
                        {variance !== null ? (variance > 0 ? `+${variance}` : variance) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && editableItems.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center h-48">Loading stock list for this session...</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {sessionData?.status === 'Ongoing' && (
        <CardFooter className="flex justify-end">
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={hasPendingChanges || isLoading}>Finalize & Update Stock</Button>
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
      )}
    </Card>
  );
}
