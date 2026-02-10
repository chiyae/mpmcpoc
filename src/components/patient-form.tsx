
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
import type { Patient } from "@/lib/types"
import { format, parse } from "date-fns"
import { Textarea } from "./ui/textarea"


const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  dateOfBirth: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Date must be in DD/MM/YYYY format.")
    .refine((dateString) => {
      try {
        const date = parse(dateString, "dd/MM/yyyy", new Date());
        // `parse` can be lenient. This check ensures the date is real,
        // e.g. it rejects "32/01/2023"
        return format(date, 'dd/MM/yyyy') === dateString;
      } catch {
        return false;
      }
    }, "Please enter a valid date."),
  address: z.string().optional(),
});


type PatientFormProps = {
  patient?: Patient | null;
  onSubmit: (data: Omit<Patient, 'id'>) => Promise<void>;
}

export function PatientForm({ patient, onSubmit }: PatientFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      dateOfBirth: "",
    }
  });

  // When the patient prop changes (e.g., editing a different patient in the same dialog),
  // we need to reset the form with the new values.
  React.useEffect(() => {
    form.reset({
      name: patient?.name || "",
      address: patient?.address || "",
      dateOfBirth: patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd/MM/yyyy") : "",
    });
  }, [patient, form]);

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit({
        ...values,
        dateOfBirth: parse(values.dateOfBirth, 'dd/MM/yyyy', new Date()).toISOString(),
    });
  }

  const isEditing = !!patient;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                    <Input placeholder="DD/MM/YYYY" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Address (Optional)</FormLabel>
                <FormControl>
                <Textarea placeholder="123 Main St, Anytown..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Registering...') : (isEditing ? 'Save Changes' : 'Register Patient')}
            </Button>
        </div>
      </form>
    </Form>
  )
}
