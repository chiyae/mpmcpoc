
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import type { Item, Stock, StockTakeSession, User } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList, FilterX } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, setDoc, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemDetails } from '@/components/item-details';
import { formatItemName } from '@/lib/utils';


type DispensaryStockItem = Item & {
  stockData: Stock;
};

export default function DispensaryInventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useUser();

  const userDocRef = useMemoFirebase(() => (firestore && authUser) ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  
  const [selectedItem, setSelectedItem] = React.useState<DispensaryStockItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // --- Data Fetching ---
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: allItems, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const stockQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null, [firestore]);
  const { data: dispensaryStocks, isLoading: isLoadingStock } = useCollection<Stock>(stockQuery);

  const prefilter = searchParams.get('filter');

  const inventoryData: DispensaryStockItem[] = React.useMemo(() => {
    if (!allItems || !dispensaryStocks) return [];
    
    let combinedData = dispensaryStocks.map(stock => {
      const itemInfo = allItems.find(item => item.id === stock.itemId);
      if (!itemInfo || itemInfo.category !== 'Medicine') return null;
      return {
        ...itemInfo,
        stockData: stock,
      } as DispensaryStockItem;
    }).filter((item): item is DispensaryStockItem => !!item);

    if (prefilter === 'low-stock') {
        combinedData = combinedData.filter(item => {
            const { stockData, dispensaryReorderLevel } = item;
            return stockData.currentStockQuantity < dispensaryReorderLevel;
        });
    } else if (prefilter === 'near-expiry') {
        combinedData = combinedData.filter(item => {
            const { stockData } = item;
            if (!stockData.expiryDate) return false;
            const daysToExpiry = differenceInDays(parseISO(stockData.expiryDate), new Date());
            return daysToExpiry >= 0 && daysToExpiry <= 30;
        });
    }
    
    return combinedData;
  }, [allItems, dispensaryStocks, prefilter]);


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
        const { dispensaryReorderLevel } = row.original;
        const isLowStock = dispensaryReorderLevel && quantity < dispensaryReorderLevel;
  
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const isLoading = isLoadingItems || isLoadingStock || isUserLoading;

  return (
    <div className="space-y-6">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Dispensary Inventory</h1>
            <p className="text-muted-foreground">
                View and manage all medicines currently stocked in the dispensary.
            </p>
        </header>

        <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
                <Input
                placeholder="Filter items..."
                value={(table.getColumn('genericName')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('genericName')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
                />
                {prefilter && (
                    <Button variant="outline" onClick={() => router.push('/dispensary/inventory')}>
                        <FilterX className="mr-2 h-4 w-4" /> Clear Filter
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleStartStockTake}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Start Stock Take
                </Button>
                
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
                    {prefilter ? `No items match the filter: "${prefilter}"` : "No medicines in dispensary inventory."}
                    </TableCell>
                </TableRow>
                ) : null}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s).
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
