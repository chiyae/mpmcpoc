
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

interface ComparePricesStepProps {
  procurementList: Item[];
  onComplete: (vendorQuotes: Record<string, Record<string, number>>) => void;
  onBack: () => void;
}

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
  }

export function ComparePricesStep({ procurementList, onComplete, onBack }: ComparePricesStepProps) {
    const firestore = useFirestore();
    const { currency } = useSettings();

    const [vendorQuotes, setVendorQuotes] = React.useState<Record<string, Record<string, number>>>({});

    const vendorsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
    const { data: allVendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);

    const handlePriceChange = (itemId: string, vendorId: string, price: string) => {
        const priceValue = parseFloat(price);
        setVendorQuotes(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [vendorId]: isNaN(priceValue) ? -1 : priceValue // Use -1 or another flag for invalid numbers
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

    const isLoading = areVendorsLoading;

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
                            {procurementList.map(item => {
                                const bestPrice = getBestPriceForItem(item.id);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                        {isLoading && Array.from({length: 3}).map((_, i) => <TableCell key={i}><Skeleton className="h-8 w-full"/></TableCell>)}
                                        {!isLoading && allVendors?.map(vendor => {
                                            const currentPrice = vendorQuotes[item.id]?.[vendor.id];
                                            const isBestPrice = currentPrice !== undefined && currentPrice >= 0 && currentPrice === bestPrice;

                                            return (
                                                <TableCell key={vendor.id} className="text-center">
                                                    <Input
                                                        type="number"
                                                        placeholder={currency}
                                                        className={`w-28 mx-auto text-right ${isBestPrice ? 'bg-green-100 dark:bg-green-900 border-green-500' : ''}`}
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

    