"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { Supplier } from "@/types/supplier"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddSupplierDialog } from "./add-supplier-dialog"
import { EditSupplierDialog } from "./edit-supplier-dialog"
import { DeleteSupplierDialog } from "./delete-supplier-dialog"
import { useToast } from "@/components/ui/use-toast"

export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const { toast } = useToast()

  const fetchSuppliers = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("suppliers").select("*").order("name")

      if (error) {
        throw error
      }

      setSuppliers(data || [])
      setFilteredSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSuppliers(suppliers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(query) ||
          supplier.supplier_code.toLowerCase().includes(query) ||
          supplier.contact_person.toLowerCase().includes(query) ||
          supplier.email.toLowerCase().includes(query) ||
          supplier.phone.toLowerCase().includes(query),
      )
      setFilteredSuppliers(filtered)
    }
  }, [searchQuery, suppliers])

  const handleAddSupplier = () => {
    setShowAddDialog(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierToEdit(supplier)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
  }

  const handleSupplierAdded = () => {
    fetchSuppliers()
    setShowAddDialog(false)
    toast({
      title: "Supplier Added",
      description: "The supplier has been added successfully.",
    })
  }

  const handleSupplierUpdated = () => {
    fetchSuppliers()
    setSupplierToEdit(null)
    toast({
      title: "Supplier Updated",
      description: "The supplier has been updated successfully.",
    })
  }

  const handleSupplierDeleted = () => {
    fetchSuppliers()
    setSupplierToDelete(null)
    toast({
      title: "Supplier Deleted",
      description: "The supplier has been deleted successfully.",
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search suppliers..."
            className="w-full sm:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchSuppliers} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Code</TableHead>
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
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No suppliers found. {searchQuery ? "Try a different search term." : "Add a supplier to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{supplier.contact_person}</TableCell>
                  <TableCell className="hidden md:table-cell">{supplier.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{supplier.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{supplier.category}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(supplier.status) as any}>
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
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
                        <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier)} className="text-destructive">
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

      <AddSupplierDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSupplierAdded={handleSupplierAdded} />

      {supplierToEdit && (
        <EditSupplierDialog
          supplier={supplierToEdit}
          open={!!supplierToEdit}
          onOpenChange={(open) => !open && setSupplierToEdit(null)}
          onSupplierUpdated={handleSupplierUpdated}
        />
      )}

      {supplierToDelete && (
        <DeleteSupplierDialog
          supplier={supplierToDelete}
          open={!!supplierToDelete}
          onOpenChange={(open) => !open && setSupplierToDelete(null)}
          onSupplierDeleted={handleSupplierDeleted}
        />
      )}
    </div>
  )
}
