
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
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart, History } from 'lucide-react';

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
        <StatCard
          title="Total Items"
          value={totalUniqueItems}
          icon={Package}
          description="Unique items in bulk store"
          isLoading={isLoading}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItemsCount}
          icon={AlertTriangle}
          description="Items below reorder level"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Orders"
          value={`+${pendingOrdersCount}`}
          icon={Truck}
          description="Internal orders from dispensary"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <EmptyState
              icon={BarChart}
              title="Inventory Overview Chart"
              description="A chart showing inventory value or stock levels will be here."
            />
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
            <EmptyState
              icon={History}
              title="No Recent Transfers"
              description="A list of recent transfers will be shown here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
