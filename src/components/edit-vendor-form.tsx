
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
import type { Item, Vendor } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Vendor name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  supplies: z.array(z.string()).optional(),
});

type EditVendorFormProps = {
  vendor: Vendor;
  onVendorUpdated: (vendorId: string, vendor: Omit<Vendor, 'id'>) => void;
  allItems: Item[];
  isLoadingItems: boolean;
};

function formatItemName(item: Item) {
    let name = item.genericName;
    if (item.brandName) name += ` (${item.brandName})`;
    if (item.strengthValue) name += ` ${item.strengthValue}${item.strengthUnit}`;
    return name;
}

export function EditVendorForm({ vendor, onVendorUpdated, allItems, isLoadingItems }: EditVendorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (vendor) {
        form.reset({
            name: vendor.name,
            email: vendor.email,
            contactPerson: vendor.contactPerson || '',
            phone: vendor.phone || '',
            supplies: vendor.supplies || [],
        });
    }
  }, [vendor, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    await onVendorUpdated(vendor.id, values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="supplies"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Items Supplied</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value?.length && "text-muted-foreground"
                      )}
                    >
                      {field.value?.length ? `${field.value.length} items selected` : "Select items"}
                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search items..."
                      className="h-9"
                    />
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      {allItems.map((item) => (
                        <CommandItem
                          value={item.id}
                          key={item.id}
                          onSelect={() => {
                            const selected = field.value || [];
                            const isSelected = selected.includes(item.id);
                            form.setValue(
                              "supplies",
                              isSelected
                                ? selected.filter((id) => id !== item.id)
                                : [...selected, item.id]
                            );
                          }}
                        >
                           {formatItemName(item)}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              (field.value || []).includes(item.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
