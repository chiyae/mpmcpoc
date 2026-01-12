
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
import type { Bill, PaymentStatus } from '@/lib/types';
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
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesAndBillsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { formatCurrency } = useSettings();

  const billsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'billings') : null),
    [firestore]
  );
  const { data: bills, isLoading: areBillsLoading } = useCollection<Bill>(billsCollectionQuery);


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [isViewBillOpen, setIsViewBillOpen] = React.useState(false);

  const handleOpenViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsViewBillOpen(true);
  };
  
  const handleMarkAsPaid = async () => {
    if (!selectedBill || !firestore) return;

    const billRef = doc(firestore, 'billings', selectedBill.id);

    try {
        await setDoc(billRef, { 
            paymentDetails: {
                ...selectedBill.paymentDetails,
                status: 'Paid',
            }
        }, { merge: true });
        
        toast({
            title: "Bill Updated",
            description: `Bill ${selectedBill.id} has been marked as paid.`
        });
        setIsViewBillOpen(false);

    } catch (error) {
        console.error("Error marking bill as paid:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not mark the bill as paid.'
        });
    }
  }


  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bill ID
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
        accessorKey: 'patientName',
        header: 'Patient Name',
    },
    {
        accessorKey: 'grandTotal',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("grandTotal"))
            const formatted = formatCurrency(amount)
       
            return <div className="text-right font-medium">{formatted}</div>
          },
    },
    {
      accessorKey: 'paymentDetails.status',
      header: 'Status',
      accessorFn: (row) => row.paymentDetails.status,
      cell: ({ row }) => {
        const status = row.original.paymentDetails.status as PaymentStatus;
        const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
            status === 'Paid' ? 'default' 
            : 'destructive';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <Button variant="ghost" onClick={() => handleOpenViewBill(bill)}>View Details</Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: bills ?? [],
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
      <h1 className="text-2xl font-bold mb-4">Invoices & Past Bills</h1>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by Patient Name..."
          value={(table.getColumn('patientName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('patientName')?.setFilterValue(event.target.value)
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
            {areBillsLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                        <Skeleton className="h-8 w-full" />
                    </TableCell>
                </TableRow>
            ))}
            {!areBillsLoading && table.getRowModel().rows?.length ? (
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
             {!areBillsLoading && !table.getRowModel().rows?.length ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No bills found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {selectedBill && (
        <Dialog open={isViewBillOpen} onOpenChange={setIsViewBillOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
                {`Bill ID: ${selectedBill.id} | For: ${selectedBill.patientName} | Status: `}
                <Badge variant={selectedBill.paymentDetails.status === 'Paid' ? 'default' : 'destructive'} className="capitalize">{selectedBill.paymentDetails.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBill.items.map((item) => {
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
                    Grand Total: {formatCurrency(selectedBill.grandTotal)}
                </div>
            </div>
          <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                {selectedBill.paymentDetails.status === 'Unpaid' && (
                    <Button onClick={handleMarkAsPaid}>Mark as Paid</Button>
                )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
