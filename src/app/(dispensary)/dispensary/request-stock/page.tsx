
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RequestStockForm } from '@/components/request-stock-form';
import type { Item, InternalOrder, Stock } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, setDoc, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ListPlus } from 'lucide-react';
import { ManuallyAddItemDialog } from '@/components/procurement/manually-add-item-dialog';

type ItemForRequest = {
    id: string;
    name: string;
    bulkStoreQty: number;
};

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export default function RequestStockPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [requestItems, setRequestItems] = React.useState<ItemForRequest[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);

  // --- Data Fetching ---
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const dispensaryStockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null, [firestore]);
  const { data: dispensaryStocks, isLoading: isLoadingDispensaryStock } = useCollection<Stock>(dispensaryStockQuery);

  const bulkStockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'bulk-store')) : null, [firestore]);
  const { data: bulkStocks, isLoading: isLoadingBulkStock } = useCollection<Stock>(bulkStockQuery);


  const isLoading = isLoadingItems || isLoadingDispensaryStock || isLoadingBulkStock;

  const getBulkStockForItem = React.useCallback((itemId: string): number => {
    if (!bulkStocks) return 0;
    return bulkStocks
        .filter(s => s.itemId === itemId)
        .reduce((sum, s) => sum + s.currentStockQuantity, 0);
  }, [bulkStocks]);


  const handleAutoRequest = () => {
    if (!allItems || !dispensaryStocks) {
        toast({ title: "Data still loading...", description: "Please wait a moment and try again." });
        return;
    }

    const lowStockItems = allItems.filter(item => {
        const totalDispensaryStock = dispensaryStocks
            .filter(s => s.itemId === item.id)
            .reduce((sum, s) => sum + s.currentStockQuantity, 0);
        return totalDispensaryStock < item.dispensaryReorderLevel;
    }).map(item => ({ 
        id: item.id, 
        name: formatItemName(item),
        bulkStoreQty: getBulkStockForItem(item.id)
    }));

    if (lowStockItems.length === 0) {
        toast({ title: "No Low-Stock Items", description: "All items in the dispensary are currently above their reorder level." });
        return;
    }

    setRequestItems(lowStockItems);
    setIsFormVisible(true);
  };
  
  const handleManualAddItem = (item: Item) => {
    setRequestItems(prev => {
        if (prev.some(i => i.id === item.id)) {
            return prev;
        }
        return [...prev, { 
            id: item.id, 
            name: formatItemName(item),
            bulkStoreQty: getBulkStockForItem(item.id)
        }];
    });
    setIsFormVisible(true); // Show form as soon as one item is added
  }


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


  if (isFormVisible) {
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create Stock Request</CardTitle>
                <CardDescription>
                Specify the quantities you need from the bulk store for the selected items. You can add more items manually.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <RequestStockForm
                    selectedItems={requestItems}
                    onSubmit={handleRequestStock}
                    onCancel={() => {
                        setIsFormVisible(false);
                        setRequestItems([]);
                    }}
                    onAddItem={() => setIsManualAddOpen(true)}
                />
                 <ManuallyAddItemDialog
                    isOpen={isManualAddOpen}
                    onOpenChange={setIsManualAddOpen}
                    allItems={allItems || []}
                    onItemSelected={handleManualAddItem}
                    isLoading={isLoading}
                />
            </CardContent>
        </Card>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
        <header>
            <h1 className="text-3xl font-bold tracking-tight">Request New Stock</h1>
            <p className="text-muted-foreground mt-2">
                Choose a method to build your stock request list.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <AlertTriangle className="h-8 w-8 text-primary mb-2"/>
                    <CardTitle>Automatic Mode</CardTitle>
                    <CardDescription>
                        Generate a request for all items in the dispensary that have fallen below their specified reorder level.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAutoRequest} disabled={isLoading} className="w-full">
                        {isLoading ? 'Loading stock data...' : 'Request Low-Stock Items'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <ListPlus className="h-8 w-8 text-primary mb-2"/>
                    <CardTitle>Manual Mode</CardTitle>
                    <CardDescription>
                        Manually search and select any item from the master list to add to your stock request.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsManualAddOpen(true)} disabled={isLoading} variant="outline" className="w-full">
                        {isLoading ? 'Loading master list...' : 'Manually Select Items'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        
         <ManuallyAddItemDialog
            isOpen={isManualAddOpen}
            onOpenChange={setIsManualAddOpen}
            allItems={allItems || []}
            onItemSelected={handleManualAddItem}
            isLoading={isLoading}
        />
    </div>
  );
}

    