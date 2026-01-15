
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, FileText, TrendingUp, User } from "lucide-react";
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Bill } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { isThisMonth, parseISO } from 'date-fns';

export default function BillingDashboard() {
  const { formatCurrency } = useSettings();
  const firestore = useFirestore();

  const billsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'billings') : null),
    [firestore]
  );
  const { data: bills, isLoading: isLoadingBills } = useCollection<Bill>(billsCollectionQuery);

  const { totalRevenue, outstandingInvoices, averageBillValue, totalPatients, recentPayments } = React.useMemo(() => {
    if (!bills) {
      return {
        totalRevenue: 0,
        outstandingInvoices: 0,
        averageBillValue: 0,
        totalPatients: 0,
        recentPayments: [],
      };
    }
    
    const monthlyBills = bills.filter(bill => isThisMonth(parseISO(bill.date)));

    const totalRevenue = monthlyBills.reduce((acc, bill) => acc + bill.grandTotal, 0);
    const outstandingInvoices = bills.filter(bill => bill.paymentDetails.status === 'Unpaid').length;
    const averageBillValue = bills.length > 0 ? bills.reduce((acc, bill) => acc + bill.grandTotal, 0) / bills.length : 0;
    const totalPatients = new Set(bills.map(bill => bill.patientName)).size;
    
    const recentPayments = bills
        .filter(bill => bill.paymentDetails.status === 'Paid')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);


    return { totalRevenue, outstandingInvoices, averageBillValue, totalPatients, recentPayments };

  }, [bills]);


  const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
            title="Total Revenue (Month)"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            description="+10.2% from last month (mock)"
            isLoading={isLoadingBills}
        />
        <StatCard
            title="Outstanding Invoices"
            value={outstandingInvoices}
            icon={FileText}
            description="Awaiting payment"
            isLoading={isLoadingBills}
        />
        <StatCard
            title="Average Bill Value"
            value={formatCurrency(averageBillValue)}
            icon={TrendingUp}
            description="Across all patients"
            isLoading={isLoadingBills}
        />
         <StatCard
            title="Total Patients"
            value={totalPatients}
            icon={User}
            description="Unique patients this month"
            isLoading={isLoadingBills}
        />
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <p>Revenue chart will be here.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Recently settled patient bills.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {isLoadingBills ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                    {recentPayments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent payments.</p>}
                    {recentPayments.map(bill => (
                        <div key={bill.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{bill.patientName}</p>
                                <p className="text-sm text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                            </div>
                            <div className="font-bold text-right">{formatCurrency(bill.grandTotal)}</div>
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
