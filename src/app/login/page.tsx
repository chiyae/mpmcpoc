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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Logo from '@/components/logo';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const signedInUser = userCredential.user;

      // After sign-in, check if a user document exists. If not, create one.
      // This is crucial for the first admin user.
      const userDocRef = doc(firestore, 'users', signedInUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // This is likely the first sign-in for the admin user.
        // We create their document here.
        await setDoc(userDocRef, {
          id: signedInUser.uid,
          username: signedInUser.email,
          displayName: signedInUser.email?.split('@')[0] || 'Admin', // Default display name
          role: 'admin', // Assign admin role
          locationId: 'all', // Default location
        });
         toast({
          title: 'Admin profile created',
          description: 'First-time admin sign-in. Profile has been set up.',
        });
      } else {
        toast({
          title: 'Sign in successful',
          description: 'Redirecting to your dashboard...',
        });
      }

      // The useEffect will handle the redirect to '/'
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred during sign-in.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full max-w-sm" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your admin credentials to access the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                      />
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
