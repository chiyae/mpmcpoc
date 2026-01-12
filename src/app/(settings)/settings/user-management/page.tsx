
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
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

  const userDocQuery = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  
  const { data: user, isLoading: isUserDocLoading, error } = useDoc<User>(userDocQuery);
  const isLoading = isAuthUserLoading || isUserDocLoading;

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <p className="text-sm text-muted-foreground">Please ensure you are logged in.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          View and manage your own profile information.
        </p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            This is your user account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          )}
          {!isLoading && user && (
             <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  {authUser?.photoURL && <AvatarImage src={authUser.photoURL} alt={user.displayName} />}
                  <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{user.displayName}</h2>
                    <p className="text-muted-foreground">{user.username}</p>
                    <div className="flex gap-2 pt-2">
                        <Badge>Role: {user.role}</Badge>
                        <Badge variant="secondary">Location: {user.locationId}</Badge>
                    </div>
                </div>
            </div>
          )}
           {!isLoading && !user && (
            <p className="text-muted-foreground">User profile could not be loaded.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
