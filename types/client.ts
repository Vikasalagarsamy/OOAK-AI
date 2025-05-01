export interface Client {
  id: number
  client_code: string
  name: string
  company_id: number
  company_name?: string
  contact_person: string
  email?: string
  phone?: string
  country_code?: string
  is_whatsapp?: boolean
  whatsapp_number?: string
  whatsapp_country_code?: string
  has_separate_whatsapp?: boolean
  address?: string
  city: string
  state?: string
  postal_code?: string
  country?: string
  category: string
  status: string
  created_at?: string
  updated_at?: string
}
