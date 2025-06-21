"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { logActivity } from "@/services/activity-service"

// Helper function to generate company code via API
async function generateCompanyCodeViaAPI(): Promise<string> {
  try {
    const response = await fetch('/api/generate-codes/company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate company code')
    }

    return data.companyCode
  } catch (error) {
    console.error('Error calling company code generation API:', error)
    // Fallback to simple generation
    const randomString = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `CC${randomString}`
  }
}

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

interface AddCompanyFormProps {
  onAddCompany: (company: FormValues) => Promise<{ success: boolean; data?: any; error?: any }>
}

export default function AddCompanyForm({ onAddCompany }: AddCompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCodeUnique, setIsCodeUnique] = useState(true)
  const { toast } = useToast()

  // Initialize the form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      email: "",
      phone: "",
      website: "",
      tax_id: "",
      registration_number: "",
      founded_date: "",
      company_code: "",
    },
  })

  // Generate initial company code on component mount
  useEffect(() => {
    const initializeCompanyCode = async () => {
      try {
        const newCode = await generateCompanyCodeViaAPI()
        setValue("company_code", newCode)
        checkCompanyCode(newCode)
      } catch (error) {
        console.error("Error generating initial company code:", error)
      }
    }
    initializeCompanyCode()
  }, [setValue])

  // Check if company code is unique
  const checkCompanyCode = async (code: string) => {
    if (!code) return

    try {
      console.log('🔍 Checking company code uniqueness:', code)
      
      const response = await fetch(`/api/companies/check-code?code=${encodeURIComponent(code)}`)
      const result = await response.json()

      const isUnique = result.success && !result.exists
      setIsCodeUnique(isUnique)
      
      console.log(`${isUnique ? '✅' : '❌'} Company code ${code} is ${isUnique ? 'unique' : 'already in use'}`)
    } catch (error) {
      console.error("❌ Error checking company code:", error)
      setIsCodeUnique(false)
    }
  }

  // Generate a new company code
  const generateNewCode = async () => {
    try {
      const newCode = await generateCompanyCodeViaAPI()
      setValue("company_code", newCode)
      checkCompanyCode(newCode)
    } catch (error) {
      console.error("Error generating new company code:", error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!isCodeUnique) {
      toast({
        title: "Error",
        description: "Company code must be unique. Please generate a new one.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Process the data before submission
      const processedData = {
        ...data,
        // Convert empty date string to null
        founded_date: data.founded_date === "" ? null : data.founded_date,
      }

      const result = await onAddCompany(processedData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Company added successfully!",
        })

        // Log the activity
        if (result.data && result.data[0]) {
          const company = result.data[0]
          await logActivity({
            actionType: "create",
            entityType: "company",
            entityId: company.id.toString(),
            entityName: company.name,
            description: `Company "${company.name}" was added`,
            userName: "Admin User", // You might want to get the actual user name
          })
        }

        // Reset the form and generate a new code
        const newCode = await generateCompanyCodeViaAPI()
        reset({
          name: "",
          address: "",
          email: "",
          phone: "",
          website: "",
          tax_id: "",
          registration_number: "",
          founded_date: "",
          company_code: newCode,
        })
        checkCompanyCode(newCode)
      } else {
        toast({
          title: "Error",
          description: "Failed to add company. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
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
    <Card>
      <CardHeader>
        <CardTitle>Add New Company</CardTitle>
        <CardDescription>Enter the details of the new company</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="company_code" className="text-sm font-medium">
              Company Code *
            </label>
            <div className="flex space-x-2">
              <Input
                id="company_code"
                placeholder="Company code"
                {...register("company_code")}
                className={`flex-1 ${errors.company_code ? "border-red-500" : ""} ${
                  !isCodeUnique ? "border-red-500" : ""
                }`}
              />
              <Button type="button" variant="outline" onClick={generateNewCode}>
                Generate
              </Button>
            </div>
            {errors.company_code && (
              <p className="text-sm text-red-500">{errors.company_code.message}</p>
            )}
            {!isCodeUnique && (
              <p className="text-sm text-red-500">Company code already exists. Please use a different one.</p>
            )}
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
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="company@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">
              Website
            </label>
            <Input
              id="website"
              placeholder="https://company.com"
              {...register("website")}
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="tax_id" className="text-sm font-medium">
                Tax ID
              </label>
              <Input
                id="tax_id"
                placeholder="Tax identification number"
                {...register("tax_id")}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="registration_number" className="text-sm font-medium">
                Registration Number
              </label>
              <Input
                id="registration_number"
                placeholder="Business registration number"
                {...register("registration_number")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="founded_date" className="text-sm font-medium">
              Founded Date
            </label>
            <Input
              id="founded_date"
              type="date"
              {...register("founded_date")}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            disabled={isSubmitting || !isCodeUnique}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Company...
              </>
            ) : (
              "Add Company"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
