
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Service } from "@/lib/types"
import { useSettings } from "@/context/settings-provider"

const formSchema = z.object({
  name: z.string().min(3, { message: "Service name must be at least 3 characters." }),
  fee: z.coerce.number().positive({ message: "Fee must be a positive number." }),
})

type AddServiceFormProps = {
  onAddService: (service: Omit<Service, 'id'>) => Promise<void>;
}

export function AddServiceForm({ onAddService }: AddServiceFormProps) {
  const { currency } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fee: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await onAddService(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Regular Consultation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee ({currency})</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g. 50.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding...' : 'Add Service'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
