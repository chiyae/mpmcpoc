
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Item, Vendor, LocalPurchaseOrderItem, LocalPurchaseOrder, LpoStatus } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useSettings } from '@/context/settings-provider';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

interface FinalizeLpoStepProps {
  procurementListIds: string[];
  vendorQuotes: Record<string, Record<string, number>>;
  initialQuantities: Record<string, number>;
  onQuantitiesChange: (quantities: Record<string, number>) => void;
  onBack: () => void;
  onReset: () => void;
}

interface DraftLpo {
  vendorId: string;
  vendorName: string;
  items: (LocalPurchaseOrderItem)[];
  grandTotal: number;
}

function formatItemName(item: Item) {
  let name = item.genericName;
  if (item.brandName) name += ` (${item.brandName})`;
  if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
  return name;
}

export function FinalizeLpoStep({ 
    procurementListIds, 
    vendorQuotes, 
    initialQuantities,
    onQuantitiesChange,
    onBack, 
    onReset 
}: FinalizeLpoStepProps) {
  const firestore = useFirestore();
  const { formatCurrency } = useSettings();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [quantities, setQuantities] = React.useState(initialQuantities);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  
  React.useEffect(() => {
    // Debounce the onQuantitiesChange callback
    const handler = setTimeout(() => {
        onQuantitiesChange(quantities);
    }, 500); // 500ms debounce delay

    return () => {
        clearTimeout(handler);
    };
  }, [quantities, onQuantitiesChange]);

  const vendorsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
  const { data: allVendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);
  
  const itemsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'items') : null), [firestore]);
  const { data: allItems, isLoading: areItemsLoading } = useCollection<Item>(itemsCollectionQuery);

  const procurementList = React.useMemo(() => {
    if (!allItems) return [];
    return procurementListIds.map(id => allItems.find(item => item.id === id)).filter((item): item is Item => !!item);
  }, [allItems, procurementListIds]);

  const handleQuantityChange = (itemId: string, newQuantity: string) => {
    const qty = parseInt(newQuantity, 10);
    setQuantities(prev => ({
        ...prev,
        [itemId]: isNaN(qty) ? 0 : qty
    }));
  }

  const draftLpos = React.useMemo(() => {
    if (areVendorsLoading || !allVendors || areItemsLoading) return [];

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
        
        const quantity = quantities[item.id] || 1; 
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

  }, [procurementList, vendorQuotes, allVendors, areVendorsLoading, areItemsLoading, quantities]);

  const handleFinalizeLpos = async () => {
    if (!firestore || !sessionId || draftLpos.length === 0) return;
    setIsFinalizing(true);
    
    const batch = writeBatch(firestore);

    // 1. Create LPO documents
    draftLpos.forEach((draftLpo) => {
        const lpoId = `LPO-${String(Date.now()).slice(-6)}`;
        const lpoRef = doc(firestore, 'localPurchaseOrders', lpoId);
        
        const newLpo: LocalPurchaseOrder = {
            id: lpoId,
            lpoNumber: lpoId,
            vendorId: draftLpo.vendorId,
            vendorName: draftLpo.vendorName,
            date: new Date().toISOString(),
            items: draftLpo.items,
            grandTotal: draftLpo.grandTotal,
            status: 'Draft' as LpoStatus,
        };
        batch.set(lpoRef, newLpo);
    });

    // 2. Update the procurement session status
    const sessionRef = doc(firestore, 'procurementSessions', sessionId);
    batch.update(sessionRef, { status: 'Completed' });

    try {
        await batch.commit();
        toast({
            title: "LPOs Generated Successfully",
            description: `${draftLpos.length} LPO(s) have been created and saved.`
        });
        onReset(); // Navigate back to sessions page
    } catch (error) {
        console.error("Failed to finalize LPOs:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "An error occurred while trying to save the LPOs."
        });
    } finally {
        setIsFinalizing(false);
    }
  }


  const isLoading = areVendorsLoading || areItemsLoading;

  if (isLoading) {
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
          Adjust quantities as needed before confirming.
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
                                <TableHead className="w-28 text-center">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lpo.items.map(item => (
                                <TableRow key={item.itemId}>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={quantities[item.itemId] || '1'}
                                            onChange={(e) => handleQuantityChange(item.itemId, e.target.value)}
                                            min="1"
                                        />
                                    </TableCell>
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
        <Button variant="outline" onClick={onBack} disabled={isFinalizing}>
          Back
        </Button>
        <div className='flex gap-2'>
            <Button onClick={onReset} variant="secondary" disabled={isFinalizing}>Start New Procurement</Button>
            <Button disabled={draftLpos.length === 0 || isFinalizing} onClick={handleFinalizeLpos}>
                {isFinalizing ? 'Generating...' : `Confirm & Generate ${draftLpos.length} LPO(s)`}
            </Button>
        </div>
      </div>
    </Card>
  );
}
