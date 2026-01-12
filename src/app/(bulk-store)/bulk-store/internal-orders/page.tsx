
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
import type { InternalOrder, OrderStatus, Stock, Item } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function InternalOrderManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'internalOrders') : null, [firestore]);
  const { data: internalOrders, isLoading: isLoadingOrders } = useCollection<InternalOrder>(ordersQuery);

  const stockQuery = useMemoFirebase(() => firestore ? collection(firestore, 'stocks') : null, [firestore]);
  const { data: allStock, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [selectedOrder, setSelectedOrder] = React.useState<InternalOrder | null>(null);
  const [isViewOrderOpen, setIsViewOrderOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleOpenViewOrder = (order: InternalOrder) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };
  
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!firestore || !selectedOrder) return;
    setIsProcessing(true);

    const orderRef = doc(firestore, 'internalOrders', orderId);

    if (status === 'Issued') {
        const batch = writeBatch(firestore);

        // Logic to check and transfer stock
        let canFulfill = true;
        for (const requestedItem of selectedOrder.items) {
            const bulkStockItems = allStock?.filter(s => s.itemId === requestedItem.itemId && s.locationId === 'bulk-store') || [];
            const totalBulkStock = bulkStockItems.reduce((sum, s) => sum + s.currentStockQuantity, 0);

            if (totalBulkStock < requestedItem.quantity) {
                const itemDetails = allItems?.find(i => i.id === requestedItem.itemId);
                toast({
                    variant: 'destructive',
                    title: 'Insufficient Stock',
                    description: `Not enough stock for ${itemDetails?.genericName || requestedItem.itemId}. Required: ${requestedItem.quantity}, Available: ${totalBulkStock}`
                });
                canFulfill = false;
                break;
            }
        }
        
        if (!canFulfill) {
            setIsProcessing(false);
            return;
        }

        // If checks pass, perform transfers
        for (const requestedItem of selectedOrder.items) {
            // This is a simplified transfer logic. A real app would need to handle multiple batches, FIFO/FEFO etc.
            // Here we just deduct from the first available batch in bulk and add/update in dispensary.
            const bulkStockDoc = allStock?.find(s => s.itemId === requestedItem.itemId && s.locationId === 'bulk-store');
            const dispensaryStockDoc = allStock?.find(s => s.itemId === requestedItem.itemId && s.locationId === 'dispensary' && s.batchId === bulkStockDoc?.batchId);

            if (bulkStockDoc) {
                const bulkStockRef = doc(firestore, 'stocks', bulkStockDoc.id);
                batch.update(bulkStockRef, { currentStockQuantity: bulkStockDoc.currentStockQuantity - requestedItem.quantity });
                
                if (dispensaryStockDoc) {
                    const dispensaryStockRef = doc(firestore, 'stocks', dispensaryStockDoc.id);
                    batch.update(dispensaryStockRef, { currentStockQuantity: dispensaryStockDoc.currentStockQuantity + requestedItem.quantity });
                } else {
                    // Create new stock record in dispensary
                    const newDispensaryStockRef = doc(collection(firestore, 'stocks'));
                    batch.set(newDispensaryStockRef, {
                        ...bulkStockDoc,
                        id: newDispensaryStockRef.id,
                        locationId: 'dispensary',
                        currentStockQuantity: requestedItem.quantity,
                    });
                }
            }
        }
        
        batch.update(orderRef, { status: 'Issued' });

        try {
            await batch.commit();
            toast({
                title: "Stock Issued",
                description: `Stock for order ${orderId} has been transferred to the dispensary.`
            });
            setIsViewOrderOpen(false);
        } catch(error) {
            console.error("Error issuing stock:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the stock issuance.' });
        }


    } else { // Handle Approve and Reject
        try {
            await writeBatch(firestore).update(orderRef, { status }).commit();
            toast({
                title: "Order Status Updated",
                description: `Order ${orderId} has been marked as ${status}.`
            });
            if (status !== 'Approved') {
                setIsViewOrderOpen(false);
            }
        } catch(error) {
            console.error("Error updating order:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the order status.' });
        }
    }

    setIsProcessing(false);
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
        accessorKey: 'requestingLocationId',
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
    data: internalOrders ?? [],
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

  const isLoading = isLoadingOrders || isLoadingStock || isLoadingItems;

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
                  No pending internal orders.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Internal Order Request</DialogTitle>
            <DialogDescription>
                {`Order ID: ${selectedOrder.id} | From: ${selectedOrder.requestingLocationId} | Status: `}
                <Badge variant={selectedOrder.status === 'Issued' ? 'default' : selectedOrder.status === 'Pending' ? 'secondary' : 'destructive'} className="capitalize">{selectedOrder.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Requested Quantity</TableHead>
                          <TableHead className="text-right">Stock on Hand</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => {
                            const itemDetails = allItems?.find(i => i.id === item.itemId);
                            const availableStock = allStock?.find(s => s.itemId === item.itemId && s.locationId === 'bulk-store')?.currentStockQuantity || 0;
                            const isInsufficient = availableStock < item.quantity;
                            return (
                              <TableRow key={item.itemId} className={isInsufficient ? "bg-destructive/10" : ""}>
                                <TableCell className="font-medium">{itemDetails?.genericName || item.itemId}</TableCell>
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
                <Button variant="destructive" onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Rejected')} disabled={isProcessing}>Reject</Button>
              )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                {selectedOrder.status === 'Pending' && (
                    <Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Approved')} disabled={isProcessing}>Approve</Button>
                )}
                 {selectedOrder.status === 'Approved' && (
                    <Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Issued')} disabled={isProcessing}>
                        {isProcessing ? 'Issuing...' : 'Issue Stock'}
                    </Button>
                )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
