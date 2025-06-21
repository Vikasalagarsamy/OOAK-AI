"use client"

import React, { useState, useEffect } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createLead } from "@/actions/lead-actions"
import { getCompanies, getBranches } from "@/actions/company-actions"
import { getActiveLeadSources } from "@/actions/lead-source-actions"
import { 
  Loader2, 
  Building2, 
  Phone, 
  FileText, 
  Save, 
  Info, 
  AlertCircle, 
  MapPin,
  Zap,
  RefreshCw,
  CheckCircle,
  Users,
  MapPin as LocationIcon,
  Database
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ⚡ ULTRA-FAST CREATE LEAD FORM COMPONENT
 * 
 * NOW USING 100% POSTGRESQL SERVER ACTIONS
 * - Zero Supabase dependencies
 * - Direct PostgreSQL queries via server actions
 * - Real-time performance tracking
 * - ALL functionality preserved
 * - Enhanced error handling and validation
 * - Clean professional layout
 */

// Form validation schema (preserved from original)
const formSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  branch_id: z.string().optional(),
  contact_name: z.string().min(1, "Contact name is required").max(100, "Contact name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  country_code: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone number is required"),
  is_whatsapp: z.boolean(),
  has_separate_whatsapp: z.boolean(),
  whatsapp_country_code: z.string().optional(),
  whatsapp_number: z.string().optional(),
  lead_source: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Company {
  id: number
  name: string
  company_code: string
  is_active: boolean
}

interface Branch {
  id: number
  name: string
  company_id: number
  address?: string
  is_active: boolean
}

interface LeadSource {
  id: number
  name: string
  description?: string
  is_active: boolean
}

interface CreateLeadData {
  companies: Company[]
  branches: Branch[]
  leadSources: LeadSource[]
  stats: {
    totalCompanies: number
    totalBranches: number
    totalLeadSources: number
    activeLeadSources: number
  }
  responseTime?: number
  source?: string
  error?: string
}

// Comprehensive list of countries with codes and flags
const COUNTRY_CODES = [
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+501", country: "Belize", flag: "🇧🇿" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+975", country: "Bhutan", flag: "🇧🇹" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+673", country: "Brunei", flag: "🇧🇳" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "Congo (DRC)", flag: "🇨🇩" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+357", country: "Cyprus", flag: "🇨🇾" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+679", country: "Fiji", flag: "🇫🇯" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },
  { code: "+509", country: "Haiti", flag: "🇭🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+225", country: "Ivory Coast", flag: "🇨🇮" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", country: "Macau", flag: "🇲🇴" },
  { code: "+389", country: "Macedonia", flag: "🇲🇰" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+960", country: "Maldives", flag: "🇲🇻" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+356", country: "Malta", flag: "🇲🇹" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+377", country: "Monaco", flag: "🇲🇨" },
  { code: "+976", country: "Mongolia", flag: "🇲🇳" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+850", country: "North Korea", flag: "🇰🇵" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+507", country: "Panama", flag: "🇵🇦" },
  { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+268", country: "Swaziland", flag: "🇸🇿" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+967", country: "Yemen", flag: "🇾🇪" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" }
].sort((a, b) => a.country.localeCompare(b.country))

export function UltraFastCreateLeadForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useCurrentUser()
  
  // State management
  const [createLeadData, setCreateLeadData] = useState<CreateLeadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const [formError, setFormError] = useState<string | null>(null)

  // Filtered branches based on selected company
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      branch_id: "",
      contact_name: "",
      email: "",
      country_code: "+91", // Default to India
      phone: "",
      is_whatsapp: false,
      has_separate_whatsapp: false,
      whatsapp_country_code: "+91",
      whatsapp_number: "",
      lead_source: "",
      location: "",
      notes: "",
    },
    mode: "onChange",
  })

  const { watch, setValue, register, handleSubmit, formState } = form
  const { errors, isValid } = formState

  const companyId = watch("company_id")
  const hasWhatsapp = watch("is_whatsapp")
  const hasSeparateWhatsapp = watch("has_separate_whatsapp")

  const loadCreateLeadData = async (isManualRefresh = false) => {
    if (!user) {
      setFormError("Authentication required to create leads")
      setLoading(false)
      return
    }

    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('⚡ Loading create lead form data via API...')
      
      // Use API call instead of server actions to avoid authentication issues
      const response = await fetch('/api/sales/create-lead-data')
      
      if (!response.ok) {
        throw new Error('Failed to fetch create lead data')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load create lead data')
      }

      const { companies, branches, leadSources, stats } = result.data
      
      const responseTime = Date.now() - startTime
      
      const formData: CreateLeadData = {
        companies,
        branches,
        leadSources,
        stats,
        responseTime,
        source: 'database'
      }
      
      setCreateLeadData(formData)
      setLoadTime(responseTime)
      setDataSource('database')
      
      console.log(`✅ Create lead form data loaded: ${companies.length} companies, ${branches.length} branches, ${leadSources.length} lead sources (${responseTime}ms)`)
      
    } catch (error: any) {
      console.error('❌ Failed to load create lead data:', error)
      setDataSource('fallback')
      setFormError(error.message || 'Failed to load form data')
      
      toast({
        title: "Loading Error",
        description: error.message || "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      if (isManualRefresh) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadCreateLeadData()
    }
  }, [user])

  // Update filtered branches when company changes
  useEffect(() => {
    if (companyId && createLeadData?.branches) {
      const companyIdNum = parseInt(companyId)
      const filtered = createLeadData.branches.filter(branch => 
        branch.company_id === companyIdNum && branch.is_active
      )
      setFilteredBranches(filtered)
      
      // Reset branch selection if current branch is not valid for new company
      const currentBranchId = form.getValues("branch_id")
      if (currentBranchId && !filtered.find(b => b.id.toString() === currentBranchId)) {
        setValue("branch_id", "")
      }
    } else {
      setFilteredBranches([])
    }
  }, [companyId, createLeadData?.branches, setValue, form])

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create leads.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      console.log('🚀 Creating lead via PostgreSQL server action...')
      
      // Convert form data to lead creation format
      const leadData = {
        company_id: parseInt(data.company_id),
        branch_id: data.branch_id ? parseInt(data.branch_id) : undefined,
        contact_name: data.contact_name.trim(),
        email: data.email?.trim() || undefined,
        country_code: data.country_code,
        phone: data.phone.trim(),
        is_whatsapp: data.is_whatsapp,
        whatsapp_country_code: data.has_separate_whatsapp ? data.whatsapp_country_code : data.country_code,
        whatsapp_number: data.has_separate_whatsapp ? data.whatsapp_number?.trim() : data.phone.trim(),
        lead_source: data.lead_source?.trim() || undefined,
        location: data.location?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        status: 'new'
      }

      console.log('📝 Lead data prepared:', { 
        contact: leadData.contact_name, 
        company: leadData.company_id,
        phone: `${leadData.country_code}${leadData.phone}`
      })

      const result = await createLead(leadData)

      if (result.success && result.data) {
        console.log(`✅ Lead created successfully: ${result.data.lead_number}`)
        
        toast({
          title: "✅ Lead Created Successfully",
          description: `Lead ${result.data.lead_number} has been created for ${leadData.contact_name}.`,
        })

        // Reset form
        form.reset()
        
        // Redirect to lead details page (note: singular 'lead', not 'leads')
        router.push(`/sales/lead/${result.data.id}`)
        
      } else {
        const errorMessage = result.message || 'Failed to create lead'
        console.error(`❌ Failed to create lead: ${errorMessage}`)
        setFormError(errorMessage)
        
        toast({
          title: "Creation Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred while creating the lead'
      console.error("❌ Unexpected error creating lead:", error)
      setFormError(errorMessage)
      
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getPerformanceGrade = () => {
    if (loadTime < 500) return { grade: 'A+', color: 'text-green-600', description: 'Excellent' }
    if (loadTime < 1000) return { grade: 'A', color: 'text-green-500', description: 'Great' }
    if (loadTime < 2000) return { grade: 'B', color: 'text-yellow-500', description: 'Good' }
    if (loadTime < 3000) return { grade: 'C', color: 'text-orange-500', description: 'Fair' }
    return { grade: 'D', color: 'text-red-500', description: 'Slow' }
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 animate-pulse" />
            Create Lead
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4 animate-spin" />
              Loading form data from PostgreSQL...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Authentication required state
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to create leads.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (formError && !createLeadData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {formError}
            </AlertDescription>
          </Alert>
          <Button onClick={() => loadCreateLeadData(true)} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const performance = getPerformanceGrade()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create Lead
          </span>
          <Button 
            onClick={() => loadCreateLeadData(true)} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company and Branch Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">
                Company <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={form.watch("company_id")} 
                onValueChange={(value) => setValue("company_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {createLeadData?.companies
                    .filter(company => company.is_active)
                    .map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name} ({company.company_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.company_id && (
                <p className="text-sm text-destructive">{errors.company_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_id">Branch</Label>
              <Select 
                value={form.watch("branch_id") || ""} 
                onValueChange={(value) => setValue("branch_id", value)}
                disabled={!companyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={companyId ? "Select branch" : "Select company first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">
                  Contact Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_name"
                  {...register("contact_name")}
                  placeholder="Enter contact name"
                />
                {errors.contact_name && (
                  <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Phone Information */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country_code">
                  Country Code <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !form.watch("country_code") && "text-muted-foreground",
                        errors.country_code && "border-destructive"
                      )}
                    >
                      {form.watch("country_code") 
                        ? COUNTRY_CODES.find(country => country.code === form.watch("country_code"))?.flag + " " + form.watch("country_code")
                        : "Select code"
                      }
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        {COUNTRY_CODES.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={`${country.country} ${country.code}`}
                            onSelect={() => {
                              setValue("country_code", country.code)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                country.code === form.watch("country_code") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.country}</span>
                              <span className="text-muted-foreground">({country.code})</span>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.country_code && (
                  <p className="text-sm text-destructive">{errors.country_code.message}</p>
                )}
              </div>

              <div className="col-span-2 md:col-span-3 space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* WhatsApp Options */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_whatsapp"
                  checked={hasWhatsapp}
                  onCheckedChange={(checked) => setValue("is_whatsapp", checked as boolean)}
                />
                <Label htmlFor="is_whatsapp">This phone number has WhatsApp</Label>
              </div>

              {hasWhatsapp && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_separate_whatsapp"
                    checked={hasSeparateWhatsapp}
                    onCheckedChange={(checked) => setValue("has_separate_whatsapp", checked as boolean)}
                  />
                  <Label htmlFor="has_separate_whatsapp">Use different number for WhatsApp</Label>
                </div>
              )}

              {hasWhatsapp && hasSeparateWhatsapp && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_country_code">WhatsApp Country Code</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !form.watch("whatsapp_country_code") && "text-muted-foreground"
                          )}
                        >
                          {form.watch("whatsapp_country_code") 
                            ? COUNTRY_CODES.find(country => country.code === form.watch("whatsapp_country_code"))?.flag + " " + form.watch("whatsapp_country_code")
                            : "Select code"
                          }
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {COUNTRY_CODES.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.country} ${country.code}`}
                                onSelect={() => {
                                  setValue("whatsapp_country_code", country.code)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    country.code === form.watch("whatsapp_country_code") ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.country}</span>
                                  <span className="text-muted-foreground">({country.code})</span>
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="col-span-2 md:col-span-3 space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      {...register("whatsapp_number")}
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_source">Lead Source</Label>
                <Select 
                  value={form.watch("lead_source") || ""} 
                  onValueChange={(value) => setValue("lead_source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {createLeadData?.leadSources
                      .filter(source => source.is_active)
                      .map((source) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Enter any additional notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !isValid}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 