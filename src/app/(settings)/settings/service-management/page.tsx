
'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Service } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AddServiceForm } from '@/components/add-service-form';

export default function ServiceManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const servicesCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'services') : null),
    [firestore]
  );
  const { data: services, isLoading, error } = useCollection<Service>(servicesCollectionQuery);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isAddServiceOpen, setIsAddServiceOpen] = React.useState(false);

  const handleAddService = async (serviceData: Omit<Service, 'id'>) => {
    if (!firestore) return;
    try {
      const serviceId = serviceData.name.toUpperCase().replace(/\s+/g, '-');
      const serviceRef = doc(firestore, 'services', serviceId);
      await setDoc(serviceRef, { ...serviceData, id: serviceId });
      setIsAddServiceOpen(false);
      toast({
          title: "Service Added",
          description: `Successfully added ${serviceData.name}.`
      })
    } catch(error) {
        console.error("Error adding service:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add service. Please try again."
        })
    }
  }

  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Service Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'fee',
        header: () => <div className="text-right">Fee</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("fee"))
            const formatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  Edit service
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: services ?? [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view services.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
                <p className="text-muted-foreground">Define billable clinic services like consultation or lab fees.</p>
            </header>
            <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                <DialogTrigger asChild>
                <Button>Add New Service</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Service</DialogTitle>
                    <DialogDescription>
                    Define a new billable service.
                    </DialogDescription>
                </DialogHeader>
                <AddServiceForm onAddService={handleAddService} />
                </DialogContent>
            </Dialog>
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
                {isLoading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
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
                !isLoading && <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    No services found. Add one to get started.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
    </div>
  );
}
