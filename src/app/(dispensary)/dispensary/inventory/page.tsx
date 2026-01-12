'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
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
import { dispensaryItems, internalOrders } from '@/lib/data';
import type { InternalOrder, Item } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RequestStockForm } from '@/components/request-stock-form';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function DispensaryInventoryPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<Item[]>(dispensaryItems);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isRequestStockOpen, setIsRequestStockOpen] = React.useState(false);

  const handleRequestStock = (newOrder: InternalOrder) => {
    internalOrders.unshift(newOrder);
    setIsRequestStockOpen(false);
    table.resetRowSelection();
    toast({
      title: "Stock Request Submitted",
      description: `Order #${newOrder.id} has been sent to the bulk store for processing.`,
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
        cell: ({ row }) => {
          return (
            <div className="text-right">
                <Button variant="outline" size="sm" onClick={() => {
                  row.toggleSelected(true);
                  setIsRequestStockOpen(true);
                }}>Request Stock</Button>
            </div>
          )
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
  });

  const selectedItems = table.getFilteredSelectedRowModel().rows.map(row => row.original);


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
                <Button variant="outline" asChild>
                    <Link href="/dispensary/stock-taking">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Start Stock Take
                    </Link>
                </Button>
                <Dialog open={isRequestStockOpen} onOpenChange={setIsRequestStockOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={selectedItems.length === 0}>
                      Request New Stock Transfer ({selectedItems.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Request New Stock Transfer</DialogTitle>
                      <DialogDescription>
                        Specify the quantities you need from the bulk store.
                      </DialogDescription>
                    </DialogHeader>
                    <RequestStockForm 
                      selectedItems={selectedItems} 
                      onSubmit={handleRequestStock} 
                      onCancel={() => setIsRequestStockOpen(false)}
                    />
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
    </div>
  );
}
