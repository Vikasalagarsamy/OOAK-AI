"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Plus, Search, RefreshCw, Database, Pencil, Trash2, Trash } from "lucide-react"
import { AddClientDialog } from "./add-client-dialog"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"
import { ViewClientDialog } from "./view-client-dialog"
import type { Client } from "@/types/client"

import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { BatchDeleteClientsDialog } from "./batch-delete-clients-dialog"

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const { toast } = useToast()
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)

  // Check if the table exists by attempting to query it using PostgreSQL
  const checkTableExists = async () => {
    try {
      // Check if the clients table exists using information_schema
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'clients'
        ) as table_exists`,
        []
      )

      const tableExists = result.rows[0]?.table_exists || false
      setTableExists(tableExists)
      console.log(`📋 Clients table exists: ${tableExists}`)
      return tableExists
    } catch (error) {
      console.error("❌ Error checking if clients table exists:", error)
      setTableExists(false)
      return false
    }
  }

  const fetchClients = async () => {
    setLoading(true)
    try {
      // Fetch clients using PostgreSQL
      const clientsResult = await query(
        "SELECT * FROM clients ORDER BY name",
        []
      )

      if (clientsResult.rows.length === 0) {
        setClients([])
        return
      }

      // Fetch companies separately to get company names
      const companiesResult = await query(
        "SELECT * FROM companies",
        []
      )

      // Create a map of company IDs to company names
      const companyMap = new Map()

      if (companiesResult.rows.length > 0) {
        // Determine which column to use for company name
        const firstCompany = companiesResult.rows[0]
        let nameColumn = null

        // Check for possible name columns
        if ("company_name" in firstCompany) {
          nameColumn = "company_name"
        } else if ("name" in firstCompany) {
          nameColumn = "name"
        } else if ("title" in firstCompany) {
          nameColumn = "title"
        } else {
          // If no name column is found, use the first string column
          const stringColumns = Object.entries(firstCompany)
            .filter(([_, value]) => typeof value === "string")
            .map(([key]) => key)

          if (stringColumns.length > 0) {
            nameColumn = stringColumns[0]
          }
        }

        // Create the company map
        if (nameColumn) {
          companiesResult.rows.forEach((company) => {
            companyMap.set(company.id, company[nameColumn])
          })
        }
      }

      // Combine clients with company names
      const clientsWithCompanies = clientsResult.rows.map((client) => ({
        ...client,
        company_name: companyMap.get(client.company_id) || "Unknown Company",
      }))

      setClients(clientsWithCompanies)
      console.log(`✅ Loaded ${clientsWithCompanies.length} clients`)
    } catch (error) {
      console.error("❌ Error fetching clients:", error)
      toast({
        title: "Error",
        description: `Error fetching clients: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      
      // If the error indicates the table doesn't exist, update the state
      if (error instanceof Error && error.message.includes('relation "clients" does not exist')) {
        setTableExists(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Use a flag to prevent state updates after component unmount
    let isMounted = true

    const initialize = async () => {
      setLoading(true)
      try {
        const exists = await checkTableExists()

        if (isMounted) {
          setTableExists(exists)

          if (exists) {
            await fetchClients()
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("Error initializing client list:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: `Error initializing client list: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
          })
          setLoading(false)
        }
      }
    }

    initialize()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  const createClientsTable = async () => {
    try {
      setLoading(true)

      // Create the clients table using PostgreSQL DDL
      await query(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          client_code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          company_id INTEGER REFERENCES companies(id),
          contact_person VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          country_code VARCHAR(10),
          phone VARCHAR(20),
          is_whatsapp BOOLEAN DEFAULT false,
          has_separate_whatsapp BOOLEAN DEFAULT false,
          whatsapp_country_code VARCHAR(10),
          whatsapp_number VARCHAR(20),
          address TEXT,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          category VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, [])

      console.log('✅ Clients table created successfully')

      toast({
        title: "Success",
        description: "Clients table created successfully",
      })

      // Update the state to reflect that the table now exists
      setTableExists(true)

      // After creating the table, fetch clients again
      fetchClients()
    } catch (error) {
      console.error("❌ Error creating clients table:", error)
      toast({
        title: "Error",
        description: `Error creating clients table: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = (newClient: Client) => {
    setClients([...clients, newClient])
  }

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
  }

  const handleDeleteClient = (id: number) => {
    setClients(clients.filter((client) => client.id !== id))
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.state && client.state.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "BUSINESS":
        return "default"
      case "INDIVIDUAL":
        return "outline"
      case "CORPORATE":
        return "secondary"
      case "GOVERNMENT":
        return "destructive"
      case "NON-PROFIT":
        return "success"
      default:
        return "outline"
    }
  }

  const handleSelectClient = (clientId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedClientIds([...selectedClientIds, clientId])
    } else {
      setSelectedClientIds(selectedClientIds.filter((id) => id !== clientId))
    }
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedClientIds(filteredClients.map((client) => client.id))
    } else {
      setSelectedClientIds([])
    }
  }

  const handleBatchDelete = () => {
    if (selectedClientIds.length > 0) {
      setBatchDeleteDialogOpen(true)
    }
  }

  const handleBatchDeleteComplete = () => {
    // Refresh the client list
    fetchClients()
    // Clear selections
    setSelectedClientIds([])
  }

  if (!tableExists) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
        <Database className="h-12 w-12 mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Database table not found</h3>
        <p className="text-muted-foreground text-center mb-6">
          The clients table does not exist in the database. Click the button below to create it.
        </p>
        <Button onClick={createClientsTable} disabled={loading}>
          {loading ? "Creating..." : "Create Clients Table"}
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedClientIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="h-9">
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedClientIds.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchClients} disabled={loading} className="h-9">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={filteredClients.length > 0 && selectedClientIds.length === filteredClients.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all clients"
                    disabled={loading || filteredClients.length === 0}
                  />
                </TableHead>
                <TableHead>Client Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    {searchTerm ? "No clients found matching your search." : "No clients found. Add your first client."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={(checked) => handleSelectClient(client.id, checked === true)}
                        aria-label={`Select client ${client.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{client.client_code}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.company_name}</TableCell>
                    <TableCell>{client.contact_person}</TableCell>
                    <TableCell>{client.city}</TableCell>
                    <TableCell>{client.state}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(client.category)}>{client.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === "ACTIVE"
                            ? "success"
                            : client.status === "INACTIVE"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedClient(client)
                                setViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">View client</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View client details</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedClient(client)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4 text-amber-500" />
                              <span className="sr-only">Edit client</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit client</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedClient(client)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete client</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete client</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AddClientDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onClientAdded={handleAddClient} />

        {selectedClient && (
          <>
            <ViewClientDialog
              open={viewDialogOpen}
              onOpenChange={setViewDialogOpen}
              client={selectedClient}
              onEdit={() => {
                setViewDialogOpen(false)
                setEditDialogOpen(true)
              }}
            />
            <EditClientDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              client={selectedClient}
              onClientUpdated={handleUpdateClient}
            />
            <DeleteClientDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              client={selectedClient}
              onClientDeleted={handleDeleteClient}
            />
          </>
        )}
        <BatchDeleteClientsDialog
          open={batchDeleteDialogOpen}
          onOpenChange={setBatchDeleteDialogOpen}
          selectedClients={clients.filter((client) => selectedClientIds.includes(client.id))}
          onClientsDeleted={handleBatchDeleteComplete}
        />
      </div>
    </TooltipProvider>
  )
}
