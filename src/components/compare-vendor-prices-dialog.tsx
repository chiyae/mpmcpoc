
'use client';

import * as React from 'react';
import type { Item, Vendor } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-provider';

type CompareVendorPricesDialogProps = {
    items: Item[];
    vendors: Vendor[];
    isLoading: boolean;
    onConfirm: (quotes: Record<string, Record<string, number>>) => void;
}

type PriceQuote = {
    itemId: string;
    vendorId: string;
    price: string;
}

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export function CompareVendorPricesDialog({ items, vendors, isLoading, onConfirm }: CompareVendorPricesDialogProps) {
    const { currency, formatCurrency } = useSettings();
    const [quotes, setQuotes] = React.useState<Record<string, Record<string, string>>>({});

    const handlePriceChange = (itemId: string, vendorId: string, price: string) => {
        setQuotes(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [vendorId]: price,
            }
        }));
    }
    
    const relevantVendors = React.useMemo(() => {
        const itemIds = new Set(items.map(i => i.id));
        return vendors.filter(vendor => 
            vendor.supplies?.some(suppliedItemId => itemIds.has(suppliedItemId))
        );
    }, [items, vendors]);
    
    const getBestPriceForitem = (itemId: string): number | null => {
        const itemQuotes = quotes[itemId];
        if (!itemQuotes) return null;

        const prices = Object.values(itemQuotes)
            .map(p => parseFloat(p))
            .filter(p => !isNaN(p) && p > 0);

        if (prices.length === 0) return null;
        return Math.min(...prices);
    }

    const handleConfirmClick = () => {
        const numericQuotes: Record<string, Record<string, number>> = {};
        for (const itemId in quotes) {
            numericQuotes[itemId] = {};
            for (const vendorId in quotes[itemId]) {
                const price = parseFloat(quotes[itemId][vendorId]);
                if (!isNaN(price)) {
                    numericQuotes[itemId][vendorId] = price;
                }
            }
        }
        onConfirm(numericQuotes);
    }

    return (
        <div className="space-y-4">
             <ScrollArea className="h-[60vh] border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="min-w-[250px]">Item</TableHead>
                            {isLoading && <TableHead>Loading Vendors...</TableHead>}
                            {!isLoading && relevantVendors.map(vendor => (
                                <TableHead key={vendor.id} className="text-right">{vendor.name}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={relevantVendors.length + 1}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ))}
                        {!isLoading && items.map(item => {
                            const bestPrice = getBestPriceForitem(item.id);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                    {relevantVendors.map(vendor => {
                                        const suppliesItem = vendor.supplies?.includes(item.id);
                                        if (!suppliesItem) {
                                            return <TableCell key={vendor.id} className="text-center text-muted-foreground bg-muted/50">-</TableCell>;
                                        }
                                        const currentPrice = quotes[item.id]?.[vendor.id] ?? '';
                                        const isBestPrice = bestPrice !== null && parseFloat(currentPrice) === bestPrice;

                                        return (
                                            <TableCell key={vendor.id} className="text-right">
                                                <Input 
                                                    type="number"
                                                    placeholder={currency}
                                                    value={currentPrice}
                                                    onChange={(e) => handlePriceChange(item.id, vendor.id, e.target.value)}
                                                    className={cn("text-right", isBestPrice && "border-green-500 ring-2 ring-green-500/20")}
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
             </ScrollArea>
             <div className="flex justify-end">
                <Button onClick={handleConfirmClick}>Save Quotes & Continue</Button>
             </div>
        </div>
    )
}
