"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { query } from "@/lib/postgresql-client"
import type { Company } from "@/types/company"
import { logActivity } from "@/services/activity-service"

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  tax_id: z.string().optional().or(z.literal("")),
  registration_number: z.string().optional().or(z.literal("")),
  founded_date: z.string().optional().or(z.literal("")),
  company_code: z.string().min(3, { message: "Company code must be at least 3 characters" }),
})

type FormValues = z.infer<typeof formSchema>

interface EditCompanyModalProps {
  company: Company
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateCompany: (id: number, updates: Partial<Company>) => Promise<{ success: boolean; data?: any; error?: any }>
}

export default function EditCompanyModal({ company, open, onOpenChange, onUpdateCompany }: EditCompanyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCodeUnique, setIsCodeUnique] = useState(true)
  const { toast } = useToast()

  // Initialize the form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company.name,
      address: company.address,
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      tax_id: company.tax_id || "",
      registration_number: company.registration_number || "",
      founded_date: company.founded_date || "",
      company_code: company.company_code || "",
    },
  })

  // Check if company code is unique
  const checkCompanyCode = async (code: string) => {
    if (!code || code === company.company_code) {
      setIsCodeUnique(true)
      return
    }

    try {
      const result = await query(
        "SELECT id FROM companies WHERE company_code = $1 LIMIT 1",
        [code]
      )

      setIsCodeUnique(result.rows.length === 0)
      console.log(`🔍 Company code "${code}" unique: ${result.rows.length === 0}`)
    } catch (error) {
      console.error("❌ Error checking company code:", error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Process the data before submission
      const processedData = {
        ...data,
        // Convert empty date string to null
        founded_date: data.founded_date === "" ? null : data.founded_date,
      }

      const result = await onUpdateCompany(company.id, processedData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Company updated successfully!",
        })

        // Log the activity
        if (result.data && result.data[0]) {
          const updatedCompany = result.data[0]
          await logActivity({
            actionType: "update",
            entityType: "company",
            entityId: updatedCompany.id.toString(),
            entityName: updatedCompany.name,
            description: `Company "${updatedCompany.name}" was updated`,
            userName: "Admin User", // You might want to get the actual user name
          })
        }

        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update company. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating company:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>Update the company details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Company Name *
              </label>
              <Input
                id="name"
                placeholder="Enter company name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address *
              </label>
              <Textarea
                id="address"
                placeholder="Enter company address"
                {...register("address")}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter company email"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input id="phone" placeholder="Enter company phone" {...register("phone")} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="website"
                placeholder="https://example.com"
                {...register("website")}
                className={errors.website ? "border-red-500" : ""}
              />
              {errors.website && <p className="text-red-500 text-xs">{errors.website.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tax_id" className="text-sm font-medium">
                  Tax ID
                </label>
                <Input id="tax_id" placeholder="Enter tax ID" {...register("tax_id")} />
              </div>

              <div className="space-y-2">
                <label htmlFor="registration_number" className="text-sm font-medium">
                  Registration Number
                </label>
                <Input
                  id="registration_number"
                  placeholder="Enter registration number"
                  {...register("registration_number")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="founded_date" className="text-sm font-medium">
                Founded Date
              </label>
              <Input id="founded_date" type="date" {...register("founded_date")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="company_code" className="text-sm font-medium">
                Company Code *
              </label>
              <Input
                id="company_code"
                placeholder="Company code"
                {...register("company_code")}
                className={!isCodeUnique || errors.company_code ? "border-red-500" : ""}
                onBlur={(e) => checkCompanyCode(e.target.value)}
              />
              {errors.company_code && <p className="text-red-500 text-xs">{errors.company_code.message}</p>}
              {!isCodeUnique && <p className="text-red-500 text-xs">This company code is already in use</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isCodeUnique}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
