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
  status: "NEW" | "ASSIGNED" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" | "REJECTED"
  assigned_to?: number | null
  assigned_to_name?: string
  created_at?: string
  updated_at?: string
  notes?: string
  lead_source_id?: number
  lead_source_name?: string
}
