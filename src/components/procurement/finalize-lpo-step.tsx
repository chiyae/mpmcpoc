'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Item, Vendor, LocalPurchaseOrderItem } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useSettings } from '@/context/settings-provider';
import { Skeleton } from '../ui/skeleton';

interface FinalizeLpoStepProps {
  procurementList: Item[];
  vendorQuotes: Record<string, Record<string, number>>;
  onBack: () => void;
  onReset: () => void;
}

interface DraftLpo {
  vendorId: string;
  vendorName: string;
  items: (LocalPurchaseOrderItem & { itemName: string })[];
  grandTotal: number;
}

function formatItemName(item: Item) {
  let name = item.genericName;
  if (item.brandName) name += ` (${item.brandName})`;
  if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
  return name;
}

export function FinalizeLpoStep({ procurementList, vendorQuotes, onBack, onReset }: FinalizeLpoStepProps) {
  const firestore = useFirestore();
  const { formatCurrency } = useSettings();

  const vendorsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
  const { data: allVendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);

  const draftLpos = React.useMemo(() => {
    if (areVendorsLoading || !allVendors) return [];

    const lpoGroups: Record<string, DraftLpo> = {};

    procurementList.forEach(item => {
      const quotesForItem = vendorQuotes[item.id];
      if (!quotesForItem) return;

      let bestVendorId: string | null = null;
      let bestPrice = Infinity;

      Object.entries(quotesForItem).forEach(([vendorId, price]) => {
        if (price >= 0 && price < bestPrice) {
          bestPrice = price;
          bestVendorId = vendorId;
        }
      });
      
      if (bestVendorId) {
        if (!lpoGroups[bestVendorId]) {
          const vendor = allVendors.find(v => v.id === bestVendorId);
          lpoGroups[bestVendorId] = {
            vendorId: bestVendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            items: [],
            grandTotal: 0,
          };
        }
        
        // For now, quantity is hardcoded to 1. This will be editable later.
        const quantity = 1; 
        const total = quantity * bestPrice;

        lpoGroups[bestVendorId].items.push({
          itemId: item.id,
          itemName: formatItemName(item),
          quantity,
          unitPrice: bestPrice,
          total,
        });

        lpoGroups[bestVendorId].grandTotal += total;
      }
    });

    return Object.values(lpoGroups);

  }, [procurementList, vendorQuotes, allVendors, areVendorsLoading]);


  if (areVendorsLoading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Review and Finalize LPOs</CardTitle>
        <CardDescription>
          Based on the best prices, the following draft Local Purchase Orders (LPOs) will be generated.
          Review the items for each vendor and finalize the procurement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {draftLpos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
                <p>No valid prices were entered. Please go back and provide quotes to generate LPOs.</p>
            </div>
        ) : (
            <Accordion type="multiple" defaultValue={draftLpos.map(lpo => lpo.vendorId)}>
            {draftLpos.map(lpo => (
                <AccordionItem value={lpo.vendorId} key={lpo.vendorId}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span className="font-semibold text-lg">{lpo.vendorName}</span>
                            <div className='flex flex-col items-end'>
                                <span className="text-muted-foreground text-sm">Total</span>
                                <span className='text-xl font-bold text-primary'>{formatCurrency(lpo.grandTotal)}</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lpo.items.map(item => (
                                <TableRow key={item.itemId}>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                       </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
        )}
      </CardContent>
      <div className="mt-6 p-6 pt-0 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className='flex gap-2'>
            <Button onClick={onReset} variant="secondary">Start New Procurement</Button>
            <Button disabled={draftLpos.length === 0}>
                Confirm & Generate {draftLpos.length} LPO(s)
            </Button>
        </div>
      </div>
    </Card>
  );
}
