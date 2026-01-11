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
import { bulkStoreItems } from '@/lib/data';
import type { Item } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
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


export default function BulkStoreInventoryPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<Item[]>(bulkStoreItems);
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
  const [lowStockItems, setLowStockItems] = React.useState<Item[]>([]);

  const handleOpenLpoDialog = () => {
    const items = data.filter(item => item.quantity < item.reorderLevel);
    setLowStockItems(items);
    setIsLpoDialogOpen(true);
  };

  const handleGenerateLpo = () => {
    // In a real app, this would trigger a more complex LPO generation process (e.g., PDF, API call).
    // For now, we just show a confirmation toast.
    toast({
      title: "LPO Generated",
      description: `LPO created for ${lowStockItems.length} low-stock item(s).`,
    });
    setIsLpoDialogOpen(false);
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
        description: `Successfully added ${newItem.name} to the inventory.`,
    });
  };

  const handleAdjustStock = (itemId: string, adjustment: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + adjustment }
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
      accessorKey: 'name',
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
      cell: ({ row }) => <div className="capitalize">{row.getValue('name')}</div>,
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
        const quantity = parseFloat(row.getValue('quantity'));
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
        const expiryDate = parseISO(row.getValue('expiryDate'));
        const daysToExpiry = differenceInDays(expiryDate, new Date());
        let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';
  
        if (daysToExpiry < 0) {
          badgeVariant = 'destructive';
        } else if (daysToExpiry <= 30) {
          badgeVariant = 'destructive';
        }
  
        return <Badge variant={badgeVariant}>{new Date(row.getValue('expiryDate')).toLocaleDateString()}</Badge>;
  
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
    data,
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
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleOpenLpoDialog}>Generate LPO</Button>
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
                {table.getRowModel().rows?.length ? (
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
                <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    No results.
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
                  Detailed information for {selectedItem.name}.
                </DialogDescription>
              </DialogHeader>
              <ItemDetails item={selectedItem} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock: {selectedItem.name}</DialogTitle>
                <DialogDescription>
                  Make a correction to the current stock quantity. Use 'Add New Item' to add a new batch with a different expiry date.
                </DialogDescription>
              </DialogHeader>
              <AdjustStockForm item={selectedItem} onAdjustStock={handleAdjustStock} />
            </DialogContent>
          </Dialog>
        </>
      )}

      <Dialog open={isLpoDialogOpen} onOpenChange={setIsLpoDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Local Purchase Order (LPO)</DialogTitle>
            <DialogDescription>
              The following items are below their reorder level and will be added to the LPO.
            </DialogDescription>
          </DialogHeader>
          {lowStockItems.length > 0 ? (
            <ScrollArea className="max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Reorder Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </ScrollArea>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No items are currently below their reorder level.
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleGenerateLpo} disabled={lowStockItems.length === 0}>
              Confirm & Generate LPO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
