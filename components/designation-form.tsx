"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Designation } from "@/types/designation"
import type { Department } from "@/types/department"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(2, "Designation name must be at least 2 characters"),
  department_id: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DesignationFormProps {
  designation?: Designation
  departments: Department[]
  onSubmit: (
    designation: Omit<Designation, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; data?: any; error?: any }>
  onCancel: () => void
}

export default function DesignationForm({ designation, departments, onSubmit, onCancel }: DesignationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const isEditing = !!designation

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: designation?.name || "",
      department_id: designation?.department_id ? designation.department_id.toString() : undefined,
      description: designation?.description || "",
    },
  })

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      const formattedData = {
        ...data,
        department_id: data.department_id ? Number.parseInt(data.department_id) : undefined,
      }

      const result = await onSubmit(formattedData)

      if (result.success) {
        toast({
          title: isEditing ? "Designation updated" : "Designation added",
          description: `${data.name} has been ${isEditing ? "updated" : "added"} successfully.`,
        })
        form.reset()
        onCancel()
      } else {
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "add"} designation. ${result.error?.message || "Please try again."}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} designation:`, error)
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
        <CardTitle>{isEditing ? "Edit Designation" : "Add New Designation"}</CardTitle>
        <CardDescription>
          {isEditing ? "Update designation details" : "Enter the details of the new designation"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Designation Name*
            </label>
            <Input
              id="name"
              placeholder="Software Engineer"
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="department_id" className="text-sm font-medium">
              Department
            </label>
            <Select
              onValueChange={(value) => form.setValue("department_id", value)}
              defaultValue={form.getValues("department_id")}
            >
              <SelectTrigger id="department_id" className="w-full">
                <SelectValue placeholder="Select a department (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id.toString()}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department_id && (
              <p className="text-sm text-red-500">{form.formState.errors.department_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Designation description (optional)"
              {...form.register("description")}
              className={form.formState.errors.description ? "border-red-500" : ""}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            <span>Cancel</span>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{isEditing ? "Updating..." : "Adding..."}</span>
              </>
            ) : (
              <span>{isEditing ? "Update Designation" : "Add Designation"}</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
