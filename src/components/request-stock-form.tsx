
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { ScrollArea } from "./ui/scroll-area"
import { DialogFooter } from "./ui/dialog"
import { Plus } from "lucide-react"

type ItemForRequest = {
    id: string;
    name: string;
}

const formSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    itemName: z.string(),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  })).min(1, "Please request at least one item."),
});

type RequestStockFormProps = {
  selectedItems: ItemForRequest[];
  onSubmit: (items: { itemId: string; quantity: number }[]) => void;
  onCancel: () => void;
  onAddItem: () => void;
}

export function RequestStockForm({ selectedItems, onSubmit, onCancel, onAddItem }: RequestStockFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: selectedItems.map(item => ({
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
      })),
    },
  })
  
  // This effect ensures the form is updated if selectedItems changes (e.g. adding more manually)
  React.useEffect(() => {
    form.reset({
        items: selectedItems.map(item => ({
            itemId: item.id,
            itemName: item.name,
            quantity: form.getValues(`items.${form.getValues('items').findIndex(i => i.itemId === item.id)}.quantity`) || 1,
        }))
    });
  }, [selectedItems, form]);


  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values.items);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="w-40 text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.itemName}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" className="text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter className="sm:justify-between">
           <Button type="button" variant="ghost" onClick={onAddItem}>
                <Plus className="mr-2 h-4 w-4"/>
                Add More Items
            </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  )
}
