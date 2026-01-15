
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
import type { Vendor } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Vendor name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
});

type VendorFormProps = {
  vendor?: Vendor | null;
  onSubmit: (data: Omit<Vendor, 'id'>) => void;
};

export function VendorForm({ vendor, onSubmit }: VendorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      contactPerson: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (vendor) {
        form.reset({
            name: vendor.name,
            email: vendor.email,
            contactPerson: vendor.contactPerson || '',
            phone: vendor.phone || '',
        });
    } else {
        form.reset();
    }
  }, [vendor, form]);

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
  }

  const isEditing = !!vendor;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                    <Input placeholder="Pharma Supplies Ltd." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="sales@pharma.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                    <Input placeholder="+1-202-555-0104" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Vendor')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
