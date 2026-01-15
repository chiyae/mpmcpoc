
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Item, Stock, Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';


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

function ManualAddDialog({ allItems, onAddItems, currentList }: { allItems: MappedItem[], onAddItems: (items: Item[]) => void, currentList: Item[] }) {
    const [selected, setSelected] = React.useState<Map<string, Item>>(new Map());

    const handleSelect = (item: Item) => {
        setSelected(prev => {
            const newMap = new Map(prev);
            if (newMap.has(item.id)) {
                newMap.delete(item.id);
            } else {
                newMap.set(item.id, item);
            }
            return newMap;
        })
    }
    
    const currentListIds = new Set(currentList.map(i => i.id));
    const availableItems = allItems.filter(item => !currentListIds.has(item.id));


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Manually Add</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manually Add Items to List</DialogTitle>
                </DialogHeader>
                <Command>
                    <CommandInput placeholder="Search for items to add..." />
                    <CommandEmpty>No items found.</CommandEmpty>
                    <ScrollArea className="h-72">
                    <CommandGroup>
                        {availableItems.map((item) => (
                        <CommandItem
                            key={item.id}
                            value={formatItemName(item)}
                            onSelect={() => handleSelect(item)}
                        >
                             <CheckIcon
                                className={cn(
                                "mr-2 h-4 w-4",
                                selected.has(item.id) ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {formatItemName(item)}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                    </ScrollArea>
                </Command>
                <div className="flex justify-end gap-2">
                    <DialogTrigger asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                        <Button onClick={() => onAddItems(Array.from(selected.values()))}>Add {selected.size} Items</Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export function BuildProcurementListDialog({ onConfirm, initialSelectedItems }: BuildProcurementListDialogProps) {
    const firestore = useFirestore();

    const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
    const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

    const stockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'bulk-store')) : null, [firestore]);
    const { data: bulkStock, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);
    
    const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
    const { data: vendors, isLoading: isLoadingVendors } = useCollection<Vendor>(vendorsQuery);

    const [currentList, setCurrentList] = React.useState<Item[]>([]);

    const mappedItems: MappedItem[] = React.useMemo(() => {
        if (!allItems || !bulkStock) return [];
        return allItems.map(item => {
            const stock = bulkStock.find(s => s.itemId === item.id);
            const currentStock = stock?.currentStockQuantity || 0;
            return {
                ...item,
                currentStock,
                isLowStock: currentStock < item.reorderLevel,
            }
        });
    }, [allItems, bulkStock]);
    
    React.useEffect(() => {
        setCurrentList(initialSelectedItems);
    }, [initialSelectedItems]);

    const lowStockItems = React.useMemo(() => {
        return mappedItems.filter(item => item.isLowStock && !currentList.find(i => i.id === item.id));
    }, [mappedItems, currentList]);

    const handleAddItem = (item: Item) => {
        setCurrentList(prev => [...prev, item]);
    }

    const handleRemoveItem = (itemId: string) => {
        setCurrentList(prev => prev.filter(item => item.id !== itemId));
    }
    
    const handleManualAdd = (itemsToAdd: Item[]) => {
        setCurrentList(prev => [...prev, ...itemsToAdd]);
    }

    const handleConfirm = () => {
        onConfirm(currentList);
    }
    
    const getVendorCountForItem = (itemId: string) => {
        if (!vendors) return 0;
        return vendors.filter(v => v.supplies?.includes(itemId)).length;
    }
    
    const isLoading = isLoadingItems || isLoadingStock || isLoadingVendors;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Low Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Reorder Lvl</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && Array.from({length: 5}).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                                    ))}
                                    {!isLoading && lowStockItems.length === 0 && (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No low stock items.</TableCell></TableRow>
                                    )}
                                    {!isLoading && lowStockItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                            <TableCell className="text-right">{item.reorderLevel}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" onClick={() => handleAddItem(item)}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/> Add
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Current List Panel */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                           <CardTitle>Current List ({currentList.length})</CardTitle>
                           <ManualAddDialog allItems={mappedItems} onAddItems={handleManualAdd} currentList={currentList} />
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-96">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead>Vendors</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentList.length === 0 && (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No items in list.</TableCell></TableRow>
                                    )}
                                    {currentList.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                                            <TableCell>{getVendorCountForItem(item.id)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>


             <div className="flex justify-end pt-4">
                <Button onClick={handleConfirm}>Done</Button>
             </div>
        </div>
    )
}
