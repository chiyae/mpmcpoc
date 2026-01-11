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
  DropdownMenuCheckboxItem,
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
import { lpos as initialLpos } from '@/lib/data';
import { vendors } from '@/lib/vendors';
import type { Lpo, LpoStatus } from '@/lib/types';
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

export default function LpoManagementPage() {
  const { toast } = useToast();
  const [lpos, setLpos] = React.useState<Lpo[]>(initialLpos);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [selectedLpo, setSelectedLpo] = React.useState<Lpo | null>(null);
  const [isViewLpoOpen, setIsViewLpoOpen] = React.useState(false);

  const handleOpenViewLpo = (lpo: Lpo) => {
    setSelectedLpo(lpo);
    setIsViewLpoOpen(true);
  };
  
  const handleUpdateLpoStatus = (lpoId: string, status: LpoStatus) => {
    setLpos(prev => prev.map(lpo => lpo.lpoId === lpoId ? { ...lpo, status } : lpo));
    toast({
        title: "LPO Status Updated",
        description: `LPO ${lpoId} has been marked as ${status}.`
    });
    setIsViewLpoOpen(false);
  };


  const columns: ColumnDef<Lpo>[] = [
    {
      accessorKey: 'lpoId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          LPO ID
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('lpoId')}</div>,
    },
    {
      accessorKey: 'generatedDate',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.getValue('generatedDate')), 'dd/MM/yyyy'),
    },
    {
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('summary')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as LpoStatus;
        const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
            status === 'Completed' ? 'default' 
            : status === 'Pending' ? 'secondary'
            : status === 'Rejected' ? 'destructive'
            : 'outline';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const lpo = row.original;
        return (
          <Button variant="ghost" onClick={() => handleOpenViewLpo(lpo)}>View</Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: lpos,
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
          placeholder="Filter by LPO ID..."
          value={(table.getColumn('lpoId')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('lpoId')?.setFilterValue(event.target.value)
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
                  No LPOs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedLpo && (
        <Dialog open={isViewLpoOpen} onOpenChange={setIsViewLpoOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>LPO Details</DialogTitle>
            <DialogDescription>
                {`LPO ID: ${selectedLpo.lpoId} | Generated: ${format(new Date(selectedLpo.generatedDate), 'PPP')} | Status: `}
                <Badge variant={selectedLpo.status === 'Completed' ? 'default' : selectedLpo.status === 'Pending' ? 'secondary' : 'destructive'} className="capitalize">{selectedLpo.status}</Badge>
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedLpo.summary}</p>
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
                        {selectedLpo.items.map((item) => {
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
          <DialogFooter className="sm:justify-between">
            <div>
              <Button variant="destructive" onClick={() => handleUpdateLpoStatus(selectedLpo.lpoId, 'Rejected')} disabled={selectedLpo.status !== 'Pending'}>Reject</Button>
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <Button onClick={() => handleUpdateLpoStatus(selectedLpo.lpoId, 'Approved')} disabled={selectedLpo.status !== 'Pending'}>Approve</Button>
                <Button onClick={() => handleUpdateLpoStatus(selectedLpo.lpoId, 'Completed')} disabled={selectedLpo.status !== 'Approved'}>Mark as Completed</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
