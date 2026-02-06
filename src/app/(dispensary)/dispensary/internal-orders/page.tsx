'use client';

import * as React from 'react';
import {
  CaretSortIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InternalOrder, OrderStatus, Item } from '@/lib/types';
import { format, subDays, isWithinInterval } from 'date-fns';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function DispensaryInternalOrdersPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => 
    firestore 
      ? query(collection(firestore, 'internalOrders'), where('requestingLocationId', '==', 'dispensary')) 
      : null, 
    [firestore]
  );
  const { data: internalOrders, isLoading: isLoadingOrders } = useCollection<InternalOrder>(ordersQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<InternalOrder | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = React.useState(false);

   const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = React.useMemo(() => {
    if (!internalOrders) return [];
    if (!dateRange?.from) return internalOrders;

    return internalOrders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            return isWithinInterval(orderDate, { start: dateRange.from!, end: dateRange.to || new Date() });
        } catch(e) {
            return false;
        }
    });
  }, [internalOrders, dateRange]);

  const handleOpenViewOrder = (order: InternalOrder) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
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
      cell: ({ row }) => <div className="font-mono">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy'),
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
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => {
            const items = row.getValue('items') as InternalOrder['items'];
            return <span>{items.length}</span>
        }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button variant="ghost" onClick={() => handleOpenViewOrder(order)}>View Details</Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData ?? [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const isLoading = isLoadingOrders || isLoadingItems;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-6">
        <header>
            <h1 className="text-3xl font-bold tracking-tight">Internal Order History</h1>
            <p className="text-muted-foreground mt-1">
            Track the status of stock requests you have made to the Bulk Store.
            </p>
        </header>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
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
            ) : null}
            {!isLoading && !table.getRowModel().rows.length ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No internal stock requests found in the selected date range.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
                {`Order ID: ${selectedOrder.id} | Status: `}
                <Badge variant={selectedOrder.status === 'Issued' ? 'default' : selectedOrder.status === 'Pending' ? 'secondary' : 'destructive'} className="capitalize">{selectedOrder.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-right">Requested Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => {
                            const itemDetails = allItems?.find(i => i.id === item.itemId);
                            return (
                              <TableRow key={item.itemId}>
                                <TableCell className="font-medium">{itemDetails?.genericName || item.itemId}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                              </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
