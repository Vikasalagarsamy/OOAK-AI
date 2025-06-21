"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { query } from "@/lib/postgresql-client"
import type { Client } from "@/types/client"
import { logActivity } from "@/services/activity-service"
import { generateClientCode, ensureUniqueClientCode } from "@/utils/client-code-generator"

// Country codes data
const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+86", country: "China" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+81", country: "Japan" },
  { code: "+7", country: "Russia" },
  { code: "+55", country: "Brazil" },
  { code: "+27", country: "South Africa" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+64", country: "New Zealand" },
  { code: "+92", country: "Pakistan" },
  { code: "+880", country: "Bangladesh" },
  { code: "+94", country: "Sri Lanka" },
  { code: "+977", country: "Nepal" },
  { code: "+975", country: "Bhutan" },
  { code: "+95", country: "Myanmar" },
  { code: "+62", country: "Indonesia" },
  { code: "+84", country: "Vietnam" },
  { code: "+66", country: "Thailand" },
  { code: "+63", country: "Philippines" },
  { code: "+82", country: "South Korea" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
]

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded: (client: Client) => void
}

export function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([])
  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    contact_person: "",
    email: "",
    country_code: "+91", // Default to India
    phone: "",
    is_whatsapp: false,
    whatsapp_option: "same", // 'same' or 'different'
    whatsapp_country_code: "+91",
    whatsapp_number: "",
    has_separate_whatsapp: false,
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    category: "BUSINESS" as Client["category"],
    status: "ACTIVE" as Client["status"],
  })
  const { toast } = useToast()

  const fetchCompanies = async () => {
    try {
      console.log("📋 Fetching companies...")
      
      // Use PostgreSQL query instead of Supabase
      const companiesResult = await query(
        "SELECT id, name FROM companies ORDER BY name",
        []
      )

      console.log("✅ Companies fetched:", companiesResult.rows)

      // Map the data to match the expected structure
      const formattedData = companiesResult.rows.map((company) => ({
        id: company.id,
        name: company.name,
      }))

      setCompanies(formattedData)
    } catch (error) {
      console.error("❌ Error fetching companies:", error)
      toast({
        title: "Error",
        description: `Error fetching companies: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (open) {
      fetchCompanies()

      // Reset form data when opening the dialog
      setFormData({
        name: "",
        company_id: "",
        contact_person: "",
        email: "",
        country_code: "+91", // Default to India
        phone: "",
        is_whatsapp: false,
        whatsapp_option: "same",
        whatsapp_country_code: "+91",
        whatsapp_number: "",
        has_separate_whatsapp: false,
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        category: "BUSINESS",
        status: "ACTIVE",
      })
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_whatsapp: checked,
      whatsapp_option: checked ? prev.whatsapp_option : "same",
    }))
  }

  const handleWhatsAppOptionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      whatsapp_option: value,
      has_separate_whatsapp: value === "different",
      // If switching to "same", clear the separate WhatsApp number
      ...(value === "same" ? { whatsapp_number: "", whatsapp_country_code: "+91" } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.company_id) {
        throw new Error("Please select a company")
      }

      const companyId = Number.parseInt(formData.company_id, 10)

      // Generate a unique client code
      const baseCode = await generateClientCode(companyId)
      const clientCode = await ensureUniqueClientCode(baseCode)

      // Insert new client using PostgreSQL
      console.log("💾 Inserting new client...")
      const insertResult = await query(
        `INSERT INTO clients (
          client_code, name, company_id, contact_person, email, country_code, phone,
          is_whatsapp, has_separate_whatsapp, whatsapp_country_code, whatsapp_number,
          address, city, state, postal_code, country, category, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          clientCode,
          formData.name,
          companyId,
          formData.contact_person,
          formData.email,
          formData.country_code,
          formData.phone,
          formData.is_whatsapp,
          formData.is_whatsapp && formData.whatsapp_option === "different",
          formData.is_whatsapp && formData.whatsapp_option === "different" ? formData.whatsapp_country_code : null,
          formData.is_whatsapp && formData.whatsapp_option === "different" ? formData.whatsapp_number : null,
          formData.address,
          formData.city,
          formData.state,
          formData.postal_code,
          formData.country,
          formData.category,
          formData.status
        ]
      )

      if (insertResult.rows.length === 0) {
        throw new Error("Failed to create client")
      }

      const newClient = insertResult.rows[0]

      // Log the activity
      try {
        await logActivity({
          actionType: "create",
          entityType: "client",
          entityId: newClient.id.toString(),
          entityName: formData.name,
          description: `New client ${formData.name} (${clientCode}) was created`,
          userName: "Current User", // Replace with actual user name when available
        })
      } catch (activityError) {
        console.error("Error logging activity:", activityError)
        // Don't throw here, we still want to complete the client creation
      }

      toast({
        title: "Success",
        description: "Client added successfully",
      })

      // Call the onClientAdded callback with the new client
      onClientAdded(newClient)

      // Reset form
      setFormData({
        name: "",
        company_id: "",
        contact_person: "",
        email: "",
        country_code: "+91",
        phone: "",
        is_whatsapp: false,
        whatsapp_option: "same",
        whatsapp_country_code: "+91",
        whatsapp_number: "",
        has_separate_whatsapp: false,
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        category: "BUSINESS",
        status: "ACTIVE",
      })

      // Close the dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: `Error adding client: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_id" className="text-right">
                Company
              </Label>
              <Select
                name="company_id"
                value={formData.company_id}
                onValueChange={(value) => handleSelectChange("company_id", value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="no-companies" disabled>
                      No companies found. Please add companies first.
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_person" className="text-right">
                Contact Person
              </Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            {/* Phone number with country code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  name="country_code"
                  value={formData.country_code}
                  onValueChange={(value) => handleSelectChange("country_code", value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} ({country.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex-1"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* WhatsApp toggle */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox id="is_whatsapp" checked={formData.is_whatsapp} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor="is_whatsapp" className="cursor-pointer">
                  This client uses WhatsApp
                </Label>
              </div>
            </div>

            {/* WhatsApp options - only show if is_whatsapp is checked */}
            {formData.is_whatsapp && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">WhatsApp Number</Label>
                <div className="col-span-3 space-y-4">
                  <RadioGroup
                    value={formData.whatsapp_option}
                    onValueChange={handleWhatsAppOptionChange}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="same" id="same" />
                      <Label htmlFor="same">Same as phone number</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="different" id="different" />
                      <Label htmlFor="different">Different WhatsApp number</Label>
                    </div>
                  </RadioGroup>

                  {/* Show separate WhatsApp number fields if "different" is selected */}
                  {formData.whatsapp_option === "different" && (
                    <div className="flex gap-2 mt-2">
                      <Select
                        name="whatsapp_country_code"
                        value={formData.whatsapp_country_code}
                        onValueChange={(value) => handleSelectChange("whatsapp_country_code", value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {countryCodes.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.code} ({country.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="whatsapp_number"
                        name="whatsapp_number"
                        value={formData.whatsapp_number}
                        onChange={handleChange}
                        className="flex-1"
                        placeholder="WhatsApp number"
                        required={formData.whatsapp_option === "different"}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                State/Province
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postal_code" className="text-right">
                Postal Code
              </Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                name="category"
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="CORPORATE">Corporate</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="NON-PROFIT">Non-Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
