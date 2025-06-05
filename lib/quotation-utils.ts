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