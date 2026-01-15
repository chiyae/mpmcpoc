
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
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
import type { LocalPurchaseOrder } from '@/lib/types';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/context/settings-provider';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LocalPurchaseOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { formatCurrency } = useSettings();

  const lposQuery = useMemoFirebase(() => firestore ? collection(firestore, 'localPurchaseOrders') : null, [firestore]);
  const { data: lpos, isLoading } = useCollection<LocalPurchaseOrder>(lposQuery);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedLpo, setSelectedLpo] = React.useState<LocalPurchaseOrder | null>(null);
  const [isLpoOpen, setIsLpoOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  const handleUpdateStatus = async (lpoId: string, status: 'Sent' | 'Completed' | 'Rejected') => {
    if (!firestore) return;
    setIsUpdating(true);
    const lpoRef = doc(firestore, 'localPurchaseOrders', lpoId);
    try {
        const batch = writeBatch(firestore);
        batch.update(lpoRef, { status });
        await batch.commit();
        toast({ title: 'LPO Status Updated', description: `LPO ${lpoId} has been marked as ${status}.`});
        setIsLpoOpen(false);
    } catch (error) {
        console.error("Failed to update LPO status:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update LPO status.' });
    } finally {
        setIsUpdating(false);
    }
  }


  const columns: ColumnDef<LocalPurchaseOrder>[] = [
    {
      accessorKey: 'lpoNumber',
      header: 'LPO Number',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
    },
    {
      accessorKey: 'grandTotal',
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue('grandTotal'))}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as LocalPurchaseOrder['status'];
        const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
            status === 'Completed' ? 'default' 
            : status === 'Sent' ? 'outline'
            : status === 'Rejected' ? 'destructive'
            : 'secondary';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" onClick={() => { setSelectedLpo(row.original); setIsLpoOpen(true); }}>View LPO</Button>
      ),
    },
  ];

  const table = useReactTable({
    data: lpos ?? [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full space-y-6">
       <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Local Purchase Orders</h1>
            <p className="text-muted-foreground">
                View, track, and manage all generated LPOs.
            </p>
        </header>

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
                <TableRow key={row.id}>
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
                  No LPOs have been generated yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

       {selectedLpo && (
        <Dialog open={isLpoOpen} onOpenChange={setIsLpoOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>LPO Details: {selectedLpo.lpoNumber}</DialogTitle>
            <DialogDescription>
                To: {selectedLpo.vendorName} | Status: <Badge variant={selectedLpo.status === 'Completed' ? 'default' : selectedLpo.status === 'Rejected' ? 'destructive' : 'secondary'} className="capitalize">{selectedLpo.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLpo.items.map((item) => {
                            return (
                              <TableRow key={item.itemId}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                              </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                </ScrollArea>
                <div className="text-right text-lg font-bold">
                    Grand Total: {formatCurrency(selectedLpo.grandTotal)}
                </div>
            </div>
          <DialogFooter className="sm:justify-between mt-4">
            <div className="flex gap-2">
                {selectedLpo.status === 'Draft' && (
                    <Button variant="outline" onClick={() => handleUpdateStatus(selectedLpo.id, 'Rejected')} disabled={isUpdating}>Reject</Button>
                )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                {selectedLpo.status === 'Draft' && (
                    <Button onClick={() => handleUpdateStatus(selectedLpo.id, 'Sent')} disabled={isUpdating}>
                        {isUpdating ? 'Updating...' : 'Mark as Sent'}
                    </Button>
                )}
                 {selectedLpo.status === 'Sent' && (
                    <Button onClick={() => handleUpdateStatus(selectedLpo.id, 'Completed')} disabled={isUpdating}>
                        {isUpdating ? 'Updating...' : 'Mark as Completed'}
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
