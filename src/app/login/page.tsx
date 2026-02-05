
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseAuthUser } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
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

  async function handleUserDocCreation(signedInUser: FirebaseAuthUser) {
    if (!firestore) return;
    
    const userDocRef = doc(firestore, 'users', signedInUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const isAdmin = signedInUser.email === 'admin@example.com';
      const userRole = isAdmin ? 'admin' : 'pharmacy'; // Default role
      const userLocation = isAdmin ? 'all' : 'unassigned';
      const userDisplayName = signedInUser.email?.split('@')[0] || 'New User';

      try {
        await setDoc(userDocRef, {
          id: signedInUser.uid,
          username: signedInUser.email,
          displayName: userDisplayName,
          role: userRole,
          locationId: userLocation,
          disabled: false,
        });

      } catch (error: any) {
        console.error("Failed to create user document:", error);
        if(auth) auth.signOut(); // Log out user if profile creation fails
        throw new Error("Could not create your user profile on the server.");
      }
    }
  }


  async function handleSignIn(values: FormValues) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Check if user account is disabled
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().disabled === true) {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Account Disabled',
          description: 'Your account has been disabled. Please contact an administrator.',
        });
        setIsSubmitting(false);
        return;
      }
      
      toast({
        title: 'Sign in successful',
        description: 'Redirecting to your dashboard...',
      });
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: description,
      });
      setIsSubmitting(false);
    } 
  }
  
  async function handleSignUp(values: FormValues) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await handleUserDocCreation(userCredential.user);
      toast({
        title: 'Account Created!',
        description: 'You have been signed in successfully.',
      });
    } catch (error: any) {
      let description = error.message || 'An unexpected error occurred.';
       if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already in use. Please try signing in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
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

  const LoginForm = ({ onFormSubmit, buttonText }: { onFormSubmit: (values: FormValues) => void, buttonText: string}) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
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
          {isSubmitting ? 'Processing...' : buttonText}
        </Button>
      </form>
    </Form>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Tabs defaultValue="signin" className="w-full max-w-sm">
            <Card>
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl">Welcome</CardTitle>
                    <CardDescription>
                        Sign in to your account or create a new one.
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                        <LoginForm onFormSubmit={handleSignIn} buttonText="Sign In" />
                    </TabsContent>
                    <TabsContent value="signup">
                        <LoginForm onFormSubmit={handleSignUp} buttonText="Create Account" />
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}

    