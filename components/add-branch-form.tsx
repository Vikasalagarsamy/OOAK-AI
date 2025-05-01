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
import { generateBranchCode } from "@/utils/code-generator"

const formSchema = z.object({
  company_id: z.string({
    required_error: "Please select a company",
  }),
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  is_remote: z.boolean().default(false),
  branch_code: z.string().optional(), // Add this to the schema
})

type FormValues = z.infer<typeof formSchema>

interface AddBranchFormProps {
  companies: Company[]
  onAddBranch: (
    branch: Omit<Branch, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; data?: any; error?: any }>
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
  const branchCode = form.watch("branch_code")

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
          const code = await generateBranchCode(selectedCompany.company_code, watchBranchName)
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
                    <Input placeholder="Downtown Branch" {...field} disabled={noCompanies || noCompanyCode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch code display - completely redesigned */}
            <div>
              <h4 className="text-sm font-medium mb-2">Branch Code</h4>
              <div className="border rounded-md p-2 bg-muted/20">
                {isGeneratingCode ? (
                  <div className="flex items-center py-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Generating...</span>
                  </div>
                ) : branchCode ? (
                  <p className="text-sm py-1">{branchCode}</p>
                ) : (
                  <p className="text-sm text-muted-foreground py-1">Enter branch name to generate code</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Branch code is automatically generated and cannot be edited
              </p>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Address*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="456 Branch St, City, Country"
                      {...field}
                      disabled={noCompanies || noCompanyCode}
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
                      <Input placeholder="branch@company.com" {...field} disabled={noCompanies || noCompanyCode} />
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
                      <Input placeholder="+1 (555) 123-4567" {...field} disabled={noCompanies || noCompanyCode} />
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={noCompanies || noCompanyCode}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Remote Branch</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if this branch operates remotely without a physical location.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting || noCompanies || noCompanyCode || !branchCode || isGeneratingCode}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
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
