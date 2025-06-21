"use client"

import { useState, useEffect } from "react"
import type { Vendor } from "@/types/vendor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, RefreshCw, Database } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddVendorDialog } from "./add-vendor-dialog"
import { EditVendorDialog } from "./edit-vendor-dialog"
import { DeleteVendorDialog } from "./delete-vendor-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { query } from "@/lib/postgresql-client"

// Define the Vendor type if it's not imported
// type Vendor = {
//   id: number
//   vendor_code: string
//   name: string
//   contact_person: string
//   email: string
//   phone: string
//   address: string
//   city: string
//   state: string
//   postal_code: string
//   country: string
//   category: string
//   tax_id?: string
//   payment_terms?: string
//   website?: string
//   notes?: string
//   status: string
//   created_at: string
//   updated_at: string
// }

export function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null)
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const { toast } = useToast()

  const fetchVendors = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Fetching vendors from database...')
      
      const result = await query(`
        SELECT * FROM vendors 
        ORDER BY name ASC
      `)

      if (!result.success) {
        // Check if the error is because the table doesn't exist
        if (result.error?.includes("relation") && result.error?.includes("does not exist")) {
          console.log('⚠️ Vendors table does not exist')
          setTableExists(false)
          return
        }
        throw new Error(result.error || 'Failed to fetch vendors')
      }

      console.log(`✅ Loaded ${result.data?.length || 0} vendors`)
      setVendors(result.data || [])
      setFilteredVendors(result.data || [])
      setTableExists(true)
    } catch (error) {
      console.error("❌ Error fetching vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createVendorsTable = async () => {
    setIsCreatingTable(true)
    try {
      console.log('🔨 Creating vendors table...')
      
      const result = await query(`
        CREATE TABLE IF NOT EXISTS vendors (
          id SERIAL PRIMARY KEY,
          vendor_code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          contact_person VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(50) NOT NULL,
          state VARCHAR(50) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL,
          tax_id VARCHAR(50),
          payment_terms VARCHAR(100),
          website VARCHAR(255),
          notes TEXT,
          status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'blacklisted')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create a function to update timestamps
        CREATE OR REPLACE FUNCTION update_vendor_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create a trigger for the timestamp update
        DROP TRIGGER IF EXISTS update_vendor_timestamp ON vendors;
        CREATE TRIGGER update_vendor_timestamp
        BEFORE UPDATE ON vendors
        FOR EACH ROW
        EXECUTE FUNCTION update_vendor_timestamp();
      `)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create vendors table')
      }

      console.log('✅ Vendors table created successfully')
      toast({
        title: "Success",
        description: "Vendors table created successfully.",
      })

      setTableExists(true)
      fetchVendors()
    } catch (error) {
      console.error("❌ Error creating vendors table:", error)
      toast({
        title: "Error",
        description: "Failed to create vendors table. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTable(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVendors(vendors)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = vendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(query) ||
          vendor.vendor_code.toLowerCase().includes(query) ||
          vendor.contact_person.toLowerCase().includes(query) ||
          vendor.email.toLowerCase().includes(query) ||
          vendor.phone.toLowerCase().includes(query),
      )
      setFilteredVendors(filtered)
    }
  }, [searchQuery, vendors])

  const handleAddVendor = () => {
    setShowAddDialog(true)
  }

  const handleEditVendor = (vendor: Vendor) => {
    setVendorToEdit(vendor)
  }

  const handleDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor)
  }

  const handleVendorAdded = () => {
    fetchVendors()
    setShowAddDialog(false)
    toast({
      title: "Vendor Added",
      description: "The vendor has been added successfully.",
    })
  }

  const handleVendorUpdated = () => {
    fetchVendors()
    setVendorToEdit(null)
    toast({
      title: "Vendor Updated",
      description: "The vendor has been updated successfully.",
    })
  }

  const handleVendorDeleted = () => {
    fetchVendors()
    setVendorToDelete(null)
    toast({
      title: "Vendor Deleted",
      description: "The vendor has been deleted successfully.",
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "secondary"
      case "blacklisted":
        return "destructive"
      default:
        return "default"
    }
  }

  if (!tableExists) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Database table not found</AlertTitle>
          <AlertDescription>
            The vendors table does not exist in the database. Click the button below to create it.
          </AlertDescription>
        </Alert>
        <Button onClick={createVendorsTable} disabled={isCreatingTable}>
          <Database className="h-4 w-4 mr-2" />
          {isCreatingTable ? "Creating Table..." : "Create Vendors Table"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vendors..."
            className="w-full sm:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchVendors} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddVendor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact Person</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading vendors...
                </TableCell>
              </TableRow>
            ) : filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No vendors found. {searchQuery ? "Try a different search term." : "Add a vendor to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.vendor_code}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{vendor.contact_person}</TableCell>
                  <TableCell className="hidden md:table-cell">{vendor.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{vendor.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{vendor.category}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(vendor.status) as any}>
                      {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteVendor(vendor)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddVendorDialog open={showAddDialog} onOpenChange={setShowAddDialog} onVendorAdded={handleVendorAdded} />

      {vendorToEdit && (
        <EditVendorDialog
          vendor={vendorToEdit}
          open={!!vendorToEdit}
          onOpenChange={(open) => !open && setVendorToEdit(null)}
          onVendorUpdated={handleVendorUpdated}
        />
      )}

      {vendorToDelete && (
        <DeleteVendorDialog
          vendor={vendorToDelete}
          open={!!vendorToDelete}
          onOpenChange={(open) => !open && setVendorToDelete(null)}
          onVendorDeleted={handleVendorDeleted}
        />
      )}
    </div>
  )
}
