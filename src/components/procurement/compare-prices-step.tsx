
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Item, Vendor } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { useSettings } from '@/context/settings-provider';
import { formatItemName } from '@/lib/utils';

interface ComparePricesStepProps {
  procurementListIds: string[];
  initialQuotes: Record<string, Record<string, number>>;
  onComplete: (vendorQuotes: Record<string, Record<string, number>>) => void;
  onBack: () => void;
}

export function ComparePricesStep({ procurementListIds, initialQuotes, onComplete, onBack }: ComparePricesStepProps) {
    const firestore = useFirestore();
    const { currency } = useSettings();

    const [vendorQuotes, setVendorQuotes] = React.useState(initialQuotes);

    const vendorsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
    const { data: allVendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);
    
    const itemsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'items') : null), [firestore]);
    const { data: allItems, isLoading: areItemsLoading } = useCollection<Item>(itemsCollectionQuery);

    const procurementList = React.useMemo(() => {
        if (!allItems) return [];
        return procurementListIds.map(id => allItems.find(item => item.id === id)).filter((item): item is Item => !!item);
    }, [allItems, procurementListIds]);

    const handlePriceChange = (itemId: string, vendorId: string, price: string) => {
        const priceValue = parseFloat(price);
        setVendorQuotes(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [vendorId]: isNaN(priceValue) ? -1 : priceValue
            }
        }));
    };

    const getBestPriceForItem = (itemId: string): number | null => {
        const quotesForItem = vendorQuotes[itemId];
        if (!quotesForItem) return null;

        const validPrices = Object.values(quotesForItem).filter(price => price >= 0);
        if (validPrices.length === 0) return null;

        return Math.min(...validPrices);
    }

    const isLoading = areVendorsLoading || areItemsLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Step 2: Compare Vendor Prices</CardTitle>
                <CardDescription>
                    Enter the quoted price for each item from the relevant suppliers. The best price will be highlighted in green.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px]">Item Name</TableHead>
                                {isLoading && <TableHead>Loading...</TableHead>}
                                {!isLoading && allVendors?.map(vendor => (
                                    <TableHead key={vendor.id} className="text-center">{vendor.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({length: procurementListIds.length}).map((_,i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-8 w-full"/></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full"/></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full"/></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && procurementList.map(item => {
                                const bestPrice = getBestPriceForItem(item.id);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                        {allVendors?.map(vendor => {
                                            const currentPrice = vendorQuotes[item.id]?.[vendor.id];
                                            const isBestPrice = currentPrice !== undefined && currentPrice >= 0 && currentPrice === bestPrice;

                                            return (
                                                <TableCell key={vendor.id} className="text-center">
                                                    <Input
                                                        type="number"
                                                        placeholder={currency}
                                                        className={`w-28 mx-auto text-right ${isBestPrice ? 'bg-green-100 dark:bg-green-900 border-green-500' : ''}`}
                                                        defaultValue={currentPrice && currentPrice >= 0 ? currentPrice : ''}
                                                        onChange={(e) => handlePriceChange(item.id, vendor.id, e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                 {!isLoading && (!allVendors || allVendors.length === 0) && (
                    <p className="py-12 text-center text-muted-foreground">No vendors found. Please add vendors in the settings.</p>
                 )}
                <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={onBack}>Back</Button>
                    <Button onClick={() => onComplete(vendorQuotes)}>Next: Finalize LPO</Button>
                </div>
            </CardContent>
        </Card>
    );
}
