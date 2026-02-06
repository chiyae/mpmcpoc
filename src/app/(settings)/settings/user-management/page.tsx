
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { useAppUser } from '@/hooks/use-app-user';
import { logAction } from '@/lib/audit';

export default function UserManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const currentUser = useAppUser();

  const usersCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading: areUsersLoading, error } = useCollection<User>(usersCollectionQuery);
  const isLoading = currentUser.isLoading || areUsersLoading;

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUserAdded = () => {
    setIsAddUserOpen(false);
    // The useCollection hook will automatically update the list
  }

  const handleToggleDisable = async (targetUser: User) => {
    if (!firestore || !currentUser.authUser) return;

    if (targetUser.id === currentUser.authUser.uid) {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: 'You cannot disable your own account.',
      });
      return;
    }

    const userRef = doc(firestore, 'users', targetUser.id);
    const newDisabledState = !targetUser.disabled;

    try {
      await setDoc(userRef, { disabled: newDisabledState }, { merge: true });
      
      // Log the action
      await logAction(firestore, currentUser, newDisabledState ? 'user.disable' : 'user.enable', {
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.username,
      });

      toast({
        title: 'User Updated',
        description: `${targetUser.displayName}'s account has been ${newDisabledState ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: "Could not update the user's status.",
      });
    }
  };


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
        {isClient && (
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
        )}
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && users && users.map(user => {
                  const isSelf = currentUser.authUser?.uid === user.id;

                  return (
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
                          <Badge variant={user.disabled ? 'destructive' : 'default'}>
                            {user.disabled ? 'Disabled' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem disabled>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleDisable(user)}
                                  disabled={isSelf}
                                  className={!user.disabled ? 'text-destructive focus:text-destructive' : ''}
                                >
                                  {user.disabled ? 'Enable User' : 'Disable User'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  );
                })}
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
