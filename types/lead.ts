export interface Lead {
  id: number
  lead_number: string
  client_name: string
  client_email?: string
  client_phone?: string
  client_whatsapp?: string
  company_id: number
  company_name?: string
  branch_id: number | null
  branch_name?: string
  branch_location?: string
  location?: string
  status:
    | "NEW"
    | "ASSIGNED"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL"
    | "NEGOTIATION"
    | "WON"
    | "LOST"
    | "REJECTED"
    | "UNASSIGNED"
  assigned_to?: number | null
  assigned_to_name?: string
  created_at?: string
  updated_at?: string
  notes?: string
  lead_source_id?: number
  lead_source_name?: string
  country_code?: string
  phone?: string
  email?: string
  whatsapp_country_code?: string
  whatsapp_number?: string
  is_whatsapp?: boolean
  has_separate_whatsapp?: boolean
  // New fields for rejected lead reassignment
  is_reassigned?: boolean
  reassigned_at?: string
  reassigned_from_company_id?: number
  reassigned_from_branch_id?: number | null
  reassigned_from_company_name?: string
  reassigned_from_branch_name?: string
}
