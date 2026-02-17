
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Bill, ClinicSettings } from '@/lib/types';
import { format } from 'date-fns';
import Logo from './logo';
import { useSettings } from '@/context/settings-provider';

interface ReceiptProps {
  bill: Bill | null;
  settings: ClinicSettings | null;
}

export function Receipt({ bill, settings }: ReceiptProps) {
  const { formatCurrency } = useSettings();
  if (!bill || !settings) return null;

  return (
    <div className="p-6 bg-white text-black text-sm">
      <div className="text-center space-y-1 mb-6">
        <div className="flex justify-center">
            <Logo />
        </div>
        <p>{settings.clinicAddress}</p>
        <p>Tel: {settings.clinicPhone}</p>
      </div>
      <div className="flex justify-between border-y border-dashed py-2 mb-4">
        <div>
          <p><strong>Receipt #:</strong> {bill.receiptNumber}</p>
          <p><strong>Date:</strong> {format(new Date(bill.date), 'dd/MM/yyyy, hh:mm a')}</p>
        </div>
        <div>
          <p><strong>Patient:</strong> {bill.patientName}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-black">Item</TableHead>
            <TableHead className="text-black text-center">Qty</TableHead>
            <TableHead className="text-black text-right">Price</TableHead>
            <TableHead className="text-black text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bill.items.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell className="text-black">{item.itemName}</TableCell>
              <TableCell className="text-black text-center">{item.quantity}</TableCell>
              <TableCell className="text-black text-right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell className="text-black text-right">{formatCurrency(item.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-black text-right font-bold">Subtotal</TableCell>
            <TableCell className="text-black text-right font-bold">{formatCurrency(bill.subtotal)}</TableCell>
          </TableRow>
          {bill.discount && bill.discount > 0 ? (
             <TableRow>
                <TableCell colSpan={3} className="text-black text-right font-bold">Discount</TableCell>
                <TableCell className="text-black text-right font-bold">-{formatCurrency(bill.discount)}</TableCell>
            </TableRow>
          ) : null}
          <TableRow className="text-base">
            <TableCell colSpan={3} className="text-black text-right font-extrabold">Grand Total</TableCell>
            <TableCell className="text-black text-right font-extrabold">{formatCurrency(bill.grandTotal)}</TableCell>
          </TableRow>
           <TableRow>
            <TableCell colSpan={3} className="text-black text-right">Amount Tendered</TableCell>
            <TableCell className="text-black text-right">{formatCurrency(bill.paymentDetails.amountTendered)}</TableCell>
          </TableRow>
           <TableRow>
            <TableCell colSpan={3} className="text-black text-right">Change</TableCell>
            <TableCell className="text-black text-right">{formatCurrency(bill.paymentDetails.change)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="text-center text-xs mt-6">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}
