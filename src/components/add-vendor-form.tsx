
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Item, Vendor } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Vendor name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  supplies: z.array(z.string()).min(1, 'Please select at least one item this vendor supplies.'),
});

type AddVendorFormProps = {
  onVendorAdded: (vendor: Vendor) => void;
  allItems: Item[];
};

export function AddVendorForm({ onVendorAdded, allItems }: AddVendorFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      supplies: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const newVendor: Vendor = {
        id: `VEND-${Date.now()}`,
        ...values,
    };

    onVendorAdded(newVendor);
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
              <FormLabel>Supplied Items</FormLabel>
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
                      <span className="truncate">
                        {field.value?.length > 0 ? `${field.value.length} items selected` : "Select items..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search items..." />
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-48">
                            <CommandList>
                            {allItems.map((item) => (
                                <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={(currentValue) => {
                                    const selected = field.value || [];
                                    const isSelected = selected.includes(currentValue);
                                    form.setValue(
                                        "supplies",
                                        isSelected
                                        ? selected.filter(id => id !== currentValue)
                                        : [...selected, currentValue]
                                    );
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?.includes(item.id) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {item.itemName}
                                </CommandItem>
                            ))}
                            </CommandList>
                        </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select all the items that this vendor can supply.
              </FormDescription>
              <div className="flex flex-wrap gap-1">
                {field.value?.map(itemId => {
                    const item = allItems.find(i => i.id === itemId);
                    return item ? <Badge key={itemId} variant="secondary">{item.itemName}</Badge> : null
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Vendor...' : 'Add Vendor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
