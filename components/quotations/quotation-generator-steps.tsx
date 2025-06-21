"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, User, Users, Package, MapPin, Clock, Heart, Plus, Trash2, Copy, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { createQuotation, updateQuotation, type QuotationData, type SavedQuotation } from "@/lib/client-safe-actions"
import { getQuotationData, type QuotationServiceItem, type QuotationDeliverableItem, type QuotationEventType } from "@/actions/quotation-data-actions"
import { getQuotationServices, getQuotationDeliverables } from "@/lib/quotation-utils"

// Types
interface ServiceItem {
  id: number
  servicename: string
  basic_price: number
  premium_price: number
  elite_price: number
  category: string
  package_included: { basic: boolean; premium: boolean; elite: boolean }
  description?: string
}

interface DeliverableItem {
  id: number
  deliverable_name: string
  basic_total_price: number
  premium_total_price: number
  elite_total_price: number
  is_main_deliverable: boolean
  typical_events: string[]
  process_count: number
  service_category: string
  description?: string
}

interface EventDetails {
  id: string
  event_name: string
  event_date: Date
  event_location: string
  venue_name: string
  start_time: string
  end_time: string
  expected_crowd: string
  selected_package: "basic" | "premium" | "elite" | "custom" | "default"
  selected_services: { id: number; quantity: number }[]
  selected_deliverables: { id: number; quantity: number }[]
  service_overrides: Record<number, { basic_price?: number; premium_price?: number; elite_price?: number }>
  package_overrides: Record<number, { basic_price?: number; premium_price?: number; elite_price?: number }>
}

// Event to Service Mapping
const EVENT_SERVICE_MAPPING: Record<string, {
  core: number[]
  optional: number[]
}> = {
  "Wedding Photography": {
    core: [1, 2], // Will be updated based on real data
    optional: [3, 4]
  },
  "Pre-Wedding Shoot": {
    core: [1],
    optional: [2, 3]
  },
  "Engagement Ceremony": {
    core: [1, 2],
    optional: [3, 4]
  },
  "Reception Photography": {
    core: [1, 2],
    optional: [3, 4, 5]
  },
  "Corporate Event": {
    core: [1, 3],
    optional: [2, 4, 5]
  }
}

// Event to Deliverable Mapping
const EVENT_DELIVERABLE_MAPPING: Record<string, {
  main: number[]
  optional: number[]
}> = {
  "Wedding Photography": {
    main: [1, 2], // Will be updated based on real data
    optional: [3, 4, 5]
  },
  "Pre-Wedding Shoot": {
    main: [1],
    optional: [2, 3]
  },
  "Engagement Ceremony": {
    main: [1],
    optional: [2, 6]
  },
  "Reception Photography": {
    main: [1, 5],
    optional: [2, 4]
  },
  "Corporate Event": {
    main: [1, 7],
    optional: [3, 8]
  }
}

const STEPS = [
  { id: 1, title: "Client Details", icon: User },
  { id: 2, title: "Event Details", icon: MapPin },
  { id: 3, title: "Package Selection", icon: Package },
]

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
]

interface QuotationGeneratorStepsProps {
  lead: any
  followUpId: string | null
  editMode?: boolean
  existingQuotation?: SavedQuotation
  aiContext?: any
  taskId?: string | null
}

// Helper function to convert normalized data back to form format
function convertNormalizedToFormData(existingQuotation: SavedQuotation): QuotationData {
  const existingData = existingQuotation.quotation_data
  
  // CRITICAL FIX: For rejected quotations, always use the original quotation_data
  // to ensure consistency between what was submitted and what's shown for editing
  if (existingQuotation.status === 'rejected' || existingQuotation.workflow_status === 'rejected') {
    console.log('🔄 Loading rejected quotation - using original quotation_data for consistency')
    
    return {
      ...existingData,
      events: existingData.events.map(event => ({
        ...event,
        // Convert string date back to Date object for editing
        event_date: typeof event.event_date === 'string' ? new Date(event.event_date) : event.event_date,
        // Ensure arrays exist
        selected_services: event.selected_services || [],
        selected_deliverables: event.selected_deliverables || []
      })),
      // Ensure global arrays exist
      selected_services: existingData.selected_services || [],
      selected_deliverables: existingData.selected_deliverables || []
    }
  }
  
  // For non-rejected quotations, try to use normalized data if available
  const normalizedServices = getQuotationServices(existingQuotation)
  const normalizedDeliverables = getQuotationDeliverables(existingQuotation)
  
  // Convert normalized services to form format (only if we have normalized data)
  const formServices = normalizedServices.length > 0 ? normalizedServices.map(service => ({
    id: service.service_id,
    quantity: service.quantity
  })) : existingData.selected_services || []
  
  // Convert normalized deliverables to form format (only if we have normalized data)
  const formDeliverables = normalizedDeliverables.length > 0 ? normalizedDeliverables.map(deliverable => ({
    id: deliverable.deliverable_id,
    quantity: deliverable.quantity
  })) : existingData.selected_deliverables || []
  
  // Update events with proper data priority
  const updatedEvents = existingData.events.map(event => ({
    ...event,
    // Convert string date back to Date object for editing
    event_date: typeof event.event_date === 'string' ? new Date(event.event_date) : event.event_date,
    // For events, prefer the original event data over normalized data to maintain consistency
    selected_services: event.selected_services || formServices,
    selected_deliverables: event.selected_deliverables || formDeliverables
  }))
  
  return {
    ...existingData,
    events: updatedEvents,
    // Use original data first, then fall back to normalized data
    selected_services: existingData.selected_services || formServices,
    selected_deliverables: existingData.selected_deliverables || formDeliverables
  }
}

export function QuotationGeneratorSteps({ lead, followUpId, editMode, existingQuotation, aiContext, taskId }: QuotationGeneratorStepsProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [sameAsmobile, setSameAsmobile] = useState(true) // WhatsApp same as mobile
  const [sameAsAlternate, setSameAsAlternate] = useState(true) // Alternate WhatsApp same as alternate mobile
  const router = useRouter()
  const [quotationData, setQuotationData] = useState<QuotationData>(() => {
    if (editMode && existingQuotation) {
      return convertNormalizedToFormData(existingQuotation)
    }
    
    // Pre-fill with AI context if available
    const initialClientName = aiContext?.client_name || lead?.client_name || ""
    const initialBrideName = lead?.name || lead?.client_name || aiContext?.client_name || ""
    const initialMobile = lead?.phone || ""
    const initialEmail = lead?.email || ""
    
    return {
      client_name: initialClientName,
      bride_name: initialBrideName,
      groom_name: "",
      mobile: initialMobile,
      mobile_country_code: "+91",
      whatsapp: initialMobile, // Pre-fill with same as mobile
      whatsapp_country_code: "+91",
      alternate_mobile: "",
      alternate_mobile_country_code: "+91",
      alternate_whatsapp: "",
      alternate_whatsapp_country_code: "+91",
      email: initialEmail,
      events: [{
        id: "event-1",
        event_name: "Wedding Event", // Default event type
        event_date: new Date(),
        event_location: "",
        venue_name: "",
        start_time: "10:00",
        end_time: "22:00",
        expected_crowd: "",
        selected_package: "default",
        selected_services: [],
        selected_deliverables: [],
        service_overrides: {},
        package_overrides: {},
      }],
      default_package: "basic",
      selected_services: [],
      selected_deliverables: [],
      service_overrides: {},
      package_overrides: {},
      custom_services: [],
    }
  })

  const [events, setEvents] = useState<Array<{ id: number; name: string }>>([])
  const [services, setServices] = useState<Array<ServiceItem>>([])
  const [deliverables, setDeliverables] = useState<Array<DeliverableItem>>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotationData()
  }, [])

  async function loadQuotationData() {
    try {
      setLoading(true)
      setDataError(null)
      const data = await getQuotationData()
      
      // Check if we got any data
      if (!data.services.length && !data.deliverables.length && !data.eventTypes.length) {
        setDataError("No quotation data available. Please ensure services, deliverables, and events are configured in the system.")
        // Provide fallback data for demo purposes
        setEvents([
          { id: 1, name: "Wedding Photography" },
          { id: 2, name: "Pre-Wedding Shoot" },
          { id: 3, name: "Corporate Event" }
        ])
        setServices([])
        setDeliverables([])
        return
      }
      
      // Set events with fallback
      const eventTypes = data.eventTypes.length > 0 ? data.eventTypes : [
        { id: 1, name: "Wedding Photography" },
        { id: 2, name: "Pre-Wedding Shoot" },
        { id: 3, name: "Corporate Event" }
      ]
      
      setEvents(eventTypes.map(event => ({
        id: event.id,
        name: event.name
      })))
      
      // Set services
      setServices(data.services.map(service => ({
        id: service.id,
        servicename: service.servicename,
        basic_price: service.basic_price,
        premium_price: service.premium_price,
        elite_price: service.elite_price,
        category: service.category,
        package_included: service.package_included,
        description: service.description
      })))
      
      // Set deliverables
      setDeliverables(data.deliverables.map(deliverable => ({
        id: deliverable.id,
        deliverable_name: deliverable.deliverable_name,
        basic_total_price: deliverable.basic_total_price,
        premium_total_price: deliverable.premium_total_price,
        elite_total_price: deliverable.elite_total_price,
        is_main_deliverable: deliverable.is_main_deliverable,
        typical_events: deliverable.typical_events,
        process_count: deliverable.process_count,
        service_category: deliverable.service_category,
        description: deliverable.description
      })))
      
      // Update service and deliverable mappings based on real data
      if (data.services.length > 0 && data.deliverables.length > 0) {
        updateEventMappings(data.services, data.deliverables)
      }
      
    } catch (error) {
      console.error("Error loading quotation data:", error)
      setDataError("Failed to load quotation data. Using fallback configuration.")
      
      // Provide fallback data
      setEvents([
        { id: 1, name: "Wedding Photography" },
        { id: 2, name: "Pre-Wedding Shoot" },
        { id: 3, name: "Corporate Event" }
      ])
      setServices([])
      setDeliverables([])
      
      toast({
        title: "Data Loading Warning",
        description: "Could not load all data from database. Some features may be limited.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function updateEventMappings(services: QuotationServiceItem[], deliverables: QuotationDeliverableItem[]) {
    // Update service mappings based on category
    const photographyServices = services.filter(s => s.category === "Photography").map(s => s.id)
    const videographyServices = services.filter(s => s.category === "Videography").map(s => s.id)
    const technologyServices = services.filter(s => s.category === "Technology").map(s => s.id)
    
    // Update EVENT_SERVICE_MAPPING dynamically
    Object.keys(EVENT_SERVICE_MAPPING).forEach(eventName => {
      if (eventName.includes("Wedding") || eventName.includes("Reception")) {
        EVENT_SERVICE_MAPPING[eventName].core = photographyServices.slice(0, 2)
        EVENT_SERVICE_MAPPING[eventName].optional = [...videographyServices, ...technologyServices]
      } else if (eventName.includes("Pre-Wedding")) {
        EVENT_SERVICE_MAPPING[eventName].core = photographyServices.slice(0, 1)
        EVENT_SERVICE_MAPPING[eventName].optional = [...photographyServices.slice(1), ...videographyServices.slice(0, 1)]
      } else if (eventName.includes("Corporate")) {
        EVENT_SERVICE_MAPPING[eventName].core = [...photographyServices.slice(0, 1), ...videographyServices.slice(0, 1)]
        EVENT_SERVICE_MAPPING[eventName].optional = [...photographyServices.slice(1), ...videographyServices.slice(1), ...technologyServices]
      }
    })
    
    // Update EVENT_DELIVERABLE_MAPPING based on typical events
    deliverables.forEach(deliverable => {
      deliverable.typical_events.forEach(eventName => {
        if (EVENT_DELIVERABLE_MAPPING[eventName]) {
          if (deliverable.is_main_deliverable) {
            if (!EVENT_DELIVERABLE_MAPPING[eventName].main.includes(deliverable.id)) {
              EVENT_DELIVERABLE_MAPPING[eventName].main.push(deliverable.id)
            }
          } else {
            if (!EVENT_DELIVERABLE_MAPPING[eventName].optional.includes(deliverable.id)) {
              EVENT_DELIVERABLE_MAPPING[eventName].optional.push(deliverable.id)
            }
          }
        }
      })
    })
  }

  // Remove the old mock data loading functions
  async function loadEvents() {
    // This function is no longer needed as we load all data together
  }

  async function loadServices() {
    // This function is no longer needed as we load all data together
  }

  async function loadDeliverables() {
    // This function is no longer needed as we load all data together
  }

  const updateQuotationData = (field: keyof QuotationData, value: any) => {
    setQuotationData(prev => ({ ...prev, [field]: value }))
  }

  const updateEventData = (eventId: string, field: keyof EventDetails, value: any) => {
    setQuotationData(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === eventId ? { 
          ...event, 
          [field]: field === 'event_date' && typeof value === 'string' ? new Date(value) : value 
        } : event
      )
    }))
  }

  const addNewEvent = () => {
    const newEventId = `event-${Date.now()}`
    const newEvent: EventDetails = {
      id: newEventId,
      event_name: "",
      event_date: new Date(),
      event_location: "",
      venue_name: "",
      start_time: "",
      end_time: "",
      expected_crowd: "",
      selected_package: "default",
      selected_services: [],
      selected_deliverables: [],
      service_overrides: {},
      package_overrides: {},
    }
    
    setQuotationData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }))
    
    toast({
      title: "Event Added",
      description: `Event ${quotationData.events.length + 1} has been added to your quotation.`,
    })
  }

  const removeEvent = (eventId: string) => {
    if (quotationData.events.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one event is required for the quotation.",
        variant: "destructive",
      })
      return
    }
    
    setQuotationData(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }))
    
    toast({
      title: "Event Removed",
      description: "Event has been removed from the quotation.",
    })
  }

  const duplicateEvent = (eventId: string) => {
    const eventToDuplicate = quotationData.events.find(event => event.id === eventId)
    if (eventToDuplicate) {
      const newEventId = `event-${Date.now()}`
      const duplicatedEvent: EventDetails = {
        ...eventToDuplicate,
        id: newEventId,
        event_name: "",
        event_date: new Date(),
        selected_package: "default",
      }
      
      setQuotationData(prev => ({
        ...prev,
        events: [...prev.events, duplicatedEvent]
      }))
      
      toast({
        title: "Event Duplicated",
        description: "Event details have been copied. Update the event type and date.",
      })
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          quotationData.bride_name.trim() &&
          quotationData.groom_name.trim() &&
          quotationData.mobile.trim() &&
          quotationData.email.trim()
        )
      case 2:
        return quotationData.events.every(event => 
          event.event_name &&
          event.event_date &&
          event.venue_name.trim() &&
          event.start_time &&
          event.end_time
        )
      case 3:
        if (quotationData.default_package === "custom") {
          return quotationData.custom_services.length > 0
        }
        // Check if at least one event has services or deliverables selected
        return quotationData.events.some(event => 
          event.selected_services.length > 0 || 
          event.selected_deliverables.length > 0 ||
          quotationData.selected_services.length > 0 ||
          quotationData.selected_deliverables.length > 0
        )
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    } else {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: "Validation Error", 
        description: "Please complete all required fields.",
        variant: "destructive"
      })
      return
    }
    
    console.log("Submitting quotation data:", quotationData)
    
    try {
      let result
      
      if (editMode && existingQuotation) {
        // Update existing quotation
        result = await updateQuotation(existingQuotation.id.toString(), quotationData, taskId || undefined)
      } else {
        // Create new quotation
        result = await createQuotation(quotationData, lead?.id?.toString(), followUpId || undefined, taskId || undefined)
      }
      
      if (result.success) {
        if ((result as any).requiresApproval) {
          // Quotation edit requires approval
          toast({
            title: "Approval Required",
            description: result.error || "Your quotation changes have been submitted for approval. You will be notified once approved.",
            variant: "default",
          })
          
          // Navigate to quotations list
          router.push("/sales/quotations")
        } else {
          // Normal success flow
          toast({
            title: editMode ? "Quotation Updated" : "Quotation Created",
            description: editMode 
              ? "Your quotation has been successfully updated." 
              : "Your quotation has been successfully created.",
          })
          
          // Navigate to quotations list
          router.push("/sales/quotations")
        }
      } else {
        console.error("Error with quotation:", result.error)
        toast({
          title: "Error",
          description: result.error || `Failed to ${editMode ? 'update' : 'create'} quotation`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error with quotation:", error)
      toast({
        title: "Error",
        description: `Failed to ${editMode ? 'update' : 'create'} quotation`,
        variant: "destructive",
      })
    }
  }

  const getEventPackage = (event: EventDetails) => {
    return event.selected_package === "default" ? quotationData.default_package : event.selected_package
  }

  const getEventServices = (event: EventDetails) => {
    return event.selected_services.length > 0 ? event.selected_services : quotationData.selected_services
  }

  const getEventDeliverableItems = (event: EventDetails) => {
    return event.selected_deliverables.length > 0 ? event.selected_deliverables : quotationData.selected_deliverables
  }

  const calculateServiceTotal = (event: EventDetails) => {
    const packageType = getEventPackage(event)
    const eventServices = getEventServices(event)
    
    return eventServices.reduce((total, serviceItem) => {
      const service = services.find(s => s.id === serviceItem.id)
      if (service) {
        const override = event.service_overrides[serviceItem.id] || quotationData.service_overrides[serviceItem.id]
        const price = override?.[`${packageType}_price` as keyof typeof override] ?? service[`${packageType}_price` as keyof typeof service] ?? 0
        return total + ((price as number) * serviceItem.quantity)
      }
      return total
    }, 0)
  }

  const calculateDeliverableTotal = (event: EventDetails) => {
    const packageType = getEventPackage(event)
    const eventDeliverables = getEventDeliverableItems(event)
    
    return eventDeliverables.reduce((total, deliverableItem) => {
      const deliverable = deliverables.find(d => d.id === deliverableItem.id)
      if (deliverable) {
        const override = event.package_overrides[deliverableItem.id]
        const price = override?.[`${packageType}_total_price` as keyof typeof override] || (deliverable[`${packageType}_total_price` as keyof typeof deliverable] ?? 0)
        return total + ((price as number) * deliverableItem.quantity)
      }
      return total
    }, 0)
  }

  const calculateEventTotal = (event: EventDetails) => {
    const packageType = getEventPackage(event)
    
    if (packageType === "custom") {
      return quotationData.custom_services.reduce((total, service) => total + service.price, 0)
    }

    return calculateServiceTotal(event) + calculateDeliverableTotal(event)
  }

  const calculateTotal = () => {
    return quotationData.events.reduce((total, event) => {
      return total + calculateEventTotal(event)
    }, 0)
  }

  const applyPackageToAllEvents = (packageType: "basic" | "premium" | "elite" | "custom") => {
    setQuotationData(prev => ({
      ...prev,
      default_package: packageType,
      events: prev.events.map(event => ({
        ...event,
        selected_package: "default"
      }))
    }))
    
    toast({
      title: "Package Applied",
      description: `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} package applied to all events.`,
    })
  }

  const getEventSuggestedServices = (eventName: string) => {
    return EVENT_SERVICE_MAPPING[eventName] || { core: [], optional: [] }
  }

  const getEventSuggestedDeliverables = (eventName: string) => {
    return EVENT_DELIVERABLE_MAPPING[eventName] || { main: [], optional: [] }
  }

  const applyCoreServices = (eventId: string, eventName: string) => {
    const suggestions = getEventSuggestedServices(eventName)
    const servicesWithQuantity = suggestions.core.map(serviceId => ({ id: serviceId, quantity: 1 }))
    updateEventData(eventId, "selected_services", servicesWithQuantity)
    
    toast({
      title: "Core Services Applied",
      description: `${suggestions.core.length} core services selected for ${eventName}.`,
    })
  }

  const applyAllServices = (eventId: string, eventName: string) => {
    const suggestions = getEventSuggestedServices(eventName)
    const allServices = [...suggestions.core, ...suggestions.optional]
    const servicesWithQuantity = allServices.map(serviceId => ({ id: serviceId, quantity: 1 }))
    updateEventData(eventId, "selected_services", servicesWithQuantity)
    
    toast({
      title: "All Services Applied",
      description: `${allServices.length} services selected for ${eventName}.`,
    })
  }

  const applyMainDeliverables = (eventId: string, eventName: string) => {
    const suggestions = getEventSuggestedDeliverables(eventName)
    const deliverablesWithQuantity = suggestions.main.map(deliverableId => ({ id: deliverableId, quantity: 1 }))
    updateEventData(eventId, "selected_deliverables", deliverablesWithQuantity)
    
    toast({
      title: "Main Deliverables Applied",
      description: `${suggestions.main.length} main deliverables selected for ${eventName}.`,
    })
  }

  const applyAllDeliverables = (eventId: string, eventName: string) => {
    const suggestions = getEventSuggestedDeliverables(eventName)
    const allDeliverables = [...suggestions.main, ...suggestions.optional]
    const deliverablesWithQuantity = allDeliverables.map(deliverableId => ({ id: deliverableId, quantity: 1 }))
    updateEventData(eventId, "selected_deliverables", deliverablesWithQuantity)
    
    toast({
      title: "All Deliverables Applied",
      description: `${allDeliverables.length} deliverables selected for ${eventName}.`,
    })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="bride_name">Bride Name *</Label>
                <Input
                  id="bride_name"
                  value={quotationData.bride_name}
                  onChange={(e) => updateQuotationData("bride_name", e.target.value)}
                  placeholder="Enter bride's name"
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="groom_name">Groom Name *</Label>
                <Input
                  id="groom_name"
                  value={quotationData.groom_name}
                  onChange={(e) => updateQuotationData("groom_name", e.target.value)}
                  placeholder="Enter groom's name"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <div className="flex">
                  <Select
                    value={quotationData.mobile_country_code}
                    onValueChange={(value) => {
                      updateQuotationData("mobile_country_code", value)
                      // If WhatsApp is same as mobile, update WhatsApp country code too
                      if (sameAsmobile) {
                        updateQuotationData("whatsapp_country_code", value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-28 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="mobile"
                    className="flex-1 ml-2 h-11"
                    value={quotationData.mobile}
                    onChange={(e) => {
                      updateQuotationData("mobile", e.target.value)
                      // If WhatsApp is same as mobile, update WhatsApp number too
                      if (sameAsmobile) {
                        updateQuotationData("whatsapp", e.target.value)
                      }
                    }}
                    placeholder="Mobile number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same-as-mobile"
                      checked={sameAsmobile}
                      onCheckedChange={(checked) => {
                        setSameAsmobile(!!checked)
                        if (checked) {
                          // Copy mobile number to WhatsApp
                          updateQuotationData("whatsapp", quotationData.mobile)
                          updateQuotationData("whatsapp_country_code", quotationData.mobile_country_code)
                        }
                      }}
                    />
                    <Label htmlFor="same-as-mobile" className="text-sm text-gray-600 flex items-center gap-1">
                      <span>📱</span>
                      Same as mobile number
                    </Label>
                  </div>
                  {!sameAsmobile && (
                    <div className="flex">
                      <Select
                        value={quotationData.whatsapp_country_code}
                        onValueChange={(value) => updateQuotationData("whatsapp_country_code", value)}
                      >
                        <SelectTrigger className="w-28 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="whatsapp"
                        className="flex-1 ml-2 h-11"
                        value={quotationData.whatsapp}
                        onChange={(e) => updateQuotationData("whatsapp", e.target.value)}
                        placeholder="WhatsApp number"
                      />
                    </div>
                  )}
                  {sameAsmobile && (
                    <div className="text-sm text-gray-600 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="font-medium">WhatsApp:</span>
                      <span className="text-green-700">
                        {quotationData.mobile_country_code} {quotationData.mobile || "Enter mobile number above"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="alternate_mobile">Alternate Mobile Number</Label>
                <div className="flex">
                  <Select
                    value={quotationData.alternate_mobile_country_code}
                    onValueChange={(value) => {
                      updateQuotationData("alternate_mobile_country_code", value)
                      // If alternate WhatsApp is same as alternate mobile, update country code
                      if (sameAsAlternate) {
                        updateQuotationData("alternate_whatsapp_country_code", value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-28 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="alternate_mobile"
                    className="flex-1 ml-2 h-11"
                    value={quotationData.alternate_mobile}
                    onChange={(e) => {
                      updateQuotationData("alternate_mobile", e.target.value)
                      // If alternate WhatsApp is same as alternate mobile, update number
                      if (sameAsAlternate) {
                        updateQuotationData("alternate_whatsapp", e.target.value)
                      }
                    }}
                    placeholder="Alternate mobile number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="alternate_whatsapp">Alternate WhatsApp Number</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same-as-alternate"
                      checked={sameAsAlternate}
                      onCheckedChange={(checked) => {
                        setSameAsAlternate(!!checked)
                        if (checked) {
                          // Copy alternate mobile to alternate WhatsApp
                          updateQuotationData("alternate_whatsapp", quotationData.alternate_mobile)
                          updateQuotationData("alternate_whatsapp_country_code", quotationData.alternate_mobile_country_code)
                        }
                      }}
                    />
                    <Label htmlFor="same-as-alternate" className="text-sm text-gray-600 flex items-center gap-1">
                      <span>📱</span>
                      Same as alternate mobile
                    </Label>
                  </div>
                  {!sameAsAlternate && (
                    <div className="flex">
                      <Select
                        value={quotationData.alternate_whatsapp_country_code}
                        onValueChange={(value) => updateQuotationData("alternate_whatsapp_country_code", value)}
                      >
                        <SelectTrigger className="w-28 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="alternate_whatsapp"
                        className="flex-1 ml-2 h-11"
                        value={quotationData.alternate_whatsapp}
                        onChange={(e) => updateQuotationData("alternate_whatsapp", e.target.value)}
                        placeholder="Alternate WhatsApp number"
                      />
                    </div>
                  )}
                  {sameAsAlternate && quotationData.alternate_mobile && (
                    <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2">
                      <span className="text-blue-600">✓</span>
                      <span className="font-medium">Alt WhatsApp:</span>
                      <span className="text-blue-700">
                        {quotationData.alternate_mobile_country_code} {quotationData.alternate_mobile}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={quotationData.email}
                onChange={(e) => updateQuotationData("email", e.target.value)}
                placeholder="Enter email address"
                className="h-11"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Events ({quotationData.events.length})</h3>
                <p className="text-sm text-muted-foreground">
                  {quotationData.events.length === 1 
                    ? "Add event details for your quotation" 
                    : "Multiple events will use the same package and services"
                  }
                </p>
              </div>
              {quotationData.events.length > 1 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Multi-Event Package
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {quotationData.events.map((event, index) => (
                <Card key={event.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Event {index + 1}</Badge>
                        <div>
                          <h4 className="font-medium">
                            {event.event_name || `Event ${index + 1}`}
                          </h4>
                          {event.event_date && event.venue_name && (
                            <p className="text-sm text-muted-foreground">
                              {format(event.event_date, "MMM d, yyyy")} at {event.venue_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateEvent(event.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {quotationData.events.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`event_name_${event.id}`}>Event Type *</Label>
                        <Select
                          value={event.event_name}
                          onValueChange={(value) => updateEventData(event.id, "event_name", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.map((eventType, typeIndex) => (
                              <SelectItem key={`${event.id}-type-${eventType.id}-${typeIndex}`} value={eventType.name}>
                                {eventType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Event Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 px-4",
                                "border-2 border-gray-200 hover:border-primary/50 focus:border-primary",
                                "bg-white hover:bg-gray-50 transition-all duration-200",
                                "shadow-sm hover:shadow-md focus:shadow-md",
                                "rounded-lg group",
                                !event.event_date && "text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <CalendarIcon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                                  <span className="text-sm">
                                    {event.event_date ? (
                                      <span className="text-gray-900 font-medium">
                                        {format(event.event_date, "EEEE, MMMM d, yyyy")}
                                      </span>
                                    ) : (
                                      "Select event date"
                                    )}
                                  </span>
                                </div>
                                {event.event_date && (
                                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 shadow-xl border-0 rounded-xl" align="start">
                            <div className="bg-white rounded-xl overflow-hidden border border-gray-200/50">
                              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-gray-200/50">
                                <h4 className="font-semibold text-gray-800 text-sm">Select Event Date</h4>
                                <p className="text-xs text-gray-600 mt-1">Choose the date for this event</p>
                              </div>
                              <div className="p-3">
                                <Calendar
                                  mode="single"
                                  selected={event.event_date}
                                  onSelect={(date) => updateEventData(event.id, "event_date", date)}
                                  initialFocus
                                  className="rounded-lg"
                                  classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-semibold text-gray-800",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                      "h-8 w-8 bg-transparent p-0 hover:bg-primary/10 rounded-md transition-colors",
                                      "border border-gray-200 hover:border-primary/30"
                                    ),
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-gray-500 rounded-md w-8 font-normal text-xs uppercase tracking-wide",
                                    row: "flex w-full mt-2",
                                    cell: cn(
                                      "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                                      "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                                    ),
                                    day: cn(
                                      "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-md transition-all duration-200",
                                      "hover:scale-105 focus:scale-105 active:scale-95"
                                    ),
                                    day_selected: cn(
                                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                      "focus:bg-primary focus:text-primary-foreground shadow-md"
                                    ),
                                    day_today: "bg-accent text-accent-foreground font-semibold border-2 border-primary/30",
                                    day_outside: "text-gray-400 opacity-50 hover:opacity-75",
                                    day_disabled: "text-gray-300 opacity-30 cursor-not-allowed hover:bg-transparent",
                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                  }}
                                />
                              </div>
                              {event.event_date && (
                                <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-200/50">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-600">
                                      Selected date
                                    </div>
                                    <div className="text-sm font-semibold text-primary">
                                      {format(event.event_date, "MMM d, yyyy")}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor={`event_location_${event.id}`}>Event Location *</Label>
                          <Input
                            id={`event_location_${event.id}`}
                            value={event.event_location}
                            onChange={(e) => updateEventData(event.id, "event_location", e.target.value)}
                            placeholder="City/Area"
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`venue_name_${event.id}`}>Venue Name *</Label>
                          <Input
                            id={`venue_name_${event.id}`}
                            value={event.venue_name}
                            onChange={(e) => updateEventData(event.id, "venue_name", e.target.value)}
                            placeholder="Venue name"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor={`start_time_${event.id}`}>Start Time *</Label>
                          <Input
                            id={`start_time_${event.id}`}
                            type="time"
                            value={event.start_time}
                            onChange={(e) => updateEventData(event.id, "start_time", e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`end_time_${event.id}`}>End Time *</Label>
                          <Input
                            id={`end_time_${event.id}`}
                            type="time"
                            value={event.end_time}
                            onChange={(e) => updateEventData(event.id, "end_time", e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`expected_crowd_${event.id}`}>Expected Crowd</Label>
                          <Input
                            id={`expected_crowd_${event.id}`}
                            value={event.expected_crowd}
                            onChange={(e) => updateEventData(event.id, "expected_crowd", e.target.value)}
                            placeholder="e.g., 200 people"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addNewEvent}
                className="flex items-center gap-2 border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Add Another Event
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium">Default Package Type</Label>
              <p className="text-sm text-muted-foreground mb-4">
                This package will be applied to all events. You can override individual events below.
              </p>
              <RadioGroup
                value={quotationData.default_package}
                onValueChange={(value) => updateQuotationData("default_package", value as any)}
                className="mt-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic">Basic Package</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <Label htmlFor="premium">Premium Package</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elite" id="elite" />
                  <Label htmlFor="elite">Elite Package</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom Quote</Label>
                </div>
              </RadioGroup>

              {quotationData.events.length > 1 && (
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPackageToAllEvents("basic")}
                  >
                    Apply Basic to All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPackageToAllEvents("premium")}
                  >
                    Apply Premium to All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPackageToAllEvents("elite")}
                  >
                    Apply Elite to All
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Per-Event Package & Service Selection */}
            <div>
              <Label className="text-lg font-medium">Event-Specific Services & Deliverables</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Each event can have different services and deliverables based on requirements.
              </p>
              
              <div className="space-y-6">
                {quotationData.events.map((event, index) => (
                  <Card key={event.id} className="p-6">
                    <div className="space-y-4">
                      {/* Event Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg px-3 py-1">Event {index + 1}</Badge>
                          <div>
                            <h4 className="text-lg font-semibold">
                              {event.event_name || `Event ${index + 1}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {event.expected_crowd && `${event.expected_crowd} people • `}
                              {event.venue_name && `${event.venue_name} • `}
                              {event.event_date && format(event.event_date, "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Event Total</p>
                          <p className="text-xl font-bold text-primary">₹{calculateEventTotal(event).toLocaleString()}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Services: ₹{calculateServiceTotal(event).toLocaleString()} | 
                            Deliverables: ₹{calculateDeliverableTotal(event).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Package Override for this Event */}
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Package for this Event</Label>
                          <p className="text-xs text-gray-600">Override the default package for this specific event</p>
                        </div>
                        <Select
                          value={event.selected_package}
                          onValueChange={(value) => updateEventData(event.id, "selected_package", value as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Use Default</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Services & Deliverables Tabs */}
                      <Tabs defaultValue="services" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="services" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Services
                          </TabsTrigger>
                          <TabsTrigger value="deliverables" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Deliverables
                          </TabsTrigger>
                        </TabsList>

                        {/* Services Selection Tab */}
                        <TabsContent value="services" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Select Services for {event.event_name || `Event ${index + 1}`}</Label>
                            <div className="flex gap-2">
                              {event.event_name && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyCoreServices(event.id, event.event_name)}
                                    className="text-xs"
                                  >
                                    Select Core
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyAllServices(event.id, event.event_name)}
                                    className="text-xs"
                                  >
                                    Select All
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {event.event_name && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-800">Suggested for {event.event_name}</span>
                              </div>
                              <div className="text-xs text-blue-700">
                                <span className="font-medium">Core:</span> {getEventSuggestedServices(event.event_name).core.map(id => 
                                  services.find(s => s.id === id)?.servicename).join(", ") || "None"}
                                <br />
                                <span className="font-medium">Optional:</span> {getEventSuggestedServices(event.event_name).optional.map(id => 
                                  services.find(s => s.id === id)?.servicename).join(", ") || "None"}
                              </div>
                            </div>
                          )}

                          {/* Services by Category */}
                          {["Photography", "Videography", "Technology"].map((category, categoryIndex) => (
                            <div key={`${event.id}-category-${category}-${categoryIndex}`} className="mb-8">
                              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  category === "Photography" ? "bg-green-500" :
                                  category === "Videography" ? "bg-blue-500" : "bg-purple-500"
                                }`}></div>
                                {category} Services
                              </h4>
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {services.filter(s => s.category === category).map((service, serviceIndex) => {
                                  const selectedService = event.selected_services.find(s => s.id === service.id)
                                  const isSelected = !!selectedService
                                  const quantity = selectedService?.quantity || 1
                                  const packageType = getEventPackage(event)
                                  const servicePrice = service[`${packageType}_price` as keyof typeof service] as number || 0
                                  const override = event.service_overrides[service.id]
                                  const finalPrice = override?.[`${packageType}_price` as keyof typeof override] || servicePrice
                                  const isSuggested = event.event_name && 
                                    [...getEventSuggestedServices(event.event_name).core, ...getEventSuggestedServices(event.event_name).optional]
                                      .includes(service.id)
                                  const isIncludedInPackage = service.package_included[packageType as keyof typeof service.package_included]

                                  const updateServiceSelection = (checked: boolean) => {
                                    const currentServices = event.selected_services
                                    if (checked) {
                                      updateEventData(event.id, "selected_services", [
                                        ...currentServices.filter(s => s.id !== service.id),
                                        { id: service.id, quantity: 1 }
                                      ])
                                    } else {
                                      updateEventData(event.id, "selected_services", 
                                        currentServices.filter(s => s.id !== service.id)
                                      )
                                    }
                                  }

                                  const updateServiceQuantity = (newQuantity: number) => {
                                    if (newQuantity < 1) return
                                    const currentServices = event.selected_services
                                    updateEventData(event.id, "selected_services", 
                                      currentServices.map(s => 
                                        s.id === service.id ? { ...s, quantity: newQuantity } : s
                                      )
                                    )
                                  }

                                  return (
                                    <Card key={`${event.id}-${category.toLowerCase()}-service-${service.id}-${serviceIndex}`} className={`p-5 cursor-pointer transition-all ${
                                      isSelected ? `border-${category === "Photography" ? "green" : category === "Videography" ? "blue" : "purple"}-500 bg-${category === "Photography" ? "green" : category === "Videography" ? "blue" : "purple"}-50` : 
                                      isSuggested ? "border-blue-300 bg-blue-50" : "hover:bg-gray-50"
                                    }`}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start space-x-3 flex-1">
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={updateServiceSelection}
                                            disabled={!isIncludedInPackage && servicePrice === 0}
                                            className="mt-1"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <h5 className="font-medium text-base">{service.servicename}</h5>
                                              {isSuggested && (
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                  Suggested
                                                </Badge>
                                              )}
                                              {!isIncludedInPackage && (
                                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                                  Not in {packageType}
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-2">
                                              <span>Basic: ₹{(service.basic_price || 0).toLocaleString()}</span>
                                              <span>Premium: ₹{(service.premium_price || 0).toLocaleString()}</span>
                                              <span>Elite: ₹{(service.elite_price || 0).toLocaleString()}</span>
                                            </div>
                                            {service.description && (
                                              <p className="text-xs text-gray-600">{service.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                          {isSelected && (
                                            <div className="flex items-center gap-2">
                                              <Label className="text-sm font-medium whitespace-nowrap">Qty:</Label>
                                              <div className="flex items-center border rounded">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0"
                                                  onClick={() => updateServiceQuantity(quantity - 1)}
                                                  disabled={quantity <= 1}
                                                >
                                                  -
                                                </Button>
                                                <Input
                                                  type="number"
                                                  value={quantity}
                                                  onChange={(e) => {
                                                    const newQty = parseInt(e.target.value) || 1
                                                    updateServiceQuantity(newQty)
                                                  }}
                                                  className="h-8 w-16 text-center border-0 focus:ring-0"
                                                  min="1"
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0"
                                                  onClick={() => updateServiceQuantity(quantity + 1)}
                                                >
                                                  +
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div className="text-right">
                                            <p className="font-semibold text-lg">
                                              {servicePrice === 0 ? "N/A" : `₹${((finalPrice as number) * quantity).toLocaleString()}`}
                                            </p>
                                            <p className={`text-xs font-medium ${
                                              category === "Photography" ? "text-green-600" :
                                              category === "Videography" ? "text-blue-600" : "text-purple-600"
                                            }`}>
                                              {packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package
                                            </p>
                                            {isSelected && quantity > 1 && (
                                              <p className="text-xs text-gray-500">
                                                ₹{(finalPrice as number).toLocaleString()} × {quantity}
                                              </p>
                                            )}
                                          </div>
                                          
                                          {isSelected && servicePrice > 0 && (
                                            <div className="ml-4">
                                              <Input
                                                type="number"
                                                placeholder="Override"
                                                className="w-24 text-sm"
                                                onChange={(e) => {
                                                  const overridePrice = parseFloat(e.target.value)
                                                  if (!isNaN(overridePrice)) {
                                                    const currentOverrides = event.service_overrides
                                                    updateEventData(event.id, "service_overrides", {
                                                      ...currentOverrides,
                                                      [service.id]: {
                                                        ...currentOverrides[service.id],
                                                        [`${packageType}_price`]: overridePrice
                                                      }
                                                    })
                                                  }
                                                }}
                                              />
                                              <p className="text-xs text-gray-500 mt-1">Custom price</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </TabsContent>

                        {/* Deliverables Selection Tab */}
                        <TabsContent value="deliverables" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Select Deliverables for {event.event_name || `Event ${index + 1}`}</Label>
                            <div className="flex gap-2">
                              {event.event_name && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyMainDeliverables(event.id, event.event_name)}
                                    className="text-xs"
                                  >
                                    Select Main
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyAllDeliverables(event.id, event.event_name)}
                                    className="text-xs"
                                  >
                                    Select All
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {event.event_name && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-800">Suggested for {event.event_name}</span>
                              </div>
                              <div className="text-xs text-blue-700">
                                <span className="font-medium">Main:</span> {getEventSuggestedDeliverables(event.event_name).main.map(id => 
                                  deliverables.find(d => d.id === id)?.deliverable_name).join(", ") || "None"}
                                <br />
                                <span className="font-medium">Optional:</span> {getEventSuggestedDeliverables(event.event_name).optional.map(id => 
                                  deliverables.find(d => d.id === id)?.deliverable_name).join(", ") || "None"}
                              </div>
                            </div>
                          )}

                          {/* Main Deliverables */}
                          <div className="mb-8">
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Main Deliverables
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              {deliverables.filter(d => d.is_main_deliverable).map((deliverable, deliverableIndex) => {
                                const selectedDeliverable = event.selected_deliverables.find(d => d.id === deliverable.id)
                                const isSelected = !!selectedDeliverable
                                const quantity = selectedDeliverable?.quantity || 1
                                const packageType = getEventPackage(event)
                                const deliverablePrice = deliverable[`${packageType}_total_price` as keyof typeof deliverable] as number || 0
                                const override = event.package_overrides[deliverable.id]
                                const finalPrice = override?.[`${packageType}_total_price` as keyof typeof override] || deliverablePrice
                                const isSuggested = event.event_name && getEventSuggestedDeliverables(event.event_name).main.includes(deliverable.id)

                                const updateDeliverableSelection = (checked: boolean) => {
                                  const currentDeliverables = event.selected_deliverables
                                  if (checked) {
                                    updateEventData(event.id, "selected_deliverables", [
                                      ...currentDeliverables.filter(d => d.id !== deliverable.id),
                                      { id: deliverable.id, quantity: 1 }
                                    ])
                                  } else {
                                    updateEventData(event.id, "selected_deliverables", 
                                      currentDeliverables.filter(d => d.id !== deliverable.id)
                                    )
                                  }
                                }

                                const updateDeliverableQuantity = (newQuantity: number) => {
                                  if (newQuantity < 1) return
                                  const currentDeliverables = event.selected_deliverables
                                  updateEventData(event.id, "selected_deliverables", 
                                    currentDeliverables.map(d => 
                                      d.id === deliverable.id ? { ...d, quantity: newQuantity } : d
                                    )
                                  )
                                }

                                return (
                                                                      <Card key={`${event.id}-main-deliverable-${deliverable.id}-${deliverableIndex}`} className={`p-5 cursor-pointer transition-all ${
                                    isSelected ? "border-green-500 bg-green-50" : 
                                    isSuggested ? "border-blue-300 bg-blue-50" : "hover:bg-gray-50"
                                  }`}>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start space-x-3 flex-1">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={updateDeliverableSelection}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h5 className="font-medium text-base">{deliverable.deliverable_name}</h5>
                                            {isSuggested && (
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                Suggested
                                              </Badge>
                                            )}
                                            {deliverable.service_category && (
                                              <Badge variant="outline" className="text-xs">
                                                {deliverable.service_category}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mb-2">
                                            <span className="font-medium">{deliverable.process_count} process{deliverable.process_count > 1 ? 'es' : ''} included</span>
                                          </div>
                                          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-2">
                                            <span>Basic: ₹{(deliverable.basic_total_price || 0).toLocaleString()}</span>
                                            <span>Premium: ₹{(deliverable.premium_total_price || 0).toLocaleString()}</span>
                                            <span>Elite: ₹{(deliverable.elite_total_price || 0).toLocaleString()}</span>
                                          </div>
                                          {deliverable.description && (
                                            <p className="text-xs text-gray-600">{deliverable.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 flex-shrink-0">
                                        {isSelected && (
                                          <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium whitespace-nowrap">Qty:</Label>
                                            <div className="flex items-center border rounded">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => updateDeliverableQuantity(quantity - 1)}
                                                disabled={quantity <= 1}
                                              >
                                                -
                                              </Button>
                                              <Input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => {
                                                  const newQty = parseInt(e.target.value) || 1
                                                  updateDeliverableQuantity(newQty)
                                                }}
                                                className="h-8 w-16 text-center border-0 focus:ring-0"
                                                min="1"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => updateDeliverableQuantity(quantity + 1)}
                                              >
                                                +
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="text-right">
                                          <p className="font-semibold text-lg">₹{(finalPrice * quantity).toLocaleString()}</p>
                                          <p className="text-xs text-green-600 font-medium">
                                            {packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package
                                          </p>
                                          {isSelected && quantity > 1 && (
                                            <p className="text-xs text-gray-500">
                                              ₹{finalPrice.toLocaleString()} × {quantity}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {isSelected && (
                                          <div className="flex flex-col items-center gap-1">
                                            <Input
                                              type="number"
                                              placeholder="Override"
                                              className="w-24 text-sm h-8"
                                              onChange={(e) => {
                                                const overridePrice = parseFloat(e.target.value)
                                                if (!isNaN(overridePrice)) {
                                                  const currentOverrides = event.package_overrides
                                                  updateEventData(event.id, "package_overrides", {
                                                    ...currentOverrides,
                                                    [deliverable.id]: {
                                                      ...currentOverrides[deliverable.id],
                                                      [`${packageType}_total_price`]: overridePrice
                                                    }
                                                  })
                                                }
                                              }}
                                            />
                                            <p className="text-xs text-gray-500">Custom price</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>

                          {/* Optional Deliverables */}
                          <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              Optional Deliverables
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              {deliverables.filter(d => !d.is_main_deliverable).map((deliverable, deliverableIndex) => {
                                const selectedDeliverable = event.selected_deliverables.find(d => d.id === deliverable.id)
                                const isSelected = !!selectedDeliverable
                                const quantity = selectedDeliverable?.quantity || 1
                                const packageType = getEventPackage(event)
                                const override = event.package_overrides[deliverable.id]
                                const finalPrice = override?.[`${packageType}_total_price` as keyof typeof override] || deliverable[`${packageType}_total_price` as keyof DeliverableItem] as number
                                const isSuggested = getEventSuggestedDeliverables(event.event_name).optional.includes(deliverable.id)

                                const updateDeliverableSelection = (checked: boolean) => {
                                  if (checked) {
                                    updateEventData(event.id, "selected_deliverables", [
                                      ...event.selected_deliverables,
                                      { id: deliverable.id, quantity: 1 }
                                    ])
                                  } else {
                                    updateEventData(event.id, "selected_deliverables", 
                                      event.selected_deliverables.filter(d => d.id !== deliverable.id)
                                    )
                                  }
                                }

                                const updateDeliverableQuantity = (newQuantity: number) => {
                                  updateEventData(event.id, "selected_deliverables", 
                                    event.selected_deliverables.map(d => 
                                      d.id === deliverable.id ? { ...d, quantity: Math.max(1, newQuantity) } : d
                                    )
                                  )
                                }

                                return (
                                  <Card key={`${event.id}-optional-deliverable-${deliverable.id}-${deliverableIndex}`} className={`p-5 cursor-pointer transition-all ${
                                    isSelected ? "border-orange-500 bg-orange-50" : 
                                    isSuggested ? "border-blue-300 bg-blue-50" : "hover:bg-gray-50"
                                  }`}>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start space-x-3 flex-1">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={updateDeliverableSelection}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h5 className="font-medium text-base">{deliverable.deliverable_name}</h5>
                                            {isSuggested && (
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                Suggested
                                              </Badge>
                                            )}
                                            {deliverable.service_category && (
                                              <Badge variant="outline" className="text-xs">
                                                {deliverable.service_category}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mb-2">
                                            <span className="font-medium">{deliverable.process_count} process{deliverable.process_count > 1 ? 'es' : ''} included</span>
                                          </div>
                                          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-2">
                                            <span>Basic: ₹{(deliverable.basic_total_price || 0).toLocaleString()}</span>
                                            <span>Premium: ₹{(deliverable.premium_total_price || 0).toLocaleString()}</span>
                                            <span>Elite: ₹{(deliverable.elite_total_price || 0).toLocaleString()}</span>
                                          </div>
                                          {deliverable.description && (
                                            <p className="text-xs text-gray-600">{deliverable.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 flex-shrink-0">
                                        {isSelected && (
                                          <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium whitespace-nowrap">Qty:</Label>
                                            <div className="flex items-center border rounded">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => updateDeliverableQuantity(quantity - 1)}
                                                disabled={quantity <= 1}
                                              >
                                                -
                                              </Button>
                                              <Input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => {
                                                  const newQty = parseInt(e.target.value) || 1
                                                  updateDeliverableQuantity(newQty)
                                                }}
                                                className="h-8 w-16 text-center border-0 focus:ring-0"
                                                min="1"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => updateDeliverableQuantity(quantity + 1)}
                                              >
                                                +
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="text-right">
                                          <p className="font-semibold text-lg">₹{(finalPrice * quantity).toLocaleString()}</p>
                                          <p className="text-xs text-orange-600 font-medium">
                                            {packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package
                                          </p>
                                          {isSelected && quantity > 1 && (
                                            <p className="text-xs text-gray-500">
                                              ₹{finalPrice.toLocaleString()} × {quantity}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {isSelected && (
                                          <div className="flex flex-col items-center gap-1">
                                            <Input
                                              type="number"
                                              placeholder="Override"
                                              className="w-24 text-sm h-8"
                                              onChange={(e) => {
                                                const overridePrice = parseFloat(e.target.value)
                                                if (!isNaN(overridePrice)) {
                                                  const currentOverrides = event.package_overrides
                                                  updateEventData(event.id, "package_overrides", {
                                                    ...currentOverrides,
                                                    [deliverable.id]: {
                                                      ...currentOverrides[deliverable.id],
                                                      [`${packageType}_total_price`]: overridePrice
                                                    }
                                                  })
                                                }
                                              }}
                                            />
                                            <p className="text-xs text-gray-500">Custom price</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Deliverables for Custom Package */}
            {quotationData.default_package === "custom" && (
              <div>
                <Label className="text-lg font-medium">Custom Deliverables</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Add custom deliverables that will apply to all events.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateQuotationData("custom_services", [
                        ...quotationData.custom_services,
                        { name: "", price: 0, package_type: "basic" }
                      ])
                    }}
                  >
                    Add Custom Deliverable
                  </Button>
                  
                  <div className="mt-4 space-y-4">
                    {quotationData.custom_services.map((service, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-3 gap-4">
                            <Input
                              placeholder="Deliverable name"
                              value={service.name}
                              onChange={(e) => {
                                const newServices = [...quotationData.custom_services]
                                newServices[index].name = e.target.value
                                updateQuotationData("custom_services", newServices)
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={service.price}
                              onChange={(e) => {
                                const newServices = [...quotationData.custom_services]
                                newServices[index].price = parseFloat(e.target.value) || 0
                                updateQuotationData("custom_services", newServices)
                              }}
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                updateQuotationData("custom_services", 
                                  quotationData.custom_services.filter((_, i) => i !== index)
                                )
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Final Quotation Summary */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quotation Summary</h3>
              
              <div className="space-y-3">
                {quotationData.events.map((event, index) => (
                  <Card key={event.id} className="p-4 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">Event {index + 1}</Badge>
                          <h4 className="font-semibold">{event.event_name || `Event ${index + 1}`}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getEventPackage(event).charAt(0).toUpperCase() + getEventPackage(event).slice(1)}
                          </Badge>
                        </div>
                        
                        {/* Services Breakdown */}
                        {getEventServices(event).length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Services:</h5>
                            <div className="space-y-1">
                              {getEventServices(event).map((serviceItem, serviceIndex) => {
                                const service = services.find(s => s.id === serviceItem.id)
                                if (!service) return null
                                
                                const packageType = getEventPackage(event)
                                const override = event.service_overrides[serviceItem.id] || quotationData.service_overrides[serviceItem.id]
                                const price = override?.[`${packageType}_price` as keyof typeof override] || service[`${packageType}_price` as keyof ServiceItem] as number
                                const total = price * serviceItem.quantity
                                
                                return (
                                  <div key={`summary-${event.id}-service-${serviceItem.id}-${serviceIndex}`} className="flex justify-between text-sm">
                                    <span className="text-gray-600 flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        service.category === "Photography" ? "bg-green-500" :
                                        service.category === "Videography" ? "bg-blue-500" : "bg-purple-500"
                                      }`}></span>
                                      {service.servicename}
                                      {serviceItem.quantity > 1 && (
                                        <span className="text-xs text-gray-500">× {serviceItem.quantity}</span>
                                      )}
                                    </span>
                                    <span className="font-medium">₹{total.toLocaleString()}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Deliverables Breakdown */}
                        {getEventDeliverableItems(event).length > 0 && (
                          <div className="mb-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Deliverables:</h5>
                            <div className="space-y-1">
                              {getEventDeliverableItems(event).map((deliverableItem, deliverableIndex) => {
                                const deliverable = deliverables.find(d => d.id === deliverableItem.id)
                                if (!deliverable) return null
                                
                                const packageType = getEventPackage(event)
                                const override = event.package_overrides[deliverableItem.id]
                                const price = override?.[`${packageType}_total_price` as keyof typeof override] || 
                                             deliverable[`${packageType}_total_price` as keyof typeof deliverable] || 0
                                
                                return (
                                  <div key={`summary-${event.id}-deliverable-${deliverableItem.id}-${deliverableIndex}`} className="flex justify-between text-sm">
                                    <span className="text-gray-600 flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        deliverable.is_main_deliverable ? "bg-green-500" : "bg-orange-500"
                                      }`}></span>
                                      {deliverable.deliverable_name}
                                      {deliverable.service_category && (
                                        <Badge variant="outline" className="text-xs ml-1">
                                          {deliverable.service_category}
                                        </Badge>
                                      )}
                                      {deliverableItem.quantity > 1 && (
                                        <span className="text-xs text-gray-500">× {deliverableItem.quantity}</span>
                                      )}
                                    </span>
                                    <span className="font-medium">₹{((price as number) * deliverableItem.quantity).toLocaleString()}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Subtotals */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Services Subtotal:</span>
                            <span>₹{calculateServiceTotal(event).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Deliverables Subtotal:</span>
                            <span>₹{calculateDeliverableTotal(event).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-6">
                        <p className="text-sm text-gray-500">Event Total</p>
                        <p className="text-xl font-bold text-primary">₹{calculateEventTotal(event).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Grand Total</h3>
                      <p className="text-sm text-muted-foreground">
                        Total for {quotationData.events.length} event(s)
                      </p>
                      <div className="text-sm text-gray-600 mt-1">
                        Services: ₹{quotationData.events.reduce((total, event) => total + calculateServiceTotal(event), 0).toLocaleString()} | 
                        Deliverables: ₹{quotationData.events.reduce((total, event) => total + calculateDeliverableTotal(event), 0).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-primary">₹{calculateTotal().toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                  isActive ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className={`ml-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <p className="text-sm font-medium">{step.title}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="w-full">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading quotation data...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fetching services, deliverables, and event types from database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Status Indicator */}
      {!loading && dataError && (
        <Card className="w-full mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-orange-800">Limited Data Available</p>
                <p className="text-xs text-orange-700">{dataError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Data Status */}
      {!loading && !dataError && services.length > 0 && deliverables.length > 0 && (
        <Card className="w-full mb-6 border-green-200 bg-green-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-green-800">Real-time Data Loaded</p>
                <p className="text-xs text-green-700">
                  {services.length} services and {deliverables.length} deliverables from database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content - Only show when not loading */}
      {!loading && (
        <>
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                {React.createElement(STEPS[currentStep - 1].icon, { className: "mr-3 h-6 w-6" })}
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-base">
                {editMode ? `Editing quotation ${existingQuotation?.quotation_number}` : 
                 currentStep === 1 ? "Enter the client and couple details for the quotation" :
                 currentStep === 2 ? "Provide event details including date, time, and venue" :
                 "Choose packages and services for the quotation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="h-11 px-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || !validateStep(currentStep)}
              className="h-11 px-6"
            >
              {currentStep === STEPS.length ? (editMode ? "Update Quotation" : "Generate Quotation") : "Next"}
              {currentStep < STEPS.length && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 