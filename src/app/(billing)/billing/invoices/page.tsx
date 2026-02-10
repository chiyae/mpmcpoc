
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { ArrowLeft } from 'lucide-react';

export default function InvoicesAndBillsPage() {
  const router = useRouter();
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
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = React.useMemo(() => {
    if (!bills) return [];
    if (!dateRange?.from) return bills;

    return bills.filter(bill => {
        try {
            const billDate = new Date(bill.date);
            return isWithinInterval(billDate, { start: dateRange.from!, end: dateRange.to || new Date() });
        } catch(e) {
            return false;
        }
    });
  }, [bills, dateRange]);


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
    data: filteredData ?? [],
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

  const patientNameFilter = table.getColumn('patientName')?.getFilterValue() as string;

  const { totalVisitCount, visitsInDateRange, uniquePatientName } = React.useMemo(() => {
    if (!bills || !patientNameFilter) return { totalVisitCount: 0, visitsInDateRange: 0, uniquePatientName: null };

    const filteredTableRows = table.getRowModel().rows;
    const uniquePatientIds = new Set(filteredTableRows.map(row => row.original.patientId));
    
    if (uniquePatientIds.size === 1) {
        const patientId = uniquePatientIds.values().next().value;
        const patientName = filteredTableRows[0].original.patientName;
        const allVisitsForPatient = bills.filter(b => b.patientId === patientId).length;
        
        return { 
            totalVisitCount: allVisitsForPatient, 
            visitsInDateRange: filteredTableRows.length, 
            uniquePatientName: patientName
        };
    }
    
    return { totalVisitCount: 0, visitsInDateRange: 0, uniquePatientName: null };
  }, [table.getRowModel().rows, bills, patientNameFilter]);


  return (
    <div className="w-full space-y-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoices & Past Bills</h1>
                <p className="text-muted-foreground">Review and manage patient invoices and past bills.</p>
            </div>
        </div>
      </header>

      {uniquePatientName && (
        <Card>
          <CardHeader>
            <CardTitle>Visit History: {uniquePatientName}</CardTitle>
            <CardDescription>A summary of this patient's visits.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-baseline gap-6">
            <div>
              <p className="text-4xl font-bold">{totalVisitCount}</p>
              <p className="text-sm text-muted-foreground">Total Visits (All Time)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{visitsInDateRange}</p>
              <p className="text-sm text-muted-foreground">Visits in Selected Period</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter by Patient Name..."
          value={(table.getColumn('patientName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('patientName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
                  No bills found in the selected date range.
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
                <div className="space-y-2 text-right">
                    <div className="flex justify-end items-baseline gap-4">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(selectedBill.subtotal)}</span>
                    </div>
                    {selectedBill.discount && selectedBill.discount > 0 ? (
                        <div className="flex justify-end items-baseline gap-4">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="font-medium text-destructive">-{formatCurrency(selectedBill.discount)}</span>
                        </div>
                    ) : null}
                    <div className="flex justify-end items-baseline gap-4 text-lg font-bold">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(selectedBill.grandTotal)}</span>
                    </div>
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
