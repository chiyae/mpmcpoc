
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
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
import { useSettings } from "@/context/settings-provider"
import { useEffect } from "react"

const formSchema = z.object({
  genericName: z.string().min(2, "Generic name is required."),
  brandName: z.string().optional(),
  formulation: z.enum(["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Lotion", "Medical Supply", "Consumable"]),
  strengthValue: z.coerce.number().optional(),
  strengthUnit: z.string().optional(),
  concentrationValue: z.coerce.number().optional(),
  concentrationUnit: z.string().optional(),
  packageSizeValue: z.coerce.number().optional(),
  packageSizeUnit: z.string().optional(),
  category: z.enum(["Medicine", "Medical Supply", "Consumable"]),
  unitOfMeasure: z.string().min(1, "Unit of measure is required."),
  reorderLevel: z.coerce.number().int().nonnegative(),
  unitCost: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
}).refine(data => {
    if (["Tablet", "Capsule"].includes(data.formulation)) {
        return !!data.strengthValue && !!data.strengthUnit;
    }
    return true;
}, {
    message: "Strength and unit are required for Tablets/Capsules.",
    path: ["strengthValue"],
}).refine(data => {
    if (["Syrup", "Injection", "Cream", "Lotion"].includes(data.formulation)) {
        return !!data.packageSizeValue && !!data.packageSizeUnit;
    }
    return true;
}, {
    message: "Package size and unit are required for this formulation.",
    path: ["packageSizeValue"],
}).refine(data => {
    if (["Syrup", "Injection"].includes(data.formulation)) {
        return !!data.concentrationValue && !!data.concentrationUnit;
    }
    return true;
}, {
    message: "Concentration and unit are required for Syrups/Injections.",
    path: ["concentrationValue"],
});


type ItemFormProps = {
  item?: Item | null;
  onSubmit: (data: Omit<Item, 'id' | 'itemCode'>) => Promise<void>;
}

export function ItemForm({ item, onSubmit }: ItemFormProps) {
  const { currency } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genericName: "",
      brandName: "",
      unitOfMeasure: "",
      reorderLevel: 0,
      unitCost: 0,
      sellingPrice: 0,
      strengthValue: '' as any,
      strengthUnit: "",
      concentrationValue: '' as any,
      concentrationUnit: "",
      packageSizeValue: '' as any,
      packageSizeUnit: "",
    },
  })

  useEffect(() => {
    if (item) {
        form.reset({
            genericName: item.genericName,
            brandName: item.brandName || "",
            formulation: item.formulation,
            strengthValue: item.strengthValue || '' as any,
            strengthUnit: item.strengthUnit || "",
            concentrationValue: item.concentrationValue || '' as any,
            concentrationUnit: item.concentrationUnit || "",
            packageSizeValue: item.packageSizeValue || '' as any,
            packageSizeUnit: item.packageSizeUnit || "",
            category: item.category,
            unitOfMeasure: item.unitOfMeasure,
            reorderLevel: item.reorderLevel,
            unitCost: item.unitCost,
            sellingPrice: item.sellingPrice,
        });
    } else {
        form.reset();
    }
  }, [item, form]);

  const formulation = useWatch({
    control: form.control,
    name: "formulation",
  });

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit(values);
    if (!item) { // only reset if it's a new item form
        form.reset();
    }
  }

  const isSolid = formulation === 'Tablet' || formulation === 'Capsule';
  const isLiquid = formulation === 'Syrup' || formulation === 'Injection';
  const isTopical = formulation === 'Cream' || formulation === 'Lotion';
  const isEditing = !!item;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="genericName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generic Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Paracetamol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brandName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Panadol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="formulation"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Formulation</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a formulation" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Tablet">Tablet</SelectItem>
                            <SelectItem value="Capsule">Capsule</SelectItem>
                            <SelectItem value="Syrup">Syrup</SelectItem>
                            <SelectItem value="Injection">Injection</SelectItem>
                            <SelectItem value="Cream">Cream</SelectItem>
                            <SelectItem value="Lotion">Lotion</SelectItem>
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
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
        </div>

        {(isSolid || isTopical) && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="strengthValue"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Strength</FormLabel>
                        <FormControl><Input type="number" placeholder="500" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="strengthUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="mg" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        {isLiquid && (
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="concentrationValue"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Concentration</FormLabel>
                        <FormControl><Input type="number" placeholder="250" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="concentrationUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="mg/5ml" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        {(isLiquid || isTopical) && (
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="packageSizeValue"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Package Size</FormLabel>
                        <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="packageSizeUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="ml" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. tablets, bottle" {...field} />
                </FormControl>
                 <FormDescription>The base unit for transactions.</FormDescription>
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
                <FormLabel>Unit Cost ({currency})</FormLabel>
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
                <FormLabel>Selling Price ({currency})</FormLabel>
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
              {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Item')}
            </Button>
        </div>
      </form>
    </Form>
  )
}
