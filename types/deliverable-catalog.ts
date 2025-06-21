// New Deliverable Architecture Types
// Separating catalog management from workflow management

export type DeliverableCategory = "Main" | "Optional"
export type DeliverableType = "Photo" | "Video"

export interface PackageInclusion {
  basic: boolean
  premium: boolean
  elite: boolean
}

// =====================================================
// DELIVERABLE CATALOG (Simple Management)
// =====================================================

export interface DeliverableCatalog {
  id: number
  deliverable_name: string
  deliverable_category: DeliverableCategory
  deliverable_type: DeliverableType
  description?: string
  
  // Package Pricing
  basic_price: number
  premium_price: number
  elite_price: number
  
  // Package Inclusion
  package_included: PackageInclusion
  
  // Metadata
  status: number
  created_date: string
  updated_date: string
  created_by?: number
  updated_by?: number
}

export interface DeliverableCatalogFormData {
  deliverable_name: string
  deliverable_category: DeliverableCategory
  deliverable_type: DeliverableType
  description?: string
  basic_price: number
  premium_price: number
  elite_price: number
  package_included: PackageInclusion
}

export interface DeliverableCatalogFilters {
  category?: DeliverableCategory
  type?: DeliverableType
  search?: string
  status?: number
}

// =====================================================
// DELIVERABLE WORKFLOWS (Process Management)
// =====================================================

export type TimingType = "days" | "hr" | "min"
export type StreamType = "UP" | "DOWN"

export interface DeliverableWorkflow {
  id: number
  deliverable_catalog_id: number
  
  // Process Details
  process_name: string
  process_description?: string
  sort_order: number
  
  // Stakeholder Involvement
  has_customer: boolean
  has_employee: boolean
  has_qc: boolean
  has_vendor: boolean
  
  // Timing Configuration
  timing_type: TimingType
  tat?: number
  tat_value?: number
  buffer?: number
  
  // Process Options
  skippable: boolean
  has_download_option: boolean
  has_task_process: boolean
  has_upload_folder_path: boolean
  process_starts_from: number
  
  // Workflow Templates
  on_start_template?: string
  on_complete_template?: string
  on_correction_template?: string
  
  // Additional Configuration
  employee?: number[] // Array of employee IDs
  input_names?: string[] // Array of input field names
  link?: string
  stream?: StreamType
  stage?: string
  
  // Process Pricing (optional override)
  process_basic_price?: number
  process_premium_price?: number
  process_elite_price?: number
  
  // Metadata
  status: number
  created_date: string
  updated_date: string
  created_by?: number
  updated_by?: number
}

export interface DeliverableWorkflowFormData {
  deliverable_catalog_id: number
  process_name: string
  process_description?: string
  sort_order: number
  has_customer: boolean
  has_employee: boolean
  has_qc: boolean
  has_vendor: boolean
  timing_type: TimingType
  tat?: number
  tat_value?: number
  buffer?: number
  skippable: boolean
  has_download_option: boolean
  has_task_process: boolean
  has_upload_folder_path: boolean
  process_starts_from: number
  on_start_template?: string
  on_complete_template?: string
  on_correction_template?: string
  employee?: number[]
  input_names?: string[]
  link?: string
  stream?: StreamType
  stage?: string
  process_basic_price?: number
  process_premium_price?: number
  process_elite_price?: number
}

export interface DeliverableWorkflowFilters {
  deliverable_catalog_id?: number
  process_name?: string
  has_customer?: boolean
  has_employee?: boolean
  has_qc?: boolean
  has_vendor?: boolean
  status?: number
}

// =====================================================
// COMBINED VIEWS
// =====================================================

export interface DeliverableCatalogSummary extends DeliverableCatalog {
  workflow_count: number
  total_basic_price: number
  total_premium_price: number
  total_elite_price: number
}

export interface DeliverableWorkflowDetails extends DeliverableWorkflow {
  deliverable_name: string
  deliverable_category: DeliverableCategory
  deliverable_type: DeliverableType
  catalog_basic_price: number
  catalog_premium_price: number
  catalog_elite_price: number
  catalog_package_included: PackageInclusion
}

// =====================================================
// API RESPONSES
// =====================================================

export interface DeliverableCatalogResponse {
  success: boolean
  message: string
  id?: number
}

export interface DeliverableWorkflowResponse {
  success: boolean
  message: string
  id?: number
}

// =====================================================
// BACKWARD COMPATIBILITY
// =====================================================

// For existing code that expects the old Deliverable interface
export interface LegacyDeliverable {
  id: number
  deliverable_name: string
  deliverable_cat: DeliverableCategory
  deliverable_type: DeliverableType
  process_name: string
  basic_price?: number
  premium_price?: number
  elite_price?: number
  package_included: PackageInclusion
  status: number
  created_date: string
}

// Utility functions for converting between old and new formats
export function catalogToLegacy(catalog: DeliverableCatalog, defaultProcessName?: string): LegacyDeliverable {
  return {
    id: catalog.id,
    deliverable_name: catalog.deliverable_name,
    deliverable_cat: catalog.deliverable_category,
    deliverable_type: catalog.deliverable_type,
    process_name: defaultProcessName || catalog.deliverable_name,
    basic_price: catalog.basic_price,
    premium_price: catalog.premium_price,
    elite_price: catalog.elite_price,
    package_included: catalog.package_included,
    status: catalog.status,
    created_date: catalog.created_date
  }
} 