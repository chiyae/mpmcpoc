"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Item } from "@/lib/types"

const formSchema = z.object({
  id: z.string().min(2, { message: "Item code must be at least 2 characters." }),
  name: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  category: z.enum(["Medicine", "Medical Supply", "Consumable"]),
  unitOfMeasure: z.string().min(1, { message: "Unit of measure is required." }),
  batchNumber: z.string().min(1, { message: "Batch number is required." }),
  expiryDate: z.string().refine((val) => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!regex.test(val)) return false;
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, { message: "Invalid date format. Use DD/MM/YYYY." }).refine((val) => {
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date > new Date();
  }, { message: "Expiry date must be in the future." }),
  quantity: z.coerce.number().int().positive({ message: "Quantity must be a positive number." }),
  reorderLevel: z.coerce.number().int().positive({ message: "Reorder level must be a positive number." }),
  unitCost: z.coerce.number().positive({ message: "Unit cost must be a positive number." }),
  sellingPrice: z.coerce.number().positive({ message: "Selling price must be a positive number." }),
})

type AddItemFormProps = {
  onAddItem: (item: Item) => void;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      unitOfMeasure: "",
      batchNumber: "",
      expiryDate: "",
      quantity: 0,
      reorderLevel: 0,
      unitCost: 0,
      sellingPrice: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const [day, month, year] = values.expiryDate.split('/').map(Number);
    const isoDate = new Date(year, month - 1, day).toISOString();

    const newItem: Item = {
      ...values,
      expiryDate: isoDate,
      location: "Bulk Store",
      usageHistory: [],
    };
    onAddItem(newItem);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Paracetamol 500mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PAR500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Medical Supply">Medical Supply</SelectItem>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. tablets, boxes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="batchNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. B12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input placeholder="DD/MM/YYYY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="reorderLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit">Add Item</Button>
        </div>
      </form>
    </Form>
  )
}
