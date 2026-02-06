
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, FileWarning, CheckCircle, ArrowLeft } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subDays, isWithinInterval } from 'date-fns';
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Bill } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function FinancialReportsPage() {
  const router = useRouter();
  const { formatCurrency } = useSettings();
  const firestore = useFirestore();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const billsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'billings') : null),
    [firestore]
  );
  const { data: allBills, isLoading: areBillsLoading } = useCollection<Bill>(billsCollectionQuery);

  const filteredBills = React.useMemo(() => {
    if (!allBills || !dateRange?.from || !dateRange?.to) {
        return [];
    }
    return allBills.filter(bill => isWithinInterval(new Date(bill.date), { start: dateRange.from!, end: dateRange.to! }));
  }, [allBills, dateRange]);


  const { totalRevenue, paymentsReceived, outstandingAmount } = React.useMemo(() => {
    if (!filteredBills) return { totalRevenue: 0, paymentsReceived: 0, outstandingAmount: 0 };
    
    const revenue = filteredBills.reduce((acc, bill) => acc + bill.grandTotal, 0);
    const received = filteredBills
        .filter(bill => bill.paymentDetails.status === 'Paid')
        .reduce((acc, bill) => acc + bill.grandTotal, 0);

    return {
        totalRevenue: revenue,
        paymentsReceived: received,
        outstandingAmount: revenue - received
    }
  }, [filteredBills]);

  const isLoading = areBillsLoading;

  return (
    <div className="space-y-6">
        <header className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Generate and review financial summaries for selected periods.</p>
                </div>
            </div>
        </header>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
           <CardDescription>
            Select a date range to generate a financial summary for that period.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>}
            <p className="text-xs text-muted-foreground">
              Total value of all bills in selected period.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(paymentsReceived)}</div>}
            <p className="text-xs text-muted-foreground">
              Total cash and digital payments received.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <FileWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</div>}
            <p className="text-xs text-muted-foreground">
              Total amount on unpaid invoices.
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
          <CardDescription>A list of all bills within the selected date range.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!isLoading && filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No bills found in this date range.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-mono">{bill.id}</TableCell>
                  <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{bill.patientName}</TableCell>
                  <TableCell>
                    <Badge variant={bill.paymentDetails.status === 'Paid' ? 'default' : 'destructive'}>
                        {bill.paymentDetails.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(bill.grandTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
