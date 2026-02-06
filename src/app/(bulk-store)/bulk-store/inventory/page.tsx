
'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Item, Vendor, Stock } from '@/lib/types';
import { format } from 'date-fns';
import { ItemForm } from '@/components/item-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AdjustStockForm } from '@/components/adjust-stock-form';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, writeBatch, query, where } from 'firebase/firestore';
import { formatItemName } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type BulkStoreInventoryItem = Item & {
  stock?: Stock; // Stock is now optional
};

export default function BulkStoreInventoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const itemsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'items') : null),
    [firestore]
  );
  const { data: allItems, isLoading: isItemsLoading } = useCollection<Item>(itemsCollectionQuery);

  const stockCollectionQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'bulk-store')) : null),
    [firestore]
  );
  const { data: allStock, isLoading: isStockLoading } = useCollection<Stock>(stockCollectionQuery);

  const vendorsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vendors') : null),
    [firestore]
  );
  const { data: vendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsCollectionQuery);


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isAddItemFormOpen, setIsAddItemFormOpen] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<BulkStoreInventoryItem | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = React.useState(false);
  
  const isLoading = isItemsLoading || isStockLoading || areVendorsLoading;

  const inventoryData: BulkStoreInventoryItem[] = React.useMemo(() => {
    if (!allItems) return [];
    // This combines items with their stock information
    return allItems.map(item => {
        const bulkStock = allStock?.find(s => s.itemId === item.id);
        return {
            ...item,
            stock: bulkStock
        };
    });
  }, [allItems, allStock]);

  const handleCopyItemId = (itemId: string) => {
    navigator.clipboard.writeText(itemId);
    toast({
      title: "Copied to Clipboard",
      description: `Item ID: ${itemId}`,
    });
  }

  const handleOpenAdjustStock = (item: BulkStoreInventoryItem) => {
    setSelectedItem(item);
    setIsAdjustStockOpen(true);
  };


  const handleAddItem = async (itemData: Omit<Item, 'id'| 'itemCode'>) => {
    if (!firestore) return;
    setIsAddItemFormOpen(false);

    try {
        const codePrefix = itemData.genericName.substring(0, 3).toUpperCase();
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        const itemCode = `${codePrefix}${codeSuffix}`;
        
        const itemRef = doc(firestore, 'items', itemCode);
        const newItem: Item = { ...itemData, id: itemCode, itemCode: itemCode };

        await setDoc(itemRef, newItem);
        toast({
            title: "Item Added",
            description: `Successfully added ${formatItemName(newItem)} to the master list.`,
        });

    } catch (error) {
        console.error("Error adding item:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add new item.'});
    }
  };

  const handleAdjustStock = async (itemId: string, adjustment: number) => {
     if (!firestore || !selectedItem) return;
     setIsAdjustStockOpen(false);

     const stockDoc = selectedItem.stock;

     try {
        if (stockDoc) {
            // Update existing stock document
            const stockRef = doc(firestore, 'stocks', stockDoc.id);
            await writeBatch(firestore).update(stockRef, { currentStockQuantity: stockDoc.currentStockQuantity + adjustment }).commit();
        } else {
            // Create a new stock document for this item in the bulk-store
            const newStockRef = doc(collection(firestore, 'stocks'));
            // This is simplified - assumes a new batch. A real app would need a batch selection UI.
            const newBatchId = `B${Date.now()}`; 
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default 1 year expiry

            await setDoc(newStockRef, {
                id: newStockRef.id,
                itemId: itemId,
                locationId: 'bulk-store',
                currentStockQuantity: adjustment,
                batchId: newBatchId,
                expiryDate: expiryDate.toISOString(),
            });
        }
        
        toast({
            title: "Stock Adjusted",
            description: `Successfully updated stock for item ${itemId}.`,
        });

     } catch(error) {
        console.error("Error adjusting stock:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to adjust stock.'});
     }
  };

  const columns: ColumnDef<BulkStoreInventoryItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'genericName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Item Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="capitalize font-medium">{formatItemName(row.original)}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('category')}</div>
      ),
    },
    {
      accessorKey: 'stock.currentStockQuantity',
      header: () => <div className="text-right">Quantity</div>,
      accessorFn: row => row.stock?.currentStockQuantity ?? 0,
      cell: ({ row }) => {
        const quantity = row.original.stock?.currentStockQuantity ?? 0;
        const { bulkStoreReorderLevel } = row.original;
        const isLowStock = quantity < bulkStoreReorderLevel;
  
        return (
          <div className="text-right font-medium">
            {isLowStock ? (
              <Badge variant="destructive">
                {quantity} (Low)
              </Badge>
            ) : (
              quantity
            )}
          </div>
        );
      },
    },
     {
      accessorKey: 'stock.expiryDate',
      header: 'Expiry Date',
      accessorFn: row => row.stock?.expiryDate,
      cell: ({ row }) => {
        const expiryDate = row.original.stock?.expiryDate;
        return <Badge variant={expiryDate ? 'secondary' : 'outline'}>{expiryDate ? format(new Date(expiryDate), 'dd/MM/yyyy') : 'N/A'}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
  
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCopyItemId(item.id)}>
                Copy item ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleOpenAdjustStock(item)}>
                Adjust stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: inventoryData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      handleOpenAdjustStock,
      handleCopyItemId,
    }
  });


  return (
    <div className="w-full">
        <div className="flex items-center justify-between py-4">
            <Input
            placeholder="Filter items..."
            value={(table.getColumn('genericName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('genericName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={() => router.push('/tools/procurement-sessions')}>Procurement Tools</Button>
                 <Dialog open={isAddItemFormOpen} onOpenChange={setIsAddItemFormOpen}>
                  <DialogTrigger asChild>
                    <Button>Add New Item</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to add a new item to the master inventory list.
                      </DialogDescription>
                    </DialogHeader>
                    <ItemForm onSubmit={handleAddItem} />
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                    Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                        return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                            }
                        >
                            {column.id}
                        </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {isLoading && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                !isLoading && <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    No items in inventory. Add one to get started.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Next
            </Button>
            </div>
      </div>
      
      {selectedItem && (
          <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock: {formatItemName(selectedItem)}</DialogTitle>
                <DialogDescription>
                  Make a correction to the current stock quantity. Use a positive number to add stock, and a negative number to remove it.
                </DialogDescription>
              </DialogHeader>
              <AdjustStockForm item={selectedItem} onAdjustStock={handleAdjustStock} />
            </DialogContent>
          </Dialog>
      )}

    </div>
  );
}

    