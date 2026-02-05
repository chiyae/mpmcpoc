'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '../ui/scroll-area';
import type { Item } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { formatItemName } from '@/lib/utils';


interface ManuallyAddItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    allItems: Item[];
    onItemSelected: (item: Item) => void;
    isLoading: boolean;
}

export function ManuallyAddItemDialog({ isOpen, onOpenChange, allItems, onItemSelected, isLoading }: ManuallyAddItemDialogProps) {

    const handleSelect = (item: Item) => {
        onItemSelected(item);
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Manually Add Item</DialogTitle>
                    <DialogDescription>
                        Search for an item from the master inventory to add it to the procurement list.
                    </DialogDescription>
                </DialogHeader>
                <Command shouldFilter={true}>
                    <CommandInput placeholder="Search for an item..." />
                    <CommandList>
                        <ScrollArea className="h-72">
                            {isLoading && <div className='p-2 space-y-2'><Skeleton className='h-8 w-full' /><Skeleton className='h-8 w-full' /><Skeleton className='h-8 w-full' /></div>}
                            <CommandEmpty>No items found.</CommandEmpty>
                            <CommandGroup>
                                {allItems.map(item => (
                                    <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                        {formatItemName(item)}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
