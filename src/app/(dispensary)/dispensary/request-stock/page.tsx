
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RequestStockForm } from '@/components/request-stock-form';
import type { Item, InternalOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export default function RequestStockPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const itemIds = React.useMemo(() => {
    const ids = searchParams.get('items');
    return ids ? ids.split(',') : [];
  }, [searchParams]);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const selectedItems = React.useMemo(() => {
    if (!allItems) return [];
    return itemIds
        .map(id => allItems.find(item => item.id === id))
        .filter((item): item is Item => !!item)
        .map(item => ({ id: item.id, name: formatItemName(item) }));
  }, [allItems, itemIds]);


  const handleRequestStock = async (items: { itemId: string; quantity: number }[]) => {
    if (!firestore) return;

    const orderId = `IO-${Date.now()}`;
    const internalOrderRef = doc(firestore, 'internalOrders', orderId);
    
    const newOrder: InternalOrder = {
        id: orderId,
        date: new Date().toISOString(),
        requestingLocationId: 'dispensary',
        status: 'Pending',
        items,
    }

    try {
        await setDoc(internalOrderRef, newOrder);
        toast({
          title: "Stock Request Submitted",
          description: `Order #${newOrder.id} has been sent to the bulk store for processing.`,
        });
        router.push('/dispensary/inventory');
    } catch (error) {
        console.error("Failed to submit stock request:", error);
        toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit the stock request." });
    }
  };

  const isLoading = isLoadingItems;
  const noItemsSelected = !isLoading && selectedItems.length === 0;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Request New Stock Transfer</CardTitle>
        <CardDescription>
          {noItemsSelected
            ? "No items were selected. Go back to the inventory to select items to request."
            : "Specify the quantities you need from the bulk store for the selected items."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )}
        {!isLoading && !noItemsSelected && (
            <RequestStockForm
                selectedItems={selectedItems}
                onSubmit={handleRequestStock}
                onCancel={() => router.push('/dispensary/inventory')}
            />
        )}
        {noItemsSelected && (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Please select items from the inventory page first.</p>
                <Button onClick={() => router.push('/dispensary/inventory')}>
                    Back to Inventory
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
