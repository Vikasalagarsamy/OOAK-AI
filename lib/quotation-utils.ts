import type { SavedQuotation } from "@/actions/quotations-actions"

/**
 * Check quotation status and return appropriate action for business logic
 */
export function getQuotationAction(quotation: SavedQuotation | null): {
  action: 'generate' | 'view' | 'remind' | 'follow-up' | 'revise' | 'contract' | 'renew'
  buttonText: string
  buttonVariant: 'default' | 'outline' | 'secondary' | 'destructive'
  description: string
} {
  if (!quotation) {
    return {
      action: 'generate',
      buttonText: 'Generate Quotation',
      buttonVariant: 'default',
      description: 'No quotation exists for this lead'
    }
  }

  const { status } = quotation
  const createdAt = new Date(quotation.created_at)
  const now = new Date()
  const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  switch (status) {
    case 'draft':
      return {
        action: 'view',
        buttonText: 'View Draft',
        buttonVariant: 'outline',
        description: 'Quotation is in draft - not yet sent'
      }
    
    case 'sent':
      if (daysSinceCreated > 7) {
        return {
          action: 'remind',
          buttonText: 'Send Reminder',
          buttonVariant: 'secondary',
          description: 'Quotation sent but no response - time to follow up'
        }
      }
      return {
        action: 'view',
        buttonText: 'View Quotation',
        buttonVariant: 'outline',
        description: 'Quotation sent - awaiting client response'
      }
    
    case 'approved':
      return {
        action: 'contract',
        buttonText: 'Create Contract',
        buttonVariant: 'default',
        description: 'Quotation approved - ready for contract'
      }
    
    case 'rejected':
      return {
        action: 'revise',
        buttonText: 'Revise Quotation',
        buttonVariant: 'secondary',
        description: 'Quotation rejected - create revised version'
      }
    
    case 'expired':
      if (daysSinceCreated > 45) {
        return {
          action: 'renew',
          buttonText: 'Generate New Quotation',
          buttonVariant: 'default',
          description: 'Quotation expired - create fresh quotation'
        }
      }
      return {
        action: 'revise',
        buttonText: 'Revise Quotation',
        buttonVariant: 'secondary',
        description: 'Quotation expired - revise and resend'
      }
    
    default:
      return {
        action: 'view',
        buttonText: 'View Quotation',
        buttonVariant: 'outline',
        description: 'View existing quotation'
      }
  }
}

// Utility functions for handling quotation data in both old and new formats

export interface ServiceDisplayItem {
  id: number
  service_id: number
  servicename: string
  quantity: number
  package_type: string
  unit_price: number
  total_price: number
  category?: string
  status?: string
}

export interface DeliverableDisplayItem {
  id: number
  deliverable_id: number
  deliverable_name: string
  quantity: number
  package_type: string
  unit_price: number
  total_price: number
  deliverable_cat?: string
  deliverable_type?: string
  service_name?: string
  service_id?: number
  status?: string
}

/**
 * Get services data from quotation - handles both normalized and legacy formats
 */
export function getQuotationServices(quotation: SavedQuotation): ServiceDisplayItem[] {
  // Check if we have normalized data
  if (quotation.quotation_services && quotation.quotation_services.length > 0) {
    return quotation.quotation_services.map(service => ({
      id: service.id,
      service_id: service.service_id,
      servicename: service.services?.servicename || `Service #${service.service_id}`,
      quantity: service.quantity,
      package_type: service.package_type,
      unit_price: service.unit_price,
      total_price: service.total_price,
      category: service.services?.category,
      status: service.status
    }))
  }

  // Fallback to legacy JSON structure
  if (quotation.quotation_data?.selected_services) {
    return quotation.quotation_data.selected_services.map(service => ({
      id: service.id,
      service_id: service.id,
      servicename: `Service #${service.id}`, // We don't have service name in legacy format
      quantity: service.quantity,
      package_type: quotation.quotation_data.default_package || 'basic',
      unit_price: 5000, // Default price for legacy data
      total_price: service.quantity * 5000,
      status: 'active'
    }))
  }

  return []
}

/**
 * Get deliverables data from quotation - handles both normalized and legacy formats  
 */
export function getQuotationDeliverables(quotation: SavedQuotation): DeliverableDisplayItem[] {
  // Check if we have normalized data
  if (quotation.quotation_deliverables && quotation.quotation_deliverables.length > 0) {
    return quotation.quotation_deliverables.map(deliverable => ({
      id: deliverable.id,
      deliverable_id: deliverable.deliverable_id,
      deliverable_name: deliverable.deliverables?.deliverable_name || `Deliverable #${deliverable.deliverable_id}`,
      quantity: deliverable.quantity,
      package_type: deliverable.package_type,
      unit_price: deliverable.unit_price,
      total_price: deliverable.total_price,
      deliverable_cat: deliverable.deliverables?.deliverable_cat,
      deliverable_type: deliverable.deliverables?.deliverable_type,
      service_name: deliverable.services?.servicename,
      service_id: deliverable.service_id,
      status: deliverable.status
    }))
  }

  // Fallback to legacy JSON structure
  if (quotation.quotation_data?.selected_deliverables) {
    return quotation.quotation_data.selected_deliverables.map(deliverable => ({
      id: deliverable.id,
      deliverable_id: deliverable.id,
      deliverable_name: `Deliverable #${deliverable.id}`, // We don't have deliverable name in legacy format
      quantity: deliverable.quantity,
      package_type: quotation.quotation_data.default_package || 'basic',
      unit_price: 3000, // Default price for legacy data
      total_price: deliverable.quantity * 3000,
      status: 'quoted'
    }))
  }

  return []
}

/**
 * Calculate total services amount
 */
export function calculateServicesTotal(quotation: SavedQuotation): number {
  const services = getQuotationServices(quotation)
  return services.reduce((total, service) => total + service.total_price, 0)
}

/**
 * Calculate total deliverables amount
 */
export function calculateDeliverablesTotal(quotation: SavedQuotation): number {
  const deliverables = getQuotationDeliverables(quotation)
  return deliverables.reduce((total, deliverable) => total + deliverable.total_price, 0)
}

/**
 * Get package display name
 */
export function getPackageDisplayName(packageType: string): string {
  const packageNames: Record<string, string> = {
    'basic': 'Basic Package',
    'premium': 'Premium Package', 
    'elite': 'Elite Package',
    'custom': 'Custom Package'
  }
  return packageNames[packageType] || packageType.charAt(0).toUpperCase() + packageType.slice(1)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
} 