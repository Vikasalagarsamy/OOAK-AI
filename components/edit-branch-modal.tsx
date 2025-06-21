"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Branch, Company } from "@/types/company"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
// Removed direct import - using API endpoint instead

// Helper function to generate branch code via API
async function generateBranchCodeViaAPI(companyCode: string, branchName: string, currentBranchCode?: string): Promise<string> {
  try {
    const response = await fetch("/api/generate-codes/branch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyCode,
        branchName,
        currentBranchCode
      })
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || "Failed to generate branch code")
    }

    return data.branchCode
  } catch (error) {
    console.error("Error calling branch code generation API:", error)
    // Fallback to simple generation
    const branchPrefix = branchName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase()
    return `${companyCode}${branchPrefix}`
  }
}

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

interface EditBranchModalProps {
  branch: Branch
  companies: Company[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateBranch: (id: number, branch: Partial<Branch>) => Promise<{ success: boolean; data?: any; error?: any }>
}

export default function EditBranchModal({
  branch,
  companies,
  open,
  onOpenChange,
  onUpdateBranch,
}: EditBranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [companyChanged, setCompanyChanged] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: branch.company_id.toString(),
      name: branch.name,
      address: branch.address,
      email: branch.email || "",
      phone: branch.phone || "",
      is_remote: branch.is_remote || false,
      branch_code: branch.branch_code || "",
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

      // Check if company has changed from original
      if (Number.parseInt(watchCompanyId) !== branch.company_id) {
        setCompanyChanged(true)
      } else {
        setCompanyChanged(false)
      }
    } else {
      setSelectedCompany(null)
    }
  }, [watchCompanyId, companies, branch.company_id])

  // Generate branch code when company or branch name changes
  useEffect(() => {
    const generateCode = async () => {
      // Only regenerate code if company changed or branch name changed and we have a company code
      if (
        selectedCompany?.company_code &&
        watchBranchName &&
        watchBranchName.length >= 2 &&
        (companyChanged || watchBranchName !== branch.name || !branch.branch_code)
      ) {
        setIsGeneratingCode(true)
        try {
          const code = await generateBranchCodeViaAPI(
            selectedCompany.company_code,
            watchBranchName,
            companyChanged ? undefined : branch.branch_code,
          )
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
      } else if (branch.branch_code && !companyChanged && watchBranchName === branch.name) {
        // Keep existing code if nothing changed
        form.setValue("branch_code", branch.branch_code)
      }
    }

    generateCode()
  }, [selectedCompany, watchBranchName, companyChanged, branch.name, branch.branch_code, form, toast])

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
      const result = await onUpdateBranch(branch.id, {
        ...data,
        company_id: Number.parseInt(data.company_id),
        branch_code: data.branch_code,
      })

      if (result.success) {
        toast({
          title: "Branch updated",
          description: `${data.name} has been updated successfully.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update branch. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating branch:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const noCompanyCode = selectedCompany && !selectedCompany.company_code

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>Update the details for {branch.name}. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} {company.company_code ? `(${company.company_code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Downtown Branch" {...field} disabled={noCompanyCode} />
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
                  <p className="text-sm text-muted-foreground py-1">No branch code available</p>
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
                    <Textarea placeholder="456 Branch St, City, Country" {...field} disabled={noCompanyCode} />
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
                      <Input placeholder="branch@company.com" {...field} disabled={noCompanyCode} />
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
                      <Input placeholder="+1 (555) 123-4567" {...field} disabled={noCompanyCode} />
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={noCompanyCode} />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || noCompanyCode || !branchCode || isGeneratingCode}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
