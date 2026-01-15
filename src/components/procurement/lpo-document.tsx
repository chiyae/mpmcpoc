
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { LocalPurchaseOrder } from '@/lib/types';
import { format } from 'date-fns';
import { useSettings } from '@/context/settings-provider';

interface LpoDocumentProps {
  lpo: LocalPurchaseOrder;
}

export function LpoDocument({ lpo }: LpoDocumentProps) {
  const { settings, formatCurrency } = useSettings();

  return (
    <div className="bg-background rounded-lg shadow-lg p-8 max-w-4xl mx-auto printable-area">
      {/* Header */}
      <header className="flex justify-between items-start mb-8 pb-4 border-b">
        <div>
            <h1 className="text-2xl font-bold text-primary">{settings?.clinicName || 'Your Clinic Name'}</h1>
            <p className="text-sm text-muted-foreground">{settings?.clinicAddress}</p>
            <p className="text-sm text-muted-foreground">
            Tel: {settings?.clinicPhone} | Email: info@mpingu.med
            </p>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-bold uppercase tracking-wider text-muted-foreground">LPO</h2>
           <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p><span className="font-semibold">LPO #:</span> {lpo.lpoNumber}</p>
                <p><span className="font-semibold">Date:</span> {format(new Date(lpo.date), 'dd/MM/yyyy')}</p>
                 <p>
                    <span className="font-semibold">Status:</span>
                    <Badge 
                        variant={lpo.status === 'Completed' ? 'default' : lpo.status === 'Rejected' ? 'destructive' : 'secondary'} 
                        className="capitalize ml-2"
                    >
                        {lpo.status}
                    </Badge>
                </p>
           </div>
        </div>
      </header>

      {/* LPO Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">VENDOR</h3>
          <div className="mt-2 p-4 border rounded-md bg-muted/50">
            <p className="font-bold text-lg">{lpo.vendorName}</p>
          </div>
        </div>
      </div>
      
      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-1/2">ITEM DESCRIPTION</TableHead>
              <TableHead className="text-center">QTY</TableHead>
              <TableHead className="text-right">UNIT PRICE</TableHead>
              <TableHead className="text-right">TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lpo.items.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Grand Total */}
      <div className="flex justify-end mt-4">
        <div className="w-full max-w-xs p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-baseline">
                <p className="text-lg font-semibold text-muted-foreground">Grand Total</p>
                <p className="text-2xl font-bold">{formatCurrency(lpo.grandTotal)}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
