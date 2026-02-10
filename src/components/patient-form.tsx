
"use client"

import * as React from "react"
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
import type { Patient } from "@/lib/types"
import { useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Textarea } from "./ui/textarea"


const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  dateOfBirth: z.date({ required_error: "Date of birth is required."}),
  address: z.string().optional(),
});


type PatientFormProps = {
  patient?: Patient | null;
  onSubmit: (data: Omit<Patient, 'id'>) => Promise<void>;
}

export function PatientForm({ patient, onSubmit }: PatientFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (patient) {
        form.reset({
            name: patient.name,
            dateOfBirth: new Date(patient.dateOfBirth),
            address: patient.address || "",
        });
    } else {
        form.reset({
            name: "",
            dateOfBirth: undefined,
            address: "",
        });
    }
  }, [patient, form]);

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit({
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
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
            <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value ? (
                        format(field.value, "PPP")
                        ) : (
                        <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                </PopoverContent>
                </Popover>
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
