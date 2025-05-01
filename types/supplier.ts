export interface Supplier {
  id: number
  supplier_code: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  category: string
  tax_id?: string
  payment_terms?: string
  lead_time?: string
  website?: string
  notes?: string
  status: "active" | "inactive" | "blacklisted"
  created_at?: string
  updated_at?: string
}

export type SupplierFormData = Omit<Supplier, "id" | "created_at" | "updated_at">
