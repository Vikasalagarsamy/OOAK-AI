import type { Service, ServiceFormData, ServiceFilters } from './services'

export type DeliverableCategory = "Main" | "Optional"
export type DeliverableType = "Photo" | "Video" 
export type TimingType = "days" | "hr" | "min"
export type StreamType = "UP" | "DOWN"
export type PackageType = "basic" | "premium" | "elite"

export interface PackageInclusion {
  basic: boolean
  premium: boolean
  elite: boolean
}

export interface Deliverable {
  id: number
  deliverable_cat: DeliverableCategory
  deliverable_type: DeliverableType
  deliverable_id?: number
  deliverable_name: string
  process_name: string
  
  // Stakeholder involvement
  has_customer: boolean
  has_employee: boolean
  has_qc: boolean
  has_vendor: boolean
  
  // Process configuration
  link?: string
  sort_order: number
  timing_type: TimingType
  
  // Turnaround time configuration
  tat?: number
  tat_value?: number
  buffer?: number
  skippable: boolean
  employee?: number[] // JSON array of employee IDs
  
  // Feature flags
  has_download_option: boolean
  has_task_process: boolean
  has_upload_folder_path: boolean
  process_starts_from: number
  status: number
  
  // Package pricing
  basic_price?: number
  premium_price?: number
  elite_price?: number
  
  // Workflow templates
  on_start_template?: string
  on_complete_template?: string
  on_correction_template?: string
  input_names?: string[] // JSON array of input field names
  
  // Metadata
  created_date: string
  created_by?: number
  
  // Process flow
  stream?: StreamType
  stage?: string
  
  // Package inclusion
  package_included: PackageInclusion
}

export interface DeliverableFormData {
  deliverable_cat: DeliverableCategory
  deliverable_type: DeliverableType
  deliverable_id?: number
  deliverable_name: string
  process_name: string
  has_customer: boolean
  has_employee: boolean
  has_qc: boolean
  has_vendor: boolean
  link?: string
  sort_order: number
  timing_type: TimingType
  tat?: number
  tat_value?: number
  buffer?: number
  skippable: boolean
  employee?: number[]
  has_download_option: boolean
  has_task_process: boolean
  has_upload_folder_path: boolean
  process_starts_from: number
  status: number
  
  // Package pricing
  basic_price?: number
  premium_price?: number
  elite_price?: number
  
  on_start_template?: string
  on_complete_template?: string
  on_correction_template?: string
  input_names?: string[]
  stream?: StreamType
  stage?: string
  package_included: PackageInclusion
}

export interface DeliverableFilters {
  category?: DeliverableCategory
  type?: DeliverableType
  package?: PackageType
  search?: string
  status?: number
  has_customer?: boolean
  has_employee?: boolean
}

// Enhanced Service with Package Pricing
export interface ServiceWithPackages extends Service {
  basic_price?: number
  premium_price?: number
  elite_price?: number
  package_included: PackageInclusion
}

// Package Definitions
export interface ServicePackage {
  id: number
  package_name: PackageType
  package_display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// Quote Snapshots
export interface QuoteServicesSnapshot {
  id: number
  quote_id: number
  service_id: number
  service_name: string
  package_type: PackageType
  locked_price: number
  quantity: number
  subtotal: number
  created_at: string
}

export interface QuoteDeliverablesSnapshot {
  id: number
  quote_id: number
  deliverable_id: number
  deliverable_name: string
  deliverable_type: DeliverableType
  process_name: string
  package_type: PackageType
  tat?: number
  timing_type?: TimingType
  sort_order: number
  created_at: string
}

// Quote Components for Future Extensions
export type QuoteComponentType = "service" | "deliverable" | "addon" | "discount" | "custom"

export interface QuoteComponent {
  id: number
  quote_id: number
  component_type: QuoteComponentType
  component_name: string
  component_description?: string
  unit_price?: number
  quantity: number
  subtotal: number
  metadata?: Record<string, any>
  sort_order: number
  created_at: string
}

// Package Views
export interface PackageServiceView {
  package_name: PackageType
  package_display_name: string
  service_id: number
  servicename: string
  category?: string
  package_price?: number
  is_included: boolean
}

export interface PackageDeliverableView {
  package_name: PackageType
  package_display_name: string
  deliverable_id: number
  deliverable_name: string
  deliverable_type: DeliverableType
  process_name: string
  tat?: number
  timing_type?: TimingType
  sort_order: number
  is_included: boolean
}

// Workflow Process Types
export interface WorkflowStep {
  id: number
  step_name: string
  description?: string
  stakeholders: {
    customer: boolean
    employee: boolean
    qc: boolean
    vendor: boolean
  }
  timing: {
    tat?: number
    type: TimingType
    buffer?: number
  }
  templates: {
    start?: string
    complete?: string
    correction?: string
  }
  sort_order: number
}

// Re-export Service types for convenience
export type { Service, ServiceFormData, ServiceFilters } 