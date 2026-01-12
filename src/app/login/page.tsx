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
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import type { UserCredential } from 'firebase/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

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

  const ensureUserDocument = async (userCredential: UserCredential) => {
    if (!firestore) return;

    const user = userCredential.user;
    const userRef = doc(firestore, 'users', user.uid);

    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        // Document already exists, do nothing further.
        return;
      }

      // Document doesn't exist, so create it.
      // This is the first sign-in for this user.
      // We will check if this is the first user document ever being created.
      const usersCollectionRef = collection(firestore, 'users');
      const allUsersSnap = await getDocs(usersCollectionRef);

      const isFirstUser = allUsersSnap.empty;
      
      const role = isFirstUser ? 'admin' : 'pharmacy';
      const locationId = isFirstUser ? 'all' : 'unassigned';
      
      // Note: In a real app, setting the custom claim 'role' would be done
      // via a backend function (e.g., a Cloud Function) triggered on user creation.
      // For this prototype, we are creating the Firestore document which the rules will read.

      await setDoc(userRef, {
        id: user.uid,
        username: user.email,
        displayName: user.email?.split('@')[0] || 'New User',
        role: role,
        locationId: locationId,
      });

      if (isFirstUser) {
        toast({
          title: `Admin User Created`,
          description: `The first user account is now an Administrator.`,
        });
      }

    } catch (error: any) {
      // Catch potential permission errors during the getDocs check for non-admins.
      if (error.code === 'permission-denied') {
        // This is an expected error for a new, non-admin user trying to check if they are the first user.
        // We can safely assume they are not the admin and proceed.
        const defaultRole = 'pharmacy';
        await setDoc(userRef, {
          id: user.uid,
          username: user.email,
          displayName: user.email?.split('@')[0] || 'New User',
          role: defaultRole,
          locationId: 'unassigned',
        });
      } else {
        // Handle other, unexpected errors during document creation
        console.error("Error creating user document:", error);
        toast({
          variant: "destructive",
          title: 'Profile Creation Failed',
          description: "We couldn't set up your user profile. Please contact support.",
        });
      }
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await ensureUserDocument(userCredential);
      toast({
        title: 'Sign in successful',
        description: 'Redirecting to your dashboard...',
      });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          await ensureUserDocument(newUserCredential);
          toast({
            title: 'Account created successfully',
            description: 'Signing you in and redirecting...',
          });
          router.push('/');
        } catch (signUpError: any) {
          toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: signUpError.message || 'Could not create an account.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isUserLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p>Loading...</p>
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
            Enter your credentials to access your dashboard.
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
                        placeholder="user@example.com"
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
                {isSubmitting ? 'Signing In...' : 'Sign In or Sign Up'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
