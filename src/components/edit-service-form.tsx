
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

type EditServiceFormProps = {
  service: Service;
  onUpdateService: (serviceId: string, service: Omit<Service, 'id'>) => Promise<void>;
}

export function EditServiceForm({ service, onUpdateService }: EditServiceFormProps) {
  const { currency } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      fee: service.fee,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Note: The original service name is used to derive the ID, so we don't allow changing it here
    // to prevent creating a new document instead of updating. If renaming is needed,
    // it would require a more complex delete-and-recreate logic.
    if (values.name !== service.name) {
        form.setError("name", {
            type: "manual",
            message: "Changing the service name is not allowed. To rename, please delete and create a new service.",
        });
        return;
    }
    await onUpdateService(service.id, values);
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
                  <Input placeholder="e.g. Regular Consultation" {...field} disabled />
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
