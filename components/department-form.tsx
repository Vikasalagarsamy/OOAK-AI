"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Department } from "@/types/department"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DepartmentFormProps {
  department?: Department
  onSubmit: (
    department: Omit<Department, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; data?: any; error?: any }>
  onCancel: () => void
}

export default function DepartmentForm({ department, onSubmit, onCancel }: DepartmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const isEditing = !!department

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
    },
  })

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      const result = await onSubmit(data)

      if (result.success) {
        toast({
          title: isEditing ? "Department updated" : "Department added",
          description: `${data.name} has been ${isEditing ? "updated" : "added"} successfully.`,
        })
        form.reset()
        onCancel()
      } else {
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "add"} department. ${result.error?.message || "Please try again."}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} department:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Department" : "Add New Department"}</CardTitle>
        <CardDescription>
          {isEditing ? "Update department details" : "Enter the details of the new department"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Department Name*
            </label>
            <input
              id="name"
              type="text"
              placeholder="Engineering"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Department description (optional)"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : isEditing ? (
              "Update Department"
            ) : (
              "Add Department"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
