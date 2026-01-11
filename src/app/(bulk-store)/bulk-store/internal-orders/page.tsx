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
import { internalOrders as initialInternalOrders, bulkStoreItems } from '@/lib/data';
import type { InternalOrder, OrderStatus } from '@/lib/types';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function InternalOrderManagementPage() {
  const { toast } = useToast();
  const [internalOrders, setInternalOrders] = React.useState<InternalOrder[]>(initialInternalOrders);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [selectedOrder, setSelectedOrder] = React.useState<InternalOrder | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = React.useState(false);

  const handleOpenViewOrder = (order: InternalOrder) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };
  
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    // Logic to issue stock can be added here
    if (status === 'Issued' && selectedOrder) {
        let allItemsAvailable = true;
        selectedOrder.requestedItems.forEach(requestedItem => {
            const storeItem = bulkStoreItems.find(item => item.id === requestedItem.itemId);
            if (!storeItem || storeItem.quantity < requestedItem.quantity) {
                allItemsAvailable = false;
                toast({
                    variant: "destructive",
                    title: "Insufficient Stock",
                    description: `Not enough stock for ${storeItem?.name || requestedItem.itemId}.`
                });
            }
        });

        if (!allItemsAvailable) {
            return; // Stop the process if any item has insufficient stock
        }

        // If all items are available, deduct them from bulk store (for now, in-memory)
        selectedOrder.requestedItems.forEach(requestedItem => {
            const itemIndex = bulkStoreItems.findIndex(item => item.id === requestedItem.itemId);
            if(itemIndex !== -1) {
                bulkStoreItems[itemIndex].quantity -= requestedItem.quantity;
            }
        });
    }

    setInternalOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
    
    toast({
        title: "Order Status Updated",
        description: `Order ${orderId} has been marked as ${status}.`
    });

    if (status !== 'Approved') {
        setIsViewOrderOpen(false);
    }
  };


  const columns: ColumnDef<InternalOrder>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order ID
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy'),
    },
    {
        accessorKey: 'from',
        header: 'From',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as OrderStatus;
        const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
            status === 'Issued' ? 'default' 
            : status === 'Pending' ? 'secondary'
            : status === 'Rejected' ? 'destructive'
            : 'outline';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button variant="ghost" onClick={() => handleOpenViewOrder(order)}>View Request</Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: internalOrders,
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by Order ID..."
          value={(table.getColumn('id')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('id')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  No pending internal orders.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Internal Order Request</DialogTitle>
            <DialogDescription>
                {`Order ID: ${selectedOrder.id} | From: ${selectedOrder.from} | Status: `}
                <Badge variant={selectedOrder.status === 'Issued' ? 'default' : selectedOrder.status === 'Pending' ? 'secondary' : 'destructive'} className="capitalize">{selectedOrder.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item ID</TableHead>
                          <TableHead>Requested Quantity</TableHead>
                          <TableHead className="text-right">Stock on Hand</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.requestedItems.map((item) => {
                            const storeItem = bulkStoreItems.find(i => i.id === item.itemId);
                            const availableStock = storeItem?.quantity || 0;
                            const isInsufficient = availableStock < item.quantity;
                            return (
                              <TableRow key={item.itemId} className={isInsufficient ? "bg-destructive/10" : ""}>
                                <TableCell className="font-medium">{item.itemId}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className={`text-right ${isInsufficient ? 'text-destructive font-bold' : ''}`}>
                                    {availableStock}
                                </TableCell>
                              </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          <DialogFooter className="sm:justify-between">
            <div>
              {selectedOrder.status === 'Pending' && (
                <Button variant="destructive" onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Rejected')}>Reject</Button>
              )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                {selectedOrder.status === 'Pending' && (
                    <Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Approved')}>Approve</Button>
                )}
                 {selectedOrder.status === 'Approved' && (
                    <Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Issued')}>Issue Stock</Button>
                )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
