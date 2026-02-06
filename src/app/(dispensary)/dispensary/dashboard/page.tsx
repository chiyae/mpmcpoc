
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, Pill } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Stock, Bill, Item } from '@/lib/types';
import { differenceInDays, parseISO, subDays, isWithinInterval, format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// A simple helper to differentiate services from items based on ID format.
// This assumes service IDs are non-numeric strings (e.g., 'CONSULTATION-FEE')
// and item IDs are codes (e.g., 'PAR500').
const isService = (itemId: string) => isNaN(parseInt(itemId.substring(itemId.length - 4)));

export default function DispensaryDashboard() {
  const firestore = useFirestore();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

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

  const pendingBillsQuery = useMemoFirebase(
    () => firestore 
      ? query(collection(firestore, 'billings'), where('paymentDetails.status', '==', 'Paid'), where('isDispensed', '==', false))
      : null,
    [firestore]
  );
  const { data: pendingDispensations, isLoading: isLoadingPending } = useCollection<Bill>(pendingBillsQuery);
  
  const pendingDispensationsCount = pendingDispensations?.length || 0;


  // --- Calculations ---
  const { 
    totalItems, 
    nearExpiryItems, 
    lowStockItemsCount,
    recentlyDispensedItems,
    topDispensedItems
  } = React.useMemo(() => {
    const today = new Date();
    
    if (!dispensaryStocks || !allItems || !dispensaryBills) {
        return { totalItems: 0, nearExpiryItems: 0, lowStockItemsCount: 0, recentlyDispensedItems: [], topDispensedItems: [] };
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
        
    // Dispensed items for the selected date range
    const dispensedBills = dispensaryBills.filter(bill => bill.isDispensed);
    
    const filteredBillsByDate = dateRange?.from ? dispensedBills.filter(bill => {
        try {
            const billDate = parseISO(bill.date);
            return isWithinInterval(billDate, { start: dateRange.from!, end: dateRange.to || new Date() });
        } catch(e) {
            return false;
        }
    }) : dispensedBills;

    const recentlyDispensed = filteredBillsByDate
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .flatMap(bill => bill.items.map(item => ({...item, billId: bill.id, date: bill.date })));
    
    // Top 5 dispensed items by instance count
     const dispensedCounts = dispensaryBills
      .flatMap(bill => bill.items)
      .reduce((acc, item) => {
          if (isService(item.itemId)) return acc;
          acc[item.itemName] = (acc[item.itemName] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
    const topDispensed = Object.entries(dispensedCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0,5)
        .map(([name, count]) => ({ name, count }));


    return {
        totalItems: stockStats.itemIds.size,
        nearExpiryItems: stockStats.nearExpiryCount,
        lowStockItemsCount: lowStockCount,
        recentlyDispensedItems: recentlyDispensed,
        topDispensedItems: topDispensed
    }
  }, [dispensaryStocks, allItems, dispensaryBills, dateRange]);

  const isLoading = isLoadingStock || isLoadingBills || isLoadingItems || isLoadingPending;


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dispensary Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dispensary/dispense" className="col-span-1">
            <Card className="bg-primary/10 border-primary/50 hover:bg-primary/20 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dispensing Queue</CardTitle>
                    <Pill className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-10 w-16" /> : <div className="text-4xl font-bold">{pendingDispensationsCount}</div>}
                    <p className="text-xs text-muted-foreground">bills awaiting collection</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/dispensary/inventory">
            <StatCard
            title="Items on Hand"
            value={totalItems}
            icon={Package}
            description="Unique items in dispensary"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
            />
        </Link>
        <Link href="/dispensary/inventory?filter=low-stock">
            <StatCard
            title="Low Stock Alerts"
            value={lowStockItemsCount}
            icon={AlertTriangle}
            description="Items below reorder level"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
            />
        </Link>
        <Link href="/dispensary/inventory?filter=near-expiry">
            <StatCard
            title="Near Expiry Alerts"
            value={nearExpiryItems}
            icon={AlertTriangle}
            description="Items expiring in 30 days"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
            />
        </Link>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Dispensed Items</CardTitle>
            <CardDescription>Most frequently dispensed items by number of transactions.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topDispensedItems} layout="vertical">
                    <XAxis type="number" stroke="#888888" fontSize={12} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={150}
                        />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)"
                        }}
                        formatter={(value) => [value, "Dispensing Frequency"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
           <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Dispensing History</CardTitle>
                    <CardDescription>
                        Items dispensed in the selected period.
                    </CardDescription>
                </div>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-[280px]">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                 ) : (
                    <div className="space-y-4 pr-4">
                        {recentlyDispensedItems.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No items were dispensed in this period.</p>}
                        {recentlyDispensedItems.map((item, index) => (
                            <div key={`${item.billId}-${item.itemId}-${index}`} className="flex items-center justify-between">
                                 <div>
                                    <p className="font-medium truncate pr-4">{item.itemName}</p>
                                    <p className="text-xs text-muted-foreground">{format(parseISO(item.date), 'PP')}</p>
                                </div>
                                <p className="text-right text-muted-foreground">Qty: <span className="font-bold text-foreground">{item.quantity}</span></p>
                            </div>
                        ))}
                    </div>
                 )}
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
