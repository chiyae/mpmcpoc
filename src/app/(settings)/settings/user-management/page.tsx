
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AddUserForm } from '@/components/add-user-form';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

  const usersCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading: areUsersLoading, error } = useCollection<User>(usersCollectionQuery);
  const isLoading = isAuthUserLoading || areUsersLoading;

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);

  const handleUserAdded = () => {
    setIsAddUserOpen(false);
    // The useCollection hook will automatically update the list
  }

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the list of users.</p>
        <p className="text-sm text-muted-foreground">Please contact an administrator if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
       <div className="flex items-center justify-between">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
            Add, view, and manage user accounts and roles.
            </p>
        </header>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
                <Button>Add New User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to create a new user account.
                    </DialogDescription>
                </DialogHeader>
                <AddUserForm onUserAdded={handleUserAdded} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all user accounts in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email / Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && users && users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                     <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.displayName}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.username}</TableCell>
                        <TableCell><Badge>{user.role}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{user.locationId}</Badge></TableCell>
                        <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          {!isLoading && (!users || users.length === 0) && (
             <p className="py-12 text-center text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
