
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
import type { Stock, Bill } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
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
  
  const todaysBillsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return query(
            collection(firestore, 'billings'),
            where('dispensingLocationId', '==', 'dispensary'),
            where('date', '>=', today.toISOString()),
            where('date', '<', tomorrow.toISOString())
        )
    },
    [firestore]
  );
  const { data: todaysBills, isLoading: isLoadingBills } = useCollection<Bill>(todaysBillsQuery);

  // --- Calculations ---
  const { totalItems, nearExpiryItems, todaysSales } = React.useMemo(() => {
    const today = new Date();
    
    const stockStats = dispensaryStocks?.reduce((acc, stock) => {
        // Simple count of unique items (by itemId)
        acc.itemIds.add(stock.itemId);

        // Near Expiry Check
        if (stock.expiryDate) {
            const expiry = parseISO(stock.expiryDate);
            const daysToExpiry = differenceInDays(expiry, today);
            if (daysToExpiry >= 0 && daysToExpiry <= 30) {
                acc.nearExpiryCount++;
            }
        }
        return acc;
    }, { itemIds: new Set<string>(), nearExpiryCount: 0 });

    const sales = todaysBills?.reduce((sum, bill) => sum + bill.grandTotal, 0) || 0;

    return {
        totalItems: stockStats?.itemIds.size || 0,
        nearExpiryItems: stockStats?.nearExpiryCount || 0,
        todaysSales: sales
    }
  }, [dispensaryStocks, todaysBills]);

  const isLoading = isLoadingStock || isLoadingBills;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
