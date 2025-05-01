export interface Vendor {
  id: number
  vendor_code: string
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
  website?: string
  notes?: string
  status: "active" | "inactive" | "blacklisted"
  created_at?: string
  updated_at?: string
}

export type VendorFormData = Omit<Vendor, "id" | "created_at" | "updated_at">
