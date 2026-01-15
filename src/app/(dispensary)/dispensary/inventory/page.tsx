
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
import type { InternalOrder, Item, Stock, StockTakeSession } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RequestStockForm } from '@/components/request-stock-form';
import { ClipboardList } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, setDoc, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemDetails } from '@/components/item-details';


type DispensaryStockItem = Item & {
  stockData: Stock;
};

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export default function DispensaryInventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isRequestStockOpen, setIsRequestStockOpen] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<DispensaryStockItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // --- Data Fetching ---
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const stockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null, [firestore]);
  const { data: dispensaryStocks, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);

  const inventoryData: DispensaryStockItem[] = React.useMemo(() => {
    if (!allItems || !dispensaryStocks) return [];
    
    return dispensaryStocks.map(stock => {
      const itemInfo = allItems.find(item => item.id === stock.itemId);
      return {
        ...itemInfo, // Spread item details
        stockData: stock, // Keep the original stock document
      } as DispensaryStockItem;
    }).filter(item => item.genericName); // Filter out items that couldn't be matched
  }, [allItems, dispensaryStocks]);


  const handleRequestStock = async (items: { itemId: string; quantity: number }[]) => {
    if (!firestore) return;

    const orderId = `IO-${Date.now()}`;
    const internalOrderRef = doc(firestore, 'internalOrders', orderId);
    
    const newOrder: InternalOrder = {
        id: orderId,
        date: new Date().toISOString(),
        requestingLocationId: 'dispensary',
        status: 'Pending',
        items,
    }

    try {
        await setDoc(internalOrderRef, newOrder);
        setIsRequestStockOpen(false);
        table.resetRowSelection();
        toast({
          title: "Stock Request Submitted",
          description: `Order #${newOrder.id} has been sent to the bulk store for processing.`,
        });
    } catch (error) {
        console.error("Failed to submit stock request:", error);
        toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit the stock request." });
    }
  };

  const handleStartStockTake = async () => {
    if (!firestore) return;

    const sessionId = `ST-DISP-${Date.now()}`;
    const sessionRef = doc(firestore, 'stockTakeSessions', sessionId);

    const newSession: StockTakeSession = {
      id: sessionId,
      date: new Date().toISOString(),
      locationId: 'dispensary',
      status: 'Ongoing'
    };

    try {
      await setDoc(sessionRef, newSession);
      router.push(`/dispensary/stock-taking?session=${sessionId}`);
    } catch (error) {
      console.error("Failed to start stock take session:", error);
      toast({
        variant: 'destructive',
        title: 'Error Starting Session',
        description: 'Could not create a new stock-take session.',
      });
    }
  };

  const handleOpenDetails = (item: DispensaryStockItem) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const columns: ColumnDef<DispensaryStockItem>[] = [
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
      accessorKey: 'genericName',
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
      cell: ({ row }) => <div className="capitalize">{formatItemName(row.original)}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.category}</div>
      ),
    },
    {
      accessorKey: 'currentStockQuantity',
      header: () => <div className="text-right">Quantity</div>,
      accessorFn: row => row.stockData.currentStockQuantity,
      cell: ({ row }) => {
        const quantity = row.original.stockData.currentStockQuantity;
        const { reorderLevel } = row.original;
        const isLowStock = reorderLevel && quantity < reorderLevel;
  
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
      accessorFn: row => row.stockData.expiryDate,
      cell: ({ row }) => {
        const expiryDateStr = row.original.stockData.expiryDate;
        if (!expiryDateStr) return <Badge variant="outline">N/A</Badge>;

        const expiryDate = parseISO(expiryDateStr);
        const daysToExpiry = differenceInDays(expiryDate, new Date());
        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  
        if (daysToExpiry < 0) {
          badgeVariant = 'destructive';
        } else if (daysToExpiry <= 30) {
          badgeVariant = 'destructive';
        }
  
        return <Badge variant={badgeVariant}>{new Date(expiryDate).toLocaleDateString()}</Badge>;
  
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" onClick={() => handleOpenDetails(row.original)}>View</Button>
      ),
    },
  ];

  const table = useReactTable({
    data: inventoryData,
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
  const isLoading = isLoadingItems || isLoadingStock;

  return (
    <div className="w-full">
        <div className="flex items-center justify-between py-4">
            <Input
            placeholder="Filter items..."
            value={(table.getColumn('genericName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('genericName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleStartStockTake}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Start Stock Take
                </Button>
                <Dialog open={isRequestStockOpen} onOpenChange={setIsRequestStockOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={selectedItems.length === 0} onClick={() => setIsRequestStockOpen(true)}>
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
                      selectedItems={selectedItems.map(item => ({...item, name: formatItemName(item)}))} 
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
                {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
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
                ) : null }
                {!isLoading && !table.getRowModel().rows?.length ? (
                <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    No items in dispensary inventory.
                    </TableCell>
                </TableRow>
                ) : null}
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
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
            </DialogHeader>
            <ItemDetails item={{...selectedItem, stock: selectedItem.stockData}} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
