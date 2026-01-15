
'use client';

import * as React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { subDays, isWithinInterval } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Bill, BillItem } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DispensaryReportsPage() {
  const firestore = useFirestore();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const billsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'billings'), where('dispensingLocationId', '==', 'dispensary')) : null,
    [firestore]
  );
  const { data: allBills, isLoading } = useCollection<Bill>(billsQuery);

  const itemMovementReport = React.useMemo(() => {
    if (!allBills || !dateRange?.from || !dateRange?.to) {
        return [];
    }
    
    const filteredBills = allBills.filter(bill => isWithinInterval(new Date(bill.date), { start: dateRange.from!, end: dateRange.to! }));

    const itemCounts = filteredBills.reduce((acc, bill) => {
        bill.items.forEach(item => {
            if (acc[item.itemId]) {
                acc[item.itemId].quantity += item.quantity;
            } else {
                acc[item.itemId] = {
                    itemName: item.itemName,
                    quantity: item.quantity
                }
            }
        });
        return acc;
    }, {} as Record<string, { itemName: string, quantity: number }>);

    return Object.entries(itemCounts)
        .map(([itemId, data]) => ({ ...data, itemId }))
        .sort((a,b) => b.quantity - a.quantity);
    
  }, [allBills, dateRange]);


  return (
    <div className="space-y-6">
       <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Dispensary Reports</h1>
            <p className="text-muted-foreground">
                Analyze item movement and sales from the dispensary.
            </p>
        </header>

      <Card>
        <CardHeader>
          <CardTitle>Item Dispensing Report</CardTitle>
          <CardDescription>
            A summary of the total quantity of each item dispensed within the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-3/4">Item Name</TableHead>
                    <TableHead className="text-right">Total Quantity Dispensed</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={2}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
                ))}
                {!isLoading && itemMovementReport.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        No items dispensed in this period.
                    </TableCell>
                    </TableRow>
                ) : (
                    itemMovementReport.map((item) => (
                        <TableRow key={item.itemId}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
