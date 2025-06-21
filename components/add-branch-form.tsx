"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Company, Branch } from "@/types/company"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  company_id: z.string({
    required_error: "Please select a company",
  }),
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  is_remote: z.boolean().default(false),
  branch_code: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddBranchFormProps {
  companies: Company[]
  onAddBranch: (
    branch: Omit<Branch, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; data?: any; error?: any }>
}

// Helper function to generate branch code via API
async function generateBranchCodeViaAPI(companyCode: string, branchName: string): Promise<string> {
  try {
    const response = await fetch('/api/generate-codes/branch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyCode,
        branchName
      })
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate branch code')
    }

    return data.branchCode
  } catch (error) {
    console.error('Error calling branch code generation API:', error)
    // Fallback to simple generation
    const branchPrefix = branchName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase()
    return `${companyCode}${branchPrefix}`
  }
}

export default function AddBranchForm({ companies, onAddBranch }: AddBranchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      name: "",
      address: "",
      email: "",
      phone: "",
      is_remote: false,
      branch_code: "",
    },
  })

  const watchCompanyId = form.watch("company_id")
  const watchBranchName = form.watch("name")

  // Update selected company when company_id changes
  useEffect(() => {
    if (watchCompanyId) {
      const company = companies.find((c) => c.id.toString() === watchCompanyId)
      setSelectedCompany(company || null)
    } else {
      setSelectedCompany(null)
    }
  }, [watchCompanyId, companies])

  // Generate branch code when company or branch name changes
  useEffect(() => {
    const generateCode = async () => {
      if (selectedCompany?.company_code && watchBranchName && watchBranchName.length >= 2) {
        setIsGeneratingCode(true)
        try {
          const code = await generateBranchCodeViaAPI(selectedCompany.company_code, watchBranchName)
          form.setValue("branch_code", code)
        } catch (error) {
          console.error("Error generating branch code:", error)
          toast({
            title: "Error",
            description: "Failed to generate branch code",
            variant: "destructive",
          })
        } finally {
          setIsGeneratingCode(false)
        }
      } else {
        form.setValue("branch_code", "")
      }
    }

    generateCode()
  }, [selectedCompany, watchBranchName, form, toast])

  const onSubmit = async (data: FormValues) => {
    if (!data.branch_code && selectedCompany?.company_code) {
      toast({
        title: "Error",
        description: "Branch code could not be generated. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onAddBranch({
        ...data,
        company_id: Number.parseInt(data.company_id),
        branch_code: data.branch_code,
      })

      if (result.success) {
        const company = companies.find((c) => c.id === Number.parseInt(data.company_id))

        toast({
          title: "Branch added",
          description: `${data.name} branch has been added to ${company?.name}.`,
        })

        form.reset()
      } else {
        toast({
          title: "Error",
          description: "Failed to add branch. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding branch:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const noCompanies = companies.length === 0
  const noCompanyCode = selectedCompany && !selectedCompany.company_code

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Branch</CardTitle>
        <CardDescription>Add a branch to an existing company</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Company*</FormLabel>
                  <Select disabled={noCompanies} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {noCompanies ? (
                        <SelectItem value="no-companies" disabled>
                          No companies available
                        </SelectItem>
                      ) : (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name} {company.company_code ? `(${company.company_code})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {noCompanies && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please add a company first before adding branches.
                    </p>
                  )}
                  {noCompanyCode && (
                    <p className="text-xs text-destructive mt-1">
                      Selected company does not have a company code. Please add a company code first.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown Office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Auto-generated" 
                        {...field} 
                        readOnly
                        className="bg-muted"
                      />
                      {isGeneratingCode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Automatically generated based on company code and branch name
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the full address of the branch"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="branch@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_remote"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Remote Branch</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Check if this is a remote/virtual branch with no physical location
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || noCompanies || noCompanyCode || isGeneratingCode}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Branch...
                </>
              ) : (
                "Add Branch"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
