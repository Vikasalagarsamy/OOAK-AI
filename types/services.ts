export type ServiceStatus = "Active" | "Inactive" | "Discontinued"

export interface Service {
  id: number
  servicename: string
  status: ServiceStatus
  created_at: string
  updated_at?: string
  description?: string
  category?: string
  price?: number
  unit?: string
  basic_price?: number
  premium_price?: number
  elite_price?: number
  package_included?: {
    basic: boolean
    premium: boolean
    elite: boolean
  }
}

export interface ServiceFormData {
  servicename: string
  status: ServiceStatus
  description?: string
  category?: string
  price?: number
  unit?: string
}

export interface ServiceFilters {
  status?: ServiceStatus
  category?: string
  search?: string
}

// Service categories based on the data
export const SERVICE_CATEGORIES = [
  "Photography",
  "Videography", 
  "Equipment",
  "Staffing",
  "Technology",
  "Lighting",
  "Other"
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]

export interface ServiceWithPackages extends Service {
  basic_price?: number
  premium_price?: number
  elite_price?: number
  package_included?: {
    basic: boolean
    premium: boolean
    elite: boolean
  }
}

// Package-related types
export type PackageType = "basic" | "premium" | "elite"

export interface PackageInclusion {
  basic: boolean
  premium: boolean
  elite: boolean
} 