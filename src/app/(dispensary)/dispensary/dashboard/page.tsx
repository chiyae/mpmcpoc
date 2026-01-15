
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign } from "lucide-react";
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Stock, Bill, Item } from '@/lib/types';
import { differenceInDays, parseISO, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function DispensaryDashboard() {
  const { formatCurrency } = useSettings();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const dispensaryStockQuery = useMemoFirebase(
    () => firestore 
      ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) 
      : null,
    [firestore]
  );
  const { data: dispensaryStocks, isLoading: isLoadingStock } = useCollection<Stock>(dispensaryStockQuery);
  
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const dispensaryBillsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        // Fetch all bills for the dispensary and filter by date on the client
        return query(
            collection(firestore, 'billings'),
            where('dispensingLocationId', '==', 'dispensary')
        )
    },
    [firestore]
  );
  const { data: dispensaryBills, isLoading: isLoadingBills } = useCollection<Bill>(dispensaryBillsQuery);

  // --- Calculations ---
  const { totalItems, nearExpiryItems, lowStockItemsCount, todaysSales } = React.useMemo(() => {
    const today = new Date();
    
    if (!dispensaryStocks || !allItems) {
        return { totalItems: 0, nearExpiryItems: 0, lowStockItemsCount: 0, todaysSales: 0 };
    }

    const stockStats = dispensaryStocks.reduce((acc, stock) => {
        acc.itemIds.add(stock.itemId);

        if (stock.expiryDate) {
            const expiry = parseISO(stock.expiryDate);
            const daysToExpiry = differenceInDays(expiry, today);
            if (daysToExpiry >= 0 && daysToExpiry <= 30) {
                acc.nearExpiryCount++;
            }
        }
        return acc;
    }, { itemIds: new Set<string>(), nearExpiryCount: 0 });

    const lowStockCount = allItems.reduce((count, item) => {
        const stockForThisItem = dispensaryStocks.filter(s => s.itemId === item.id);
        const totalQuantity = stockForThisItem.reduce((sum, s) => sum + s.currentStockQuantity, 0);
        if (totalQuantity < item.reorderLevel) {
            return count + 1;
        }
        return count;
    }, 0);

    const sales = dispensaryBills
        ?.filter(bill => isToday(parseISO(bill.date)))
        .reduce((sum, bill) => sum + bill.grandTotal, 0) || 0;

    return {
        totalItems: stockStats.itemIds.size,
        nearExpiryItems: stockStats.nearExpiryCount,
        lowStockItemsCount: lowStockCount,
        todaysSales: sales
    }
  }, [dispensaryStocks, allItems, dispensaryBills]);

  const isLoading = isLoadingStock || isLoadingBills || isLoadingItems;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items on Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-1/2' /> : <div className="text-2xl font-bold">{totalItems}</div>}
            <p className="text-xs text-muted-foreground">
              Unique items in dispensary
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className='h-8 w-1/2' /> : <div className="text-2xl font-bold">{lowStockItemsCount}</div>}
            <p className="text-xs text-muted-foreground">
              Items below their reorder level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiry Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className='h-8 w-1/2' /> : <div className="text-2xl font-bold">{nearExpiryItems}</div>}
            <p className="text-xs text-muted-foreground">
              Items expiring within 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-1/2' /> : <div className="text-2xl font-bold">{formatCurrency(todaysSales)}</div>}
            <p className="text-xs text-muted-foreground">
              Total revenue from dispensed items today
            </p>
          </CardContent>
        </Card>
      </div>

       {/* Placeholder for more dashboard components */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <p>Sales chart will be here.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recently Dispensed</CardTitle>
            <CardDescription>
              Items recently billed to patients.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p>A list of recent billings will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
