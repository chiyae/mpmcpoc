
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
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, History } from 'lucide-react';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatItemName } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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
  const { data: pendingOrdersData, isLoading: isLoadingOrders } = useCollection<InternalOrder>(pendingOrdersData);

  const recentTransfersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'internalOrders'), where('status', '==', 'Issued'), orderBy('date', 'desc'), limit(5)) : null,
    [firestore]
  );
  const { data: recentTransfers, isLoading: isLoadingTransfers } = useCollection<InternalOrder>(recentTransfersQuery);


  // --- Calculations ---
  const { totalUniqueItems, lowStockItemsCount, topStockedItems } = React.useMemo(() => {
    if (!bulkStocks || !allItems) return { totalUniqueItems: 0, lowStockItemsCount: 0, topStockedItems: [] };
    
    const itemStockMap = new Map<string, number>();

    bulkStocks.forEach(stock => {
      itemStockMap.set(stock.itemId, (itemStockMap.get(stock.itemId) || 0) + stock.currentStockQuantity);
    });

    const lowStockCount = allItems.reduce((count, item) => {
        const currentStock = itemStockMap.get(item.id) || 0;
        if (currentStock < item.bulkStoreReorderLevel) {
            return count + 1;
        }
        return count;
    }, 0);

    const sortedStock = Array.from(itemStockMap.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5);
    
    const topItems = sortedStock.map(([itemId, quantity]) => {
        const itemInfo = allItems.find(i => i.id === itemId);
        return {
            name: itemInfo?.genericName || itemId,
            quantity: quantity
        }
    });

    return { totalUniqueItems: itemStockMap.size, lowStockItemsCount: lowStockCount, topStockedItems: topItems };
  }, [bulkStocks, allItems]);

  const pendingOrdersCount = pendingOrdersData?.length || 0;
  const isLoading = isLoadingStock || isLoadingItems || isLoadingOrders || isLoadingTransfers;

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
            <CardTitle>Top 5 Stocked Items</CardTitle>
            <CardDescription>Overview of the most abundant items in the bulk store.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
           {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topStockedItems} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)"
                        }}
                        formatter={(value) => [value, "Quantity"]}
                    />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>
              Most recent stock issued to the dispensary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                    {recentTransfers?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent transfers.</p>}
                    {recentTransfers?.map(order => (
                        <div key={order.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-mono text-sm">{order.id}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(order.date), 'dd/MM/yyyy, p')}</p>
                            </div>
                            <Badge variant="default" className="capitalize">{order.items.length} items</Badge>
                        </div>
                    ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
