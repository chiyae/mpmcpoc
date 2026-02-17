
'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { isThisMonth, parseISO, subMonths, format, startOfMonth, isAfter } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Button } from '@/components/ui/button';


export default function BillingDashboard() {
  const { formatCurrency } = useSettings();
  const firestore = useFirestore();

  const billsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'billings') : null),
    [firestore]
  );
  const { data: bills, isLoading: isLoadingBills } = useCollection<Bill>(billsCollectionQuery);

  const { totalRevenue, outstandingInvoices, averageBillValue, totalPatients, recentPayments, monthlyRevenueData } = React.useMemo(() => {
    if (!bills) {
      return {
        totalRevenue: 0,
        outstandingInvoices: 0,
        averageBillValue: 0,
        totalPatients: 0,
        recentPayments: [],
        monthlyRevenueData: [],
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

    // Prepare data for the last 6 months
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const monthlyRevenue = bills
        .filter(bill => isAfter(parseISO(bill.date), sixMonthsAgo))
        .reduce((acc, bill) => {
            const month = format(parseISO(bill.date), 'MMM yyyy');
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += bill.grandTotal;
            return acc;
        }, {} as Record<string, number>);

    const monthlyRevenueData = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthName = format(date, 'MMM yyyy');
        return {
            name: format(date, 'MMM'),
            total: monthlyRevenue[monthName] || 0,
        };
    }).reverse();


    return { totalRevenue, outstandingInvoices, averageBillValue, totalPatients, recentPayments, monthlyRevenueData };

  }, [bills]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl">Patient Billing</CardTitle>
                    <CardDescription>
                        Create new bills and invoices for patients. This is the primary function of the billing module.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                    <Link href="/billing/patient-billing">
                        <Button size="lg">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Create New Bill
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <Link href="/billing/reports">
                <StatCard
                    title="Total Revenue (Month)"
                    value={formatCurrency(totalRevenue)}
                    icon={DollarSign}
                    description="+10.2% from last month (mock)"
                    isLoading={isLoadingBills}
                    className="hover:bg-accent transition-colors"
                />
            </Link>
            <Link href="/billing/invoices">
                <StatCard
                    title="Outstanding Invoices"
                    value={outstandingInvoices}
                    icon={FileText}
                    description="Awaiting payment"
                    isLoading={isLoadingBills}
                    className="hover:bg-accent transition-colors"
                />
            </Link>
            <Link href="/billing/invoices">
                <StatCard
                    title="Average Bill Value"
                    value={formatCurrency(averageBillValue)}
                    icon={TrendingUp}
                    description="Across all patients"
                    isLoading={isLoadingBills}
                    className="hover:bg-accent transition-colors"
                />
            </Link>
            <StatCard
                title="Total Patients"
                value={totalPatients}
                icon={User}
                description="Unique patients this month"
                isLoading={isLoadingBills}
            />
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Revenue from the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingBills ? (
                <Skeleton className="h-[350px] w-full" />
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyRevenueData}>
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
                        formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
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
