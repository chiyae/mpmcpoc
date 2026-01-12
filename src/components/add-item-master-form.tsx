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
  itemName: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  itemCode: z.string().min(2, { message: "Item code must be at least 2 characters." }).refine(s => !s.includes('/'), "Item code cannot contain '/'"),
  category: z.enum(["Medicine", "Medical Supply", "Consumable"]),
  unitOfMeasure: z.string().min(1, { message: "Unit of measure is required." }),
  reorderLevel: z.coerce.number().int().nonnegative({ message: "Reorder level must be a non-negative number." }),
  unitCost: z.coerce.number().nonnegative({ message: "Unit cost must be a non-negative number." }),
  sellingPrice: z.coerce.number().nonnegative({ message: "Selling price must be a non-negative number." }),
})

type AddItemMasterFormProps = {
  onAddItem: (item: Omit<Item, 'id'>) => Promise<void>;
}

export function AddItemMasterForm({ onAddItem }: AddItemMasterFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      itemCode: "",
      unitOfMeasure: "",
      reorderLevel: 0,
      unitCost: 0,
      sellingPrice: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await onAddItem(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemName"
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
            name="itemCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code (SKU)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PAR500" {...field} />
                </FormControl>
                <FormDescription>This must be a unique code and cannot contain '/'.</FormDescription>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
           <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Cost (USD)</FormLabel>
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
                <FormLabel>Selling Price (USD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
