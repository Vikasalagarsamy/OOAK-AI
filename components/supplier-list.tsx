"use client"

import { useState, useEffect } from "react"
import { getSuppliers } from "@/actions/supplier-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Supplier } from "@/types/supplier"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, RefreshCw, AlertCircle } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const { toast } = useToast()
  const { user } = useCurrentUser()

  const fetchSuppliers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      console.log('📋 Fetching suppliers from PostgreSQL...')
      
      const result = await getSuppliers()

      if (result.success && result.data) {
        console.log(`✅ Retrieved ${result.data.length} suppliers`)
        setSuppliers(result.data)
        setFilteredSuppliers(result.data)
        setError(null)
      } else {
        const errorMessage = result.error || 'Failed to load suppliers'
        console.error('❌ Failed to fetch suppliers:', errorMessage)
        setError(errorMessage)
        
        toast({
          title: "Loading Error",
          description: errorMessage,
          variant: "destructive",
        })
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Unexpected error loading suppliers'
      console.error("❌ Unexpected error fetching suppliers:", error)
      setError(errorMessage)
      
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      if (showLoading) setIsLoading(false)
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
          (supplier.contact_person || '').toLowerCase().includes(query) ||
          (supplier.email || '').toLowerCase().includes(query) ||
          (supplier.phone || '').toLowerCase().includes(query) ||
          (supplier.category || '').toLowerCase().includes(query)
      )
      setFilteredSuppliers(filtered)
    }
  }, [searchQuery, suppliers])

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh requested')
    await fetchSuppliers(true)
  }

  const handleAddSupplier = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add suppliers.",
        variant: "destructive",
      })
      return
    }
    setShowAddDialog(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to edit suppliers.",
        variant: "destructive",
      })
      return
    }
    setSupplierToEdit(supplier)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete suppliers.",
        variant: "destructive",
      })
      return
    }
    setSupplierToDelete(supplier)
  }

  const handleSupplierAdded = async () => {
    console.log('✅ Supplier added, refreshing list...')
    await fetchSuppliers(false) // Don't show loading spinner for background refresh
    setShowAddDialog(false)
    
    toast({
      title: "✅ Supplier Added",
      description: "The supplier has been added successfully.",
    })
  }

  const handleSupplierUpdated = async () => {
    console.log('✅ Supplier updated, refreshing list...')
    await fetchSuppliers(false) // Don't show loading spinner for background refresh
    setSupplierToEdit(null)
    
    toast({
      title: "✅ Supplier Updated",
      description: "The supplier has been updated successfully.",
    })
  }

  const handleSupplierDeleted = async () => {
    console.log('✅ Supplier deleted, refreshing list...')
    await fetchSuppliers(false) // Don't show loading spinner for background refresh
    setSupplierToDelete(null)
    
    // Note: The delete action already shows its own toast
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default" // Green
      case "inactive":
        return "secondary" // Gray
      case "blacklisted":
        return "destructive" // Red
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
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
          
          {searchQuery && (
            <Badge variant="outline">
              {filteredSuppliers.length} of {suppliers.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers table */}
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
              <TableHead className="hidden xl:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading suppliers...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchQuery ? (
                      <>
                        No suppliers found matching "{searchQuery}".
                        <br />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSearchQuery("")}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      <>
                        No suppliers found.
                        <br />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddSupplier}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add your first supplier
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {supplier.supplier_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplier.contact_person || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplier.email ? (
                      <a 
                        href={`mailto:${supplier.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.email}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplier.phone ? (
                      <a 
                        href={`tel:${supplier.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.phone}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {supplier.category || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(supplier.status) as any}>
                      {supplier.status?.charAt(0).toUpperCase() + supplier.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatDate(supplier.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                          ✏️ Edit Supplier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSupplier(supplier)}
                          className="text-destructive"
                        >
                          🗑️ Delete Supplier
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

      {/* Summary info */}
      {!isLoading && suppliers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Dialogs */}
      <AddSupplierDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSupplierAdded={handleSupplierAdded}
      />

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
