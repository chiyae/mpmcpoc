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
import { Bot } from 'lucide-react';

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
    if (item.concentrationValue && item.concentrationUnit) name += ` ${item.concentrationValue}${item.concentrationUnit}`;
    if (item.packageSizeValue && item.packageSizeUnit) name += ` (${item.packageSizeValue}${item.packageSizeUnit})`;
    return name;
}

export function CompareVendorPricesDialog({ items, vendors, isLoading, onConfirm }: CompareVendorPricesDialogProps) {
    const { currency } = useSettings();
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
        const itemIdsOnList = new Set(items.map(i => i.id));
        const relevantVendorIds = new Set<string>();
        
        vendors.forEach(vendor => {
            if (vendor.supplies?.some(suppliedItemId => itemIdsOnList.has(suppliedItemId))) {
                relevantVendorIds.add(vendor.id);
            }
        });

        return vendors.filter(vendor => relevantVendorIds.has(vendor.id));
    }, [items, vendors]);
    
    const getBestPriceForItem = (itemId: string): number | null => {
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

    const handleClearSession = () => {
        setQuotes({});
    }

    return (
        <div className="space-y-4">
             <ScrollArea className="h-[60vh] border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="w-[40px]">Sn</TableHead>
                            <TableHead className="min-w-[250px]">Item Name</TableHead>
                            {isLoading && <TableHead>Loading Vendors...</TableHead>}
                            {!isLoading && relevantVendors.map(vendor => (
                                <TableHead key={vendor.id} className="text-center">{vendor.name}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={relevantVendors.length + 2}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ))}
                        {!isLoading && items.map((item, index) => {
                            const bestPrice = getBestPriceForItem(item.id);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                    {relevantVendors.map(vendor => {
                                        const suppliesItem = vendor.supplies?.includes(item.id);
                                        if (!suppliesItem) {
                                            return <TableCell key={vendor.id} className="text-center text-muted-foreground bg-muted/30">-</TableCell>;
                                        }
                                        const currentPrice = quotes[item.id]?.[vendor.id] ?? '';
                                        const isBestPrice = bestPrice !== null && parseFloat(currentPrice) === bestPrice && bestPrice > 0;

                                        return (
                                            <TableCell key={vendor.id} className="text-right w-[150px]">
                                                <Input 
                                                    type="number"
                                                    placeholder={currency}
                                                    value={currentPrice}
                                                    onChange={(e) => handlePriceChange(item.id, vendor.id, e.target.value)}
                                                    className={cn(
                                                        "text-center", 
                                                        isBestPrice && "bg-green-100 dark:bg-green-900/50 border-green-500"
                                                    )}
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
             <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={handleClearSession}>Clear Session</Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled>
                        <Bot className="mr-2 h-4 w-4" />
                        Auto-Generate LPOs
                    </Button>
                    <Button onClick={handleConfirmClick}>Done</Button>
                </div>
             </div>
        </div>
    )
}
