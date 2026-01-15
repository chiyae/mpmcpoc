
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, Truck } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Stock, Item, InternalOrder } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function BulkStoreDashboard() {
  const firestore = useFirestore();

  // --- Data Fetching ---
  const bulkStockQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'bulk-store')) : null,
    [firestore]
  );
  const { data: bulkStocks, isLoading: isLoadingStock } = useCollection<Stock>(bulkStockQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const pendingOrdersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'internalOrders'), where('status', '==', 'Pending')) : null,
    [firestore]
  );
  const { data: pendingOrdersData, isLoading: isLoadingOrders } = useCollection<InternalOrder>(pendingOrdersQuery);

  // --- Calculations ---
  const { totalUniqueItems, lowStockItemsCount } = React.useMemo(() => {
    if (!bulkStocks || !allItems) return { totalUniqueItems: 0, lowStockItemsCount: 0 };
    
    const itemIdsInStock = new Set(bulkStocks.map(stock => stock.itemId));

    const lowStockCount = allItems.reduce((count, item) => {
        const stockForThisItem = bulkStocks.filter(s => s.itemId === item.id);
        const totalQuantity = stockForThisItem.reduce((sum, s) => sum + s.currentStockQuantity, 0);

        if (totalQuantity < item.bulkStoreReorderLevel) {
            return count + 1;
        }
        return count;
    }, 0);

    return { totalUniqueItems: itemIdsInStock.size, lowStockItemsCount: lowStockCount };
  }, [bulkStocks, allItems]);

  const pendingOrdersCount = pendingOrdersData?.length || 0;
  const isLoading = isLoadingStock || isLoadingItems || isLoadingOrders;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalUniqueItems}</div>}
            <p className="text-xs text-muted-foreground">
              Unique items in bulk store
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{lowStockItemsCount}</div>}
            <p className="text-xs text-muted-foreground">
              Items below reorder level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">+{pendingOrdersCount}</div>}
            <p className="text-xs text-muted-foreground">
              Internal orders from dispensary
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for more dashboard components */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <p>Chart or recent activity will be here.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>
              Stock transferred to the dispensary.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p>A list of recent transfers will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    