
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Item, Stock } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ManuallyAddItemDialog } from './manually-add-item-dialog';

interface BuildProcurementListStepProps {
  initialList: string[]; // Now takes array of item IDs
  onComplete: (procurementList: Item[]) => void;
}

function formatItemName(item: Item) {
  let name = item.genericName;
  if (item.brandName) name += ` (${item.brandName})`;
  if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
  return name;
}

export function BuildProcurementListStep({ initialList, onComplete }: BuildProcurementListStepProps) {
  const firestore = useFirestore();

  const itemsCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'items') : null), [firestore]);
  const { data: allItems, isLoading: areItemsLoading } = useCollection<Item>(itemsCollectionQuery);

  const stockCollectionQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'stocks') : null), [firestore]);
  const { data: allStock, isLoading: areStockLoading } = useCollection<Stock>(stockCollectionQuery);
  
  const [currentList, setCurrentList] = React.useState<Item[]>([]);
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);

  // Effect to hydrate currentList from initialList IDs when allItems is available
  React.useEffect(() => {
    if (allItems && initialList.length > 0) {
      const hydratedList = initialList
        .map(id => allItems.find(item => item.id === id))
        .filter((item): item is Item => !!item);
      setCurrentList(hydratedList);
    }
  }, [allItems, initialList]);


  const isLoading = areItemsLoading || areStockLoading;

  const lowStockItems = React.useMemo(() => {
    if (!allItems || !allStock) return [];
    
    return allItems.filter(item => {
      // Don't show if it's already in the current procurement list
      if (currentList.some(listItem => listItem.id === item.id)) {
        return false;
      }
      const totalStock = allStock
        .filter(s => s.itemId === item.id)
        .reduce((sum, s) => sum + s.currentStockQuantity, 0);
      return totalStock < item.bulkStoreReorderLevel;
    });
  }, [allItems, allStock, currentList]);

  const handleAddItem = (item: Item) => {
    if (!currentList.some(i => i.id === item.id)) {
      setCurrentList(prev => [...prev, item]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentList(prev => prev.filter(i => i.id !== itemId));
  };
  
  const itemsForManualAdd = React.useMemo(() => {
    if (!allItems) return [];
    // Filter out items already in the current list
    return allItems.filter(item => !currentList.some(li => li.id === item.id));
  }, [allItems, currentList]);


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Build Procurement List</CardTitle>
          <CardDescription>
            Review items below minimum stock and manually add any other items needed for this procurement cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Stock Items Panel */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Low Stock Items</h3>
            <ScrollArea className="h-96 rounded-md border">
              <Table>
                <TableBody>
                  {isLoading && Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
                  {!isLoading && lowStockItems.length === 0 && <TableRow><TableCell className="h-96 text-center text-muted-foreground">No items are currently below reorder level.</TableCell></TableRow>}
                  {!isLoading && lowStockItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleAddItem(item)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Current List Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold">Current Procurement List ({currentList.length})</h3>
                 <Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Manually Add Item</Button>
            </div>
            <ScrollArea className="h-96 rounded-md border">
                 <Table>
                    <TableBody>
                        {isLoading && currentList.length === 0 && <TableRow><TableCell className="h-96 text-center text-muted-foreground">Loading...</TableCell></TableRow>}
                        {!isLoading && currentList.length === 0 && <TableRow><TableCell className="h-96 text-center text-muted-foreground">Add items from the low stock list or manually.</TableCell></TableRow>}
                        {currentList.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{formatItemName(item)}</TableCell>
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
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => onComplete(currentList)} disabled={currentList.length === 0}>
          Next: Compare Prices
        </Button>
      </div>

       <ManuallyAddItemDialog
            isOpen={isManualAddOpen}
            onOpenChange={setIsManualAddOpen}
            allItems={itemsForManualAdd}
            onItemSelected={handleAddItem}
            isLoading={isLoading}
        />
    </>
  );
}
