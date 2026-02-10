
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import type { Patient } from '@/lib/types';
import { format, differenceInYears } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PatientForm } from '@/components/patient-form';


export default function PatientManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const patientsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'patients') : null),
    [firestore]
  );
  const { data: patients, isLoading, error } = useCollection<Patient>(patientsCollectionQuery);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenDialog = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  }
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
  }

  const handleFormSubmit = async (patientData: Omit<Patient, 'id'>) => {
    if (!firestore) return;

    if (selectedPatient) { // Editing existing patient
        try {
            const patientRef = doc(firestore, 'patients', selectedPatient.id);
            await setDoc(patientRef, patientData, { merge: true });

            handleCloseDialog();
            toast({
                title: "Patient Updated",
                description: `Successfully updated details for ${patientData.name}.`
            })
        } catch(error) {
            console.error("Error updating patient:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update patient details."
            })
        }
    } else { // Adding new patient
        try {
          const regNumber = `PAT-${Date.now()}`;
          const patientRef = doc(firestore, 'patients', regNumber);

          const newPatientData: Patient = {
            ...patientData,
            id: regNumber,
          }
          await setDoc(patientRef, newPatientData);

          handleCloseDialog();
          toast({
              title: "Patient Registered",
              description: `Successfully registered ${patientData.name} with ID ${regNumber}.`
          })
        } catch(error) {
            console.error("Error adding patient:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to register new patient."
            })
        }
    }
  };


  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'id',
      header: 'Reg. Number',
      cell: ({ row }) => <div className="font-mono">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Date of Birth (Age)',
      cell: ({ row }) => {
        const dob = new Date(row.getValue('dateOfBirth'));
        const age = differenceInYears(new Date(), dob);
        return <div>{format(dob, 'dd/MM/yyyy')} <span className="text-muted-foreground">({age})</span></div>;
      },
    },
    {
        accessorKey: 'address',
        header: 'Address',
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row.original)}>
            Edit
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: patients ?? [],
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

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view patient data.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
        <div className="flex items-start justify-between">
            <header className="space-y-1.5">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
                        <p className="text-muted-foreground">Register new patients and manage existing records.</p>
                    </div>
                </div>
            </header>
            <div className="flex items-center gap-2">
                {isClient && (
                  <Button onClick={() => handleOpenDialog(null)}>Register New Patient</Button>
                )}
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
         <div className="flex items-center">
            <Input
                placeholder="Filter by patient name or ID..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('name')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
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
                  Array.from({ length: 5 }).map((_, i) => (
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
                !isLoading && <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    No patients found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      
      {isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{selectedPatient ? `Edit Patient: ${selectedPatient.name}` : 'Register New Patient'}</DialogTitle>
                    <DialogDescription>
                        {selectedPatient ? 'Update the details for this patient.' : 'Fill in the details for the new patient. A registration number will be generated automatically.'}
                    </DialogDescription>
                  </DialogHeader>
                  <PatientForm
                      patient={selectedPatient}
                      onSubmit={handleFormSubmit}
                  />
              </DialogContent>
          </Dialog>
      )}
    </div>
  );
}
