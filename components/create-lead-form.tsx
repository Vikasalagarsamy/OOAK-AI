"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import { generateLeadNumber, ensureUniqueLeadNumber } from "@/utils/lead-number-generator"
import { logActivity } from "@/services/activity-service"
import { checkLeadSourceColumn, addLeadSourceColumn } from "@/actions/schema-actions"
import { getLeadSources } from "@/services/lead-source-service"
import type { LeadSource } from "@/types/lead-source"
import { Loader2, Building2, Phone, FileText, Save, Info, AlertCircle, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Enhanced validation schema with Zod
const formSchema = z
  .object({
    // Company Information
    company_id: z
      .string({
        required_error: "Company is required",
        invalid_type_error: "Company must be selected",
      })
      .min(1, "Company is required"),

    branch_id: z.string().optional(),

    // Client Information
    client_name: z
      .string({
        required_error: "Client name is required",
        invalid_type_error: "Client name must be a string",
      })
      .min(2, "Client name must be at least 2 characters")
      .max(100, "Client name cannot exceed 100 characters")
      .refine((name) => /^[a-zA-Z0-9\s\-'.]+$/.test(name), {
        message: "Client name contains invalid characters",
      }),

    // Email Validation
    email: z.string().email("Invalid email format").optional().or(z.literal("")),

    // Phone Validation
    country_code: z
      .string({
        required_error: "Country code is required",
      })
      .min(1, "Country code is required")
      .refine((code) => /^\+[0-9]{1,4}$/.test(code), {
        message: "Country code must start with + followed by 1-4 digits",
      }),

    phone: z
      .string({
        required_error: "Phone number is required",
      })
      .min(5, "Phone number must be at least 5 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .refine((phone) => /^[0-9\s\-()]+$/.test(phone), {
        message: "Phone number can only contain digits, spaces, hyphens, and parentheses",
      }),

    // WhatsApp Options
    is_whatsapp: z.boolean().default(false),
    has_separate_whatsapp: z.boolean().default(false),

    // WhatsApp Number (conditional validation)
    whatsapp_country_code: z
      .string()
      .optional()
      .refine((code) => !code || /^\+[0-9]{1,4}$/.test(code), {
        message: "WhatsApp country code must start with + followed by 1-4 digits",
      }),

    whatsapp_number: z
      .string()
      .optional()
      .refine((number) => !number || /^[0-9\s\-()]+$/.test(number), {
        message: "WhatsApp number can only contain digits, spaces, hyphens, and parentheses",
      }),

    // Lead Source
    lead_source: z.string().optional(),

    // Location
    location: z.string().optional(),

    // Notes
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  })
  .refine(
    (data) => {
      // If has_separate_whatsapp is true, whatsapp_country_code and whatsapp_number are required
      if (data.is_whatsapp && data.has_separate_whatsapp) {
        return !!data.whatsapp_country_code && !!data.whatsapp_number
      }
      return true
    },
    {
      message: "WhatsApp country code and number are required when using a separate WhatsApp number",
      path: ["whatsapp_number"],
    },
  )

type FormValues = z.infer<typeof formSchema>

interface Company {
  id: number
  name: string
  company_code: string
}

interface Branch {
  id: number
  name: string
  company_id: number
  location?: string
}

export function CreateLeadForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingLeadSources, setLoadingLeadSources] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [hasLeadSourceColumn, setHasLeadSourceColumn] = useState<boolean>(false)
  const [schemaChecked, setSchemaChecked] = useState<boolean>(false)
  const [addingColumn, setAddingColumn] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      branch_id: "",
      client_name: "",
      email: "",
      country_code: "+1", // Default country code
      phone: "",
      is_whatsapp: false,
      has_separate_whatsapp: false,
      whatsapp_country_code: "+1", // Default country code
      whatsapp_number: "",
      lead_source: "",
      location: "",
      notes: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  })

  const { watch, setValue, register, handleSubmit, formState, trigger } = form
  const { errors, isValid, isDirty } = formState

  const companyId = watch("company_id")
  const branchId = watch("branch_id")
  const hasWhatsapp = watch("is_whatsapp")
  const hasSeparateWhatsapp = watch("has_separate_whatsapp")
  const countryCode = watch("country_code")

  // Check schema and fetch data on component mount
  useEffect(() => {
    checkSchema()
    fetchCompanies()
    fetchBranches()
    fetchLeadSources()
  }, [])

  // Check database schema to find if lead_source column exists
  const checkSchema = async () => {
    try {
      // First try the checkLeadSourceColumn function
      let columnExists = false
      try {
        columnExists = await checkLeadSourceColumn()
        console.log("Lead source column exists:", columnExists)
      } catch (checkError) {
        console.error("Error with checkLeadSourceColumn:", checkError)

        // Fallback: Try a direct query to the leads table
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from("leads").select("lead_source").limit(1)

          // If this query succeeds without error, the column exists
          columnExists = !error
        } catch (directError) {
          console.error("Error with direct query:", directError)

          // Last resort: Assume the column doesn't exist and let the user add it
          columnExists = false
        }
      }

      setHasLeadSourceColumn(columnExists)
      setSchemaChecked(true)
    } catch (error) {
      console.error("Error checking schema:", error)
      setFormError(`Error checking database schema: ${error instanceof Error ? error.message : String(error)}`)
      setSchemaChecked(true)
      setHasLeadSourceColumn(false) // Assume column doesn't exist on error
    }
  }

  // Add lead_source column if it doesn't exist
  const handleAddLeadSourceColumn = async () => {
    setAddingColumn(true)
    setFormError(null)

    try {
      const success = await addLeadSourceColumn()
      if (success) {
        toast({
          title: "Success",
          description: "Lead source column added successfully!",
        })
        setHasLeadSourceColumn(true)
        // Refresh lead sources after adding the column
        fetchLeadSources()
      } else {
        toast({
          title: "Error",
          description: "Failed to add lead source column. Please contact your administrator.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding lead source column:", error)
      setFormError(`Failed to add lead source column: ${error instanceof Error ? error.message : String(error)}`)
      toast({
        title: "Error",
        description: `Failed to add lead source column: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setAddingColumn(false)
    }
  }

  // Filter branches when company changes
  useEffect(() => {
    if (companyId) {
      const filtered = branches.filter((branch) => branch.company_id === Number.parseInt(companyId, 10))
      setFilteredBranches(filtered)
    } else {
      setFilteredBranches([])
    }
  }, [companyId, branches])

  // Set location when branch changes
  useEffect(() => {
    if (branchId) {
      const selectedBranch = branches.find((branch) => branch.id === Number.parseInt(branchId, 10))
      if (selectedBranch && selectedBranch.location) {
        setValue("location", selectedBranch.location)
      }
    }
  }, [branchId, branches, setValue])

  // Set whatsapp country code when country code changes and no separate whatsapp
  useEffect(() => {
    if (!hasSeparateWhatsapp) {
      setValue("whatsapp_country_code", countryCode)
    }
  }, [countryCode, hasSeparateWhatsapp, setValue])

  // Trigger validation when WhatsApp options change
  useEffect(() => {
    if (isDirty) {
      trigger(["whatsapp_country_code", "whatsapp_number"])
    }
  }, [hasWhatsapp, hasSeparateWhatsapp, trigger, isDirty])

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("id, name, company_code").order("name")

      if (error) {
        throw error
      }

      setCompanies(data || [])
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast({
        title: "Error",
        description: "Failed to fetch companies. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCompanies(false)
    }
  }

  const fetchBranches = async () => {
    setLoadingBranches(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("branches").select("id, name, company_id, location").order("name")

      if (error) {
        throw error
      }

      setBranches(data || [])
    } catch (error) {
      console.error("Error fetching branches:", error)
      toast({
        title: "Error",
        description: "Failed to fetch branches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingBranches(false)
    }
  }

  const fetchLeadSources = async () => {
    setLoadingLeadSources(true)
    try {
      // Use the service function to get lead sources
      const sources = await getLeadSources()
      console.log("Lead sources fetched:", sources)

      // Filter to only show active lead sources
      const activeSources = sources.filter((source) => source.is_active)
      setLeadSources(activeSources)
    } catch (error) {
      console.error("Error fetching lead sources:", error)
      toast({
        title: "Error",
        description: "Failed to fetch lead sources. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingLeadSources(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Generate a unique lead number
      let leadNumber = await generateLeadNumber()
      leadNumber = await ensureUniqueLeadNumber(leadNumber)

      // Prepare the lead data
      const leadData: Record<string, any> = {
        lead_number: leadNumber,
        company_id: Number.parseInt(data.company_id, 10),
        branch_id: data.branch_id ? Number.parseInt(data.branch_id, 10) : null,
        client_name: data.client_name.trim(),
        email: data.email ? data.email.trim().toLowerCase() : null,
        country_code: data.country_code.trim(),
        phone: data.phone.trim(),
        is_whatsapp: data.is_whatsapp,
        has_separate_whatsapp: data.has_separate_whatsapp,
        whatsapp_country_code: data.has_separate_whatsapp
          ? data.whatsapp_country_code?.trim()
          : data.country_code.trim(),
        whatsapp_number: data.has_separate_whatsapp
          ? data.whatsapp_number?.trim()
          : data.is_whatsapp
            ? data.phone.trim()
            : null,
        location: data.location ? data.location.trim() : null,
        notes: data.notes ? data.notes.trim() : null,
        status: "UNASSIGNED",
      }

      // Handle lead source - properly set both lead_source and lead_source_id
      if (hasLeadSourceColumn && data.lead_source && data.lead_source !== "none") {
        // Convert the string ID to a number
        const sourceId = Number.parseInt(data.lead_source, 10)

        // Find the source from the ID
        const selectedSource = leadSources.find((source) => source.id === sourceId)

        if (selectedSource) {
          // Set both the ID and name
          leadData.lead_source_id = sourceId
          leadData.lead_source = selectedSource.name
        } else {
          console.warn(`Lead source with ID ${data.lead_source} not found`)
          // Set a default or handle the error condition
          leadData.lead_source = "Unknown"
        }
      }

      // Debug the lead data before submission
      console.log("Lead data being submitted:", JSON.stringify(leadData, null, 2))
      setDebugInfo(JSON.stringify(leadData, null, 2))

      // Insert the lead
      const { data: insertedLead, error } = await supabase.from("leads").insert(leadData).select().single()

      if (error) {
        throw error
      }

      // Log the inserted lead data
      console.log("Inserted lead data:", JSON.stringify(insertedLead, null, 2))

      // Get the lead source name for the activity log
      const leadSource = leadSources.find((source) => source.id.toString() === data.lead_source)
      const leadSourceName = leadSource ? leadSource.name : "Unknown source"

      // Log the activity
      await logActivity({
        actionType: "create",
        entityType: "lead",
        entityId: insertedLead.id.toString(),
        entityName: leadNumber,
        description: `Created new lead ${leadNumber} for ${data.client_name}${
          leadSource ? ` (Source: ${leadSourceName})` : ""
        }`,
        userName: "Current User", // Replace with actual user name when available
      })

      toast({
        title: "Success",
        description: `Lead ${leadNumber} created successfully!`,
      })

      // Redirect to the unassigned leads page
      router.push("/sales/unassigned-lead")
    } catch (error) {
      console.error("Error creating lead:", error)
      setFormError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Error",
        description: `Failed to create lead: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show a message if we're still checking the schema
  if (!schemaChecked) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">Checking database schema...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Create New Lead</CardTitle>
          </div>
          <CardDescription>Enter the details to create a new lead</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Schema Status */}
          {!hasLeadSourceColumn && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Lead source tracking is not available. The required database column could not be found or created.
                </span>
                <Button variant="outline" size="sm" onClick={handleAddLeadSourceColumn} disabled={addingColumn}>
                  {addingColumn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Column...
                    </>
                  ) : (
                    "Fix Lead Source Column"
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Company and Branch Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id" className={errors.company_id ? "text-destructive" : ""}>
                  Company <span className="text-destructive">*</span>
                </Label>
                <Select
                  disabled={loading || loadingCompanies}
                  value={companyId}
                  onValueChange={(value) => {
                    setValue("company_id", value, { shouldValidate: true })
                    setValue("branch_id", "") // Reset branch when company changes
                    setValue("location", "") // Reset location when company changes
                  }}
                >
                  <SelectTrigger id="company_id" className={errors.company_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCompanies ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : companies.length === 0 ? (
                      <SelectItem value="no-companies" disabled>
                        No companies found
                      </SelectItem>
                    ) : (
                      companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} ({company.company_code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.company_id && <p className="text-sm text-destructive">{errors.company_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch</Label>
                <Select
                  disabled={loading || loadingBranches || !companyId}
                  value={form.watch("branch_id")}
                  onValueChange={(value) => setValue("branch_id", value, { shouldValidate: true })}
                >
                  <SelectTrigger id="branch_id">
                    <SelectValue placeholder={companyId ? "Select a branch" : "Select a company first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingBranches ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : !companyId ? (
                      <SelectItem value="no-company" disabled>
                        Select a company first
                      </SelectItem>
                    ) : filteredBranches.length === 0 ? (
                      <SelectItem value="no-branches" disabled>
                        No branches found for this company
                      </SelectItem>
                    ) : (
                      filteredBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.branch_id && <p className="text-sm text-destructive">{errors.branch_id.message}</p>}
              </div>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            <div className="space-y-2">
              <Label htmlFor="client_name" className={errors.client_name ? "text-destructive" : ""}>
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client_name"
                placeholder="Enter client name"
                {...register("client_name")}
                className={errors.client_name ? "border-destructive" : ""}
                disabled={loading}
                aria-invalid={errors.client_name ? "true" : "false"}
              />
              {errors.client_name && <p className="text-sm text-destructive">{errors.client_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
                disabled={loading}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    id="country_code"
                    placeholder="+1"
                    {...register("country_code")}
                    className={errors.country_code ? "border-destructive" : ""}
                    disabled={loading}
                    aria-invalid={errors.country_code ? "true" : "false"}
                  />
                  {errors.country_code && <p className="text-sm text-destructive">{errors.country_code.message}</p>}
                </div>
                <div className="col-span-2">
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                    disabled={loading}
                    aria-invalid={errors.phone ? "true" : "false"}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_whatsapp"
                checked={hasWhatsapp}
                onCheckedChange={(checked) => setValue("is_whatsapp", checked as boolean, { shouldValidate: true })}
                disabled={loading}
              />
              <Label htmlFor="is_whatsapp" className="cursor-pointer">
                This number is on WhatsApp
              </Label>
            </div>

            {hasWhatsapp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_separate_whatsapp"
                  checked={hasSeparateWhatsapp}
                  onCheckedChange={(checked) =>
                    setValue("has_separate_whatsapp", checked as boolean, { shouldValidate: true })
                  }
                  disabled={loading}
                />
                <Label htmlFor="has_separate_whatsapp" className="cursor-pointer">
                  Use a different number for WhatsApp
                </Label>
              </div>
            )}

            {hasWhatsapp && hasSeparateWhatsapp && (
              <div className="space-y-2">
                <Label className={errors.whatsapp_country_code ? "text-destructive" : ""}>
                  WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      id="whatsapp_country_code"
                      placeholder="+1"
                      {...register("whatsapp_country_code")}
                      className={errors.whatsapp_country_code ? "border-destructive" : ""}
                      disabled={loading}
                      aria-invalid={errors.whatsapp_country_code ? "true" : "false"}
                    />
                    {errors.whatsapp_country_code && (
                      <p className="text-sm text-destructive">{errors.whatsapp_country_code.message}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="whatsapp_number"
                      placeholder="WhatsApp number"
                      {...register("whatsapp_number")}
                      className={errors.whatsapp_number ? "border-destructive" : ""}
                      disabled={loading}
                      aria-invalid={errors.whatsapp_number ? "true" : "false"}
                    />
                    {errors.whatsapp_number && (
                      <p className="text-sm text-destructive">{errors.whatsapp_number.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lead Source Section - Only show if the column exists */}
            {hasLeadSourceColumn && (
              <div className="space-y-2">
                <Label
                  htmlFor="lead_source"
                  className={`flex items-center gap-2 ${errors.lead_source ? "text-destructive" : ""}`}
                >
                  <Info className="h-4 w-4" />
                  Lead Source
                </Label>
                <Select
                  disabled={loading || loadingLeadSources}
                  value={form.watch("lead_source")}
                  onValueChange={(value) => setValue("lead_source", value, { shouldValidate: true })}
                >
                  <SelectTrigger id="lead_source" className={errors.lead_source ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingLeadSources ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : leadSources.length === 0 ? (
                      <SelectItem value="no-sources" disabled>
                        No lead sources found
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="none">Not specified</SelectItem>
                        {leadSources.map((source) => (
                          <SelectItem key={source.id} value={source.id.toString()}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.lead_source && <p className="text-sm text-destructive">{errors.lead_source.message}</p>}
                {leadSources.length === 0 && !loadingLeadSources && (
                  <p className="text-sm text-amber-600">
                    No active lead sources found. Please add lead sources in the Lead Sources management page.
                  </p>
                )}
              </div>
            )}

            {/* Location Section */}
            <div className="space-y-2">
              <Label
                htmlFor="location"
                className={`flex items-center gap-2 ${errors.location ? "text-destructive" : ""}`}
              >
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Enter location"
                {...register("location")}
                className={errors.location ? "border-destructive" : ""}
                disabled={loading}
                aria-invalid={errors.location ? "true" : "false"}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes" className={errors.notes ? "text-destructive" : ""}>
              Lead Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes about this lead"
              {...register("notes")}
              className={`min-h-[100px] ${errors.notes ? "border-destructive" : ""}`}
              disabled={loading}
              aria-invalid={errors.notes ? "true" : "false"}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded border text-xs">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-semibold">Debug Information</span>
              </div>
              <pre className="whitespace-pre-wrap overflow-auto">{debugInfo}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isValid || (hasLeadSourceColumn && leadSources.length === 0)}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Lead...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Lead
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
