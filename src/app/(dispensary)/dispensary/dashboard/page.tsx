
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
import { dispensaryItems } from "@/lib/data";
import { differenceInDays, parseISO } from 'date-fns';
import { useSettings } from '@/context/settings-provider';

export default function DispensaryDashboard() {
  const { formatCurrency } = useSettings();
  const totalItems = dispensaryItems.length;
  const today = new Date();
  const nearExpiryItems = dispensaryItems.filter(item => {
    const expiryDate = parseISO(item.expiryDate);
    const daysToExpiry = differenceInDays(expiryDate, today);
    return daysToExpiry <= 30 && daysToExpiry >= 0;
  }).length;
  
  const todaysSales = 1250.75; // Mock data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items on Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
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
            <div className="text-2xl font-bold">{nearExpiryItems}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(todaysSales)}</div>
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
