
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  username: z.string().email({ message: 'Please enter a valid email.' }),
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['admin', 'cashier', 'pharmacy'], { required_error: 'Please select a role.' }),
  locationId: z.string({ required_error: 'Please select a location.' }),
});

type AddUserFormProps = {
  onUserAdded: () => void;
};

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // In a real app, locations would be fetched from Firestore.
  // For now, we'll use a mock list.
  const locations = [
    { id: 'bulk-store', name: 'Bulk Store' },
    { id: 'dispensary', name: 'Dispensary' },
    { id: 'billing', name: 'Billing' },
    { id: 'all', name: 'All Locations' },
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      displayName: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.username, values.password);
      const user = userCredential.user;

      // 2. Create user document in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        username: values.username,
        displayName: values.displayName,
        role: values.role,
        locationId: values.locationId,
      });

      toast({
        title: 'User Created',
        description: `Successfully created user ${values.displayName}.`,
      });
      onUserAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }
      toast({
        variant: 'destructive',
        title: 'Failed to Create User',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating User...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
