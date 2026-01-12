
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
import type { Item, Stock } from "@/lib/types"

const formSchema = z.object({
  adjustment: z.coerce
    .number()
    .int({ message: "Adjustment must be a whole number." })
    .refine((val) => val !== 0, { message: "Adjustment cannot be zero." }),
});

type AdjustStockFormProps = {
  item: Item & { stock?: Stock };
  onAdjustStock: (itemId: string, adjustment: number) => void;
};

export function AdjustStockForm({ item, onAdjustStock }: AdjustStockFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustment: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const currentQuantity = item.stock?.currentStockQuantity ?? 0;
    if (currentQuantity + values.adjustment < 0) {
      form.setError("adjustment", {
        type: "manual",
        message: "Stock cannot go below zero.",
      });
      return;
    }
    onAdjustStock(item.id, values.adjustment);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="adjustment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Correction</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., -10 or 25" {...field} />
              </FormControl>
              <FormDescription>
                Current quantity: {item.stock?.currentStockQuantity ?? 0}. Enter a positive value to add stock, and a negative value to remove it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">Apply Correction</Button>
        </div>
      </form>
    </Form>
  );
}
