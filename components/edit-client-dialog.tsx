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

import type { Client } from "@/types/client"
import { logActivity } from "@/services/activity-service"

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

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
  onClientUpdated: (client: Client) => void
}

export function EditClientDialog({ open, onOpenChange, client, onClientUpdated }: EditClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<{ id: number; company_name: string }[]>([])
  const [formData, setFormData] = useState({
    name: client.name,
    company_id: client.company_id.toString(),
    contact_person: client.contact_person,
    email: client.email || "",
    country_code: client.country_code || "+91",
    phone: client.phone || "",
    is_whatsapp: client.is_whatsapp || false,
    whatsapp_option: client.has_separate_whatsapp ? "different" : "same",
    whatsapp_country_code: client.whatsapp_country_code || "+91",
    whatsapp_number: client.whatsapp_number || "",
    has_separate_whatsapp: client.has_separate_whatsapp || false,
    address: client.address || "",
    city: client.city,
    state: client.state || "",
    postal_code: client.postal_code || "",
    country: client.country || "",
    category: client.category,
    status: client.status,
  })
  const { toast } = useToast()

  const fetchCompanies = async () => {
    try {
      const result = await query("SELECT id, name FROM companies ORDER BY name", []); const data = result.rows; const error = null

      if (error) {
        throw error
      }

      // Map the data to match the expected structure
      const formattedData =
        data?.map((company) => ({
          id: company.id,
          company_name: company.name,
        })) || []

      setCompanies(formattedData)
    } catch (error) {
      console.error("Error fetching companies:", error)
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
      // Initialize form data with client data
      setFormData({
        name: client.name,
        company_id: client.company_id.toString(),
        contact_person: client.contact_person,
        email: client.email || "",
        country_code: client.country_code || "+91",
        phone: client.phone || "",
        is_whatsapp: client.is_whatsapp || false,
        whatsapp_option: client.has_separate_whatsapp ? "different" : "same",
        whatsapp_country_code: client.whatsapp_country_code || "+91",
        whatsapp_number: client.whatsapp_number || "",
        has_separate_whatsapp: client.has_separate_whatsapp || false,
        address: client.address || "",
        city: client.city,
        state: client.state || "",
        postal_code: client.postal_code || "",
        country: client.country || "",
        category: client.category,
        status: client.status,
      })
    }
  }, [open, client])

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

      // Prepare client data
      const clientData = {
        name: formData.name,
        company_id: companyId,
        contact_person: formData.contact_person,
        email: formData.email,
        country_code: formData.country_code,
        phone: formData.phone,
        is_whatsapp: formData.is_whatsapp,
        has_separate_whatsapp: formData.is_whatsapp && formData.whatsapp_option === "different",
        whatsapp_country_code:
          formData.is_whatsapp && formData.whatsapp_option === "different" ? formData.whatsapp_country_code : null,
        whatsapp_number:
          formData.is_whatsapp && formData.whatsapp_option === "different" ? formData.whatsapp_number : null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        category: formData.category,
        status: formData.status,
      }

      // Update client using PostgreSQL
      const result = await query(
        `UPDATE clients SET 
          name = $1, company_id = $2, contact_person = $3, email = $4, 
          country_code = $5, phone = $6, is_whatsapp = $7, has_separate_whatsapp = $8, 
          whatsapp_country_code = $9, whatsapp_number = $10, address = $11, city = $12, 
          state = $13, postal_code = $14, country = $15, category = $16, status = $17 
         WHERE id = $18 
         RETURNING *`,
        [
          clientData.name, clientData.company_id, clientData.contact_person, clientData.email,
          clientData.country_code, clientData.phone, clientData.is_whatsapp, clientData.has_separate_whatsapp,
          clientData.whatsapp_country_code, clientData.whatsapp_number, clientData.address, clientData.city,
          clientData.state, clientData.postal_code, clientData.country, clientData.category, clientData.status,
          client.id
        ]
      )
      
      const data = result.rows
      const error = null

      console.log('✅ Client updated successfully:', clientData.name)

      // Log the activity
      await logActivity({
        actionType: "update",
        entityType: "client",
        entityId: client.id.toString(),
        entityName: formData.name,
        description: `Client ${formData.name} (${client.client_code}) was updated`,
        userName: "Current User", // Replace with actual user name when available
      })

      toast({
        title: "Success",
        description: "Client updated successfully",
      })

      // Get the company name for display
      const company = companies.find((c) => c.id === companyId)

      // Call the onClientUpdated callback with the updated client
      if (data && data.length > 0) {
        const updatedClient = {
          ...data[0],
          company_name: company?.company_name || "Unknown",
        }
        onClientUpdated(updatedClient)
      }

      // Close the dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: `Error updating client: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client_code" className="text-right">
                Client Code
              </Label>
              <Input id="client_code" value={client.client_code} className="col-span-3" disabled />
            </div>
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
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.company_name}
                    </SelectItem>
                  ))}
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
              {loading ? "Updating..." : "Update Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
