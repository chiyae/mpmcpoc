
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
import type { Stock, Bill, Item, BillItem } from '@/lib/types';
import { differenceInDays, parseISO, isToday, format, subDays, startOfDay, endOfDay } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatItemName } from '@/lib/utils';


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
    () => firestore ? query(collection(firestore, 'billings'), where('dispensingLocationId', '==', 'dispensary')) : null,
    [firestore]
  );
  const { data: dispensaryBills, isLoading: isLoadingBills } = useCollection<Bill>(dispensaryBillsQuery);

  // --- Calculations ---
  const { 
    totalItems, 
    nearExpiryItems, 
    lowStockItemsCount, 
    todaysSales,
    weeklySalesData,
    recentlyDispensedItems
  } = React.useMemo(() => {
    const today = new Date();
    
    if (!dispensaryStocks || !allItems || !dispensaryBills) {
        return { totalItems: 0, nearExpiryItems: 0, lowStockItemsCount: 0, todaysSales: 0, weeklySalesData: [], recentlyDispensedItems: [] };
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
        
    // Last 7 days sales data
    const weeklySales = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), i);
        const dailyTotal = dispensaryBills
            .filter(bill => isToday(parseISO(bill.date)))
            .reduce((sum, bill) => sum + bill.grandTotal, 0);
        return {
            name: format(date, 'eee'),
            total: dailyTotal
        }
    }).reverse();

    // Recently dispensed items
    const recentlyDispensed = dispensaryBills
      .filter(bill => bill.isDispensed)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .flatMap(bill => bill.items.map(item => ({...item, billId: bill.id})));


    return {
        totalItems: stockStats.itemIds.size,
        nearExpiryItems: stockStats.nearExpiryCount,
        lowStockItemsCount: lowStockCount,
        todaysSales: sales,
        weeklySalesData: weeklySales,
        recentlyDispensedItems: recentlyDispensed
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
            <CardTitle>Weekly Sales Overview</CardTitle>
            <CardDescription>Sales figures for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={weeklySalesData}>
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${formatCurrency(value)}`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)"
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), "Sales"]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recently Dispensed</CardTitle>
            <CardDescription>
              Items from the most recently completed dispensations.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             ) : (
                <div className="space-y-4">
                    {recentlyDispensedItems.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No items have been dispensed recently.</p>}
                    {recentlyDispensedItems.map((item, index) => (
                        <div key={`${item.billId}-${item.itemId}-${index}`} className="flex items-center justify-between">
                            <p className="font-medium truncate pr-4">{item.itemName}</p>
                            <p className="text-right text-muted-foreground">Qty: <span className="font-bold text-foreground">{item.quantity}</span></p>
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
