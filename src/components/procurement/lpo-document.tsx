
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
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
import { Printer } from 'lucide-react';
import Logo from '../logo';

interface LpoDocumentProps {
  lpo: LocalPurchaseOrder;
}

export function LpoDocument({ lpo }: LpoDocumentProps) {
  const { settings, formatCurrency } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background rounded-lg shadow-lg p-8 max-w-4xl mx-auto printable-area">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 1.5rem;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          {settings?.clinicName ? (
            <>
              <h1 className="text-3xl font-bold text-primary">{settings.clinicName}</h1>
              <p className="text-sm text-muted-foreground">{settings.clinicAddress}</p>
              <p className="text-sm text-muted-foreground">{settings.clinicPhone}</p>
            </>
          ) : <Logo />}
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase tracking-wider text-muted-foreground">Purchase Order</h2>
          <p className="text-lg font-mono text-muted-foreground mt-2">{lpo.lpoNumber}</p>
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
        <div className="text-right">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-sm font-semibold text-muted-foreground">DATE</dt>
                <dd className="font-medium">{format(new Date(lpo.date), 'PPP')}</dd>
                <dt className="text-sm font-semibold text-muted-foreground">STATUS</dt>
                <dd>
                    <Badge variant={lpo.status === 'Completed' ? 'default' : lpo.status === 'Rejected' ? 'destructive' : 'secondary'} className="capitalize">{lpo.status}</Badge>
                </dd>
            </dl>
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

      {/* Print Button */}
      <div className="mt-8 text-center no-print">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print LPO
        </Button>
      </div>
    </div>
  );
}
