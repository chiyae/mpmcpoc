
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
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
import type { Item } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AddItemForm } from '@/components/add-item-form';

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) {
      name += ` (${item.brandName})`;
    }
    if (item.strengthValue) {
      name += ` ${item.strengthValue}${item.strengthUnit}`;
    }
    if (item.concentrationValue) {
      name += ` ${item.concentrationValue}${item.concentrationUnit}`;
    }
    if (item.packageSizeValue) {
      name += ` (${item.packageSizeValue}${item.packageSizeUnit})`;
    }
    return name;
}


export default function ItemMasterPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const itemsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'items') : null),
    [firestore]
  );
  const { data: items, isLoading, error } = useCollection<Item>(itemsCollectionQuery);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isAddItemOpen, setIsAddItemOpen] = React.useState(false);

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopyItemId = (itemId: string) => {
    navigator.clipboard.writeText(itemId);
    toast({
      title: "Copied to Clipboard",
      description: `Item Code: ${itemId}`,
    });
  }

  const handleAddItem = async (itemData: Omit<Item, 'id' | 'itemCode'>) => {
    if (!firestore) return;
    try {
      // Auto-generate item code
      const codePrefix = itemData.genericName.substring(0, 3).toUpperCase();
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const itemCode = `${codePrefix}${codeSuffix}`;
      
      const itemRef = doc(firestore, 'items', itemCode);

      const finalData: Item = {
        ...itemData,
        id: itemCode,
        itemCode: itemCode,
      }
      await setDoc(itemRef, finalData);

      setIsAddItemOpen(false);
      toast({
          title: "Item Added",
          description: `Successfully added ${formatItemName(finalData)}.`
      })
    } catch(error) {
        console.error("Error adding item:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add item. Please try again."
        })
    }
  }

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'itemCode',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Item Code
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('itemCode')}</div>,
    },
    {
      accessorKey: 'itemName',
      header: 'Item Name',
      cell: ({ row }) => <div className="font-medium">{formatItemName(row.original)}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('category')}</div>
      ),
    },
    {
        accessorKey: 'unitCost',
        header: () => <div className="text-right">Unit Cost</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("unitCost"))
            const formatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: 'sellingPrice',
        header: () => <div className="text-right">Selling Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("sellingPrice"))
            const formatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
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
              <DropdownMenuItem>
                Edit item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items ?? [],
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
  });

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the item master data.</p>
      </div>
    );
  }

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
                {isClient && (
                  <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                    <DialogTrigger asChild>
                      <Button>Add New Item</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                      <DialogHeader>
                        <DialogTitle>Add New Master Item</DialogTitle>
                        <DialogDescription>
                          Define a new item that can be stocked in inventory.
                        </DialogDescription>
                      </DialogHeader>
                      <AddItemForm onAddItem={handleAddItem} />
                    </DialogContent>
                  </Dialog>
                )}
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
                    No items found. Add one to get started.
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
    </div>
  );
}
