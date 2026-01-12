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
import { lpos } from '@/lib/data';
import { vendors } from '@/lib/vendors';
import type { Item, GenerateLpoOutput, Lpo } from '@/lib/types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { AddItemForm } from '@/components/add-item-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ItemDetails } from '@/components/item-details';
import { AdjustStockForm } from '@/components/adjust-stock-form';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateLpo } from '@/ai/flows/lpo-generation';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function BulkStoreInventoryPage() {
  const { toast } = useToast();
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const itemsCollectionQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'items') : null),
    [user, firestore]
  );
  
  const { data: bulkStoreItems, isLoading: isItemsLoading } = useCollection<Item>(itemsCollectionQuery);

  const [data, setData] = React.useState<Item[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isAddItemFormOpen, setIsAddItemFormOpen] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = React.useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = React.useState(false);
  const [isLpoDialogOpen, setIsLpoDialogOpen] = React.useState(false);

  const [isGeneratingLpo, setIsGeneratingLpo] = React.useState(false);
  const [generatedLpo, setGeneratedLpo] = React.useState<GenerateLpoOutput | null>(null);
  
  const isLoading = isUserLoading || isItemsLoading;

  React.useEffect(() => {
    if (bulkStoreItems) {
      setData(bulkStoreItems);
    }
  }, [bulkStoreItems]);

  const handleOpenLpoDialog = async () => {
    setIsLpoDialogOpen(true);
    setIsGeneratingLpo(true);
    setGeneratedLpo(null);

    const lowStockItems = data.filter(item => (item.quantity ?? 0) < item.reorderLevel);

    if (lowStockItems.length === 0) {
        setIsGeneratingLpo(false);
        return;
    }
    
    try {
        const lpo = await generateLpo({ lowStockItems, vendors });
        setGeneratedLpo(lpo);
    } catch (error) {
        console.error("Failed to generate LPO:", error);
        toast({
            variant: "destructive",
            title: "AI LPO Generation Failed",
            description: "There was an error communicating with the AI. Please try again.",
        });
        setIsLpoDialogOpen(false); // Close dialog on error
    } finally {
        setIsGeneratingLpo(false);
    }
  };

  const handleConfirmLpo = () => {
    if (!generatedLpo) return;

    const newLpo: Lpo = {
      ...generatedLpo,
      status: "Pending",
    };
    lpos.unshift(newLpo); // Add to the beginning of the array

    toast({
      title: "LPO Confirmed",
      description: `LPO ${generatedLpo.lpoId} has been logged and is ready for processing.`,
    });
    setIsLpoDialogOpen(false);
    setGeneratedLpo(null);
  };


  const handleCopyItemId = (itemId: string) => {
    navigator.clipboard.writeText(itemId);
    toast({
      title: "Copied to Clipboard",
      description: `Item ID: ${itemId}`,
    });
  }

  const handleOpenViewDetails = (item: Item) => {
    setSelectedItem(item);
    setIsViewDetailsOpen(true);
  };

  const handleOpenAdjustStock = (item: Item) => {
    setSelectedItem(item);
    setIsAdjustStockOpen(true);
  };


  const handleAddItem = (newItem: Item) => {
    setData((prev) => [...prev, newItem]);
    setIsAddItemFormOpen(false);
    toast({
        title: "Item Added",
        description: `Successfully added ${newItem.itemName} to the inventory.`,
    });
  };

  const handleAdjustStock = (itemId: string, adjustment: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: (item.quantity ?? 0) + adjustment }
          : item
      )
    );
    setIsAdjustStockOpen(false);
    toast({
        title: "Stock Adjusted",
        description: `Successfully updated stock for item ${itemId}.`,
    });
  };

  const columns: ColumnDef<Item>[] = [
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
      accessorKey: 'itemName',
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
      cell: ({ row }) => <div className="capitalize">{row.getValue('itemName')}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('category')}</div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="text-right">Quantity</div>,
      cell: ({ row }) => {
        // Mock data as quantity isn't on the Item entity directly
        const quantity = row.original.quantity ?? 0;
        const { reorderLevel } = row.original;
        const isLowStock = quantity < reorderLevel;
  
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
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => {
        // This is a placeholder as expiry is on the batch
        return <Badge variant={'secondary'}>N/A</Badge>;
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
              <DropdownMenuItem onClick={() => handleOpenViewDetails(item)}>
                View item details
              </DropdownMenuItem>
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
    data: data,
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
      handleOpenViewDetails,
      handleOpenAdjustStock,
      handleCopyItemId,
    }
  });


  return (
    <div className="w-full">
        <div className="flex items-center justify-between py-4">
            <Input
            placeholder="Filter items..."
            value={(table.getColumn('itemName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('itemName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleOpenLpoDialog}>Generate LPO with AI</Button>
                 <Dialog open={isAddItemFormOpen} onOpenChange={setIsAddItemFormOpen}>
                  <DialogTrigger asChild>
                    <Button>Add New Item</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to add a new item to the bulk store inventory.
                      </DialogDescription>
                    </DialogHeader>
                    <AddItemForm onAddItem={handleAddItem} />
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
        <>
          <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Item Details</DialogTitle>
                <DialogDescription>
                  Detailed information for {selectedItem.itemName}.
                </DialogDescription>
              </DialogHeader>
              <ItemDetails item={selectedItem} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock: {selectedItem.itemName}</DialogTitle>
                <DialogDescription>
                  Make a correction to the current stock quantity. Use a positive number to add stock, and a negative number to remove it (e.g. for breakages or count correction). To add a new batch with a different expiry date, please use the 'Add New Item' function.
                </DialogDescription>
              </DialogHeader>
              <AdjustStockForm item={selectedItem} onAdjustStock={handleAdjustStock} />
            </DialogContent>
          </Dialog>
        </>
      )}

      <Dialog open={isLpoDialogOpen} onOpenChange={setIsLpoDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Local Purchase Order (LPO)</DialogTitle>
            <DialogDescription>
                {isGeneratingLpo 
                    ? "The AI is analyzing your low-stock items and vendors to generate an optimized LPO..." 
                    : generatedLpo 
                        ? `LPO ${generatedLpo.lpoId} generated on ${format(new Date(generatedLpo.generatedDate), 'PPP')}. Review and confirm below.`
                        : "No items are currently below their reorder level."
                }
            </DialogDescription>
          </DialogHeader>
            {isGeneratingLpo && (
                 <div className="space-y-4 py-8">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
            )}
            {generatedLpo && (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{generatedLpo.summary}</p>
                <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Order Qty</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>AI Reasoning</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedLpo.items.map((item) => {
                            const vendor = vendors.find(v => v.id === item.selectedVendorId);
                            return (
                              <TableRow key={item.itemId}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell>{item.quantityToOrder}</TableCell>
                                <TableCell>{vendor?.name || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.reasoning}</TableCell>
                              </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            )}
           {!isGeneratingLpo && !generatedLpo && (
                <p className="py-8 text-center text-muted-foreground">
                    No items are currently below their reorder level.
                </p>
           )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirmLpo} disabled={!generatedLpo || isGeneratingLpo}>
              Confirm & Log LPO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
