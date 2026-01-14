
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Item, Stock } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type BuildProcurementListDialogProps = {
    onConfirm: (selectedItems: Item[]) => void;
    initialSelectedItems: Item[];
}

type MappedItem = Item & {
    currentStock: number;
    isLowStock: boolean;
}

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export function BuildProcurementListDialog({ onConfirm, initialSelectedItems }: BuildProcurementListDialogProps) {
    const firestore = useFirestore();

    const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
    const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

    const stockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'bulk-store')) : null, [firestore]);
    const { data: bulkStock, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);

    const [selectedItems, setSelectedItems] = React.useState<Map<string, Item>>(new Map());

    const mappedItems = React.useMemo((): MappedItem[] => {
        if (!allItems || !bulkStock) return [];

        return allItems.map(item => {
            const stock = bulkStock.find(s => s.itemId === item.id);
            const currentStock = stock?.currentStockQuantity || 0;
            return {
                ...item,
                currentStock,
                isLowStock: currentStock < item.reorderLevel,
            }
        }).sort((a, b) => (b.isLowStock ? 1 : 0) - (a.isLowStock ? 1 : 0));
    }, [allItems, bulkStock]);

    React.useEffect(() => {
        const initialMap = new Map<string, Item>();
        // Pre-select low stock items
        mappedItems.forEach(item => {
            if (item.isLowStock) {
                initialMap.set(item.id, item);
            }
        });
        // Add any initially passed items
        initialSelectedItems.forEach(item => {
            initialMap.set(item.id, item);
        });
        setSelectedItems(initialMap);
    }, [mappedItems, initialSelectedItems]);

    const handleSelect = (item: MappedItem, isSelected: boolean) => {
        setSelectedItems(prev => {
            const newMap = new Map(prev);
            if (isSelected) {
                newMap.set(item.id, item);
            } else {
                newMap.delete(item.id);
            }
            return newMap;
        });
    }

    const handleConfirm = () => {
        onConfirm(Array.from(selectedItems.values()));
    }
    
    const isLoading = isLoadingItems || isLoadingStock;

    return (
        <div className="space-y-4">
             <ScrollArea className="h-[60vh] border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                            <TableHead className="text-right">Reorder Level</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                        ))}
                        {!isLoading && mappedItems.map(item => {
                            const isSelected = selectedItems.has(item.id);
                            return (
                                <TableRow key={item.id} data-state={isSelected && 'selected'}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelect(item, !!checked)}
                                            aria-label={`Select ${item.genericName}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatItemName(item)}
                                        {item.isLowStock && <Badge variant="destructive" className="ml-2">Low Stock</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">{item.currentStock}</TableCell>
                                    <TableCell className="text-right">{item.reorderLevel}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
             </ScrollArea>
             <div className="flex justify-end">
                <Button onClick={handleConfirm}>Confirm List ({selectedItems.size} items)</Button>
             </div>
        </div>
    )
}
