
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, History, BarChart } from "lucide-react";
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Stock, Bill, Item } from '@/lib/types';
import { differenceInDays, parseISO, isToday } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';

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
        if (totalQuantity < item.dispensaryReorderLevel) {
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
        <StatCard
          title="Items on Hand"
          value={totalItems}
          icon={Package}
          description="Unique items in dispensary"
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
          title="Near Expiry Alerts"
          value={nearExpiryItems}
          icon={AlertTriangle}
          description="Items expiring in 30 days"
          isLoading={isLoading}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaysSales)}
          icon={DollarSign}
          description="Revenue from dispensed items"
          isLoading={isLoading}
        />
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <EmptyState
              icon={BarChart}
              title="Sales Chart"
              description="A chart showing sales trends will be implemented here."
            />
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
             <EmptyState
                icon={History}
                title="No Recent Activity"
                description="A list of recently dispensed items will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
