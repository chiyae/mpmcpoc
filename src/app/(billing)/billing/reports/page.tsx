
'use client';

import * as React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileWarning, CheckCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useSettings } from '@/context/settings-provider';

export default function FinancialReportsPage() {
  const { formatCurrency } = useSettings();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const handleGenerateReport = () => {
    // In a real app, you would fetch data based on the dateRange
    console.log('Generating report for:', dateRange);
  };
  
  // Mock data for display
  const totalRevenue = 18450.75;
  const paymentsReceived = 15230.50;
  const outstandingAmount = totalRevenue - paymentsReceived;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(paymentsReceived)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount on unpaid invoices.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Revenue chart for the selected period will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
