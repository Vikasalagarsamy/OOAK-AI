"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Plus, Search, RefreshCw, Database, Pencil, Trash2 } from "lucide-react"
import { AddClientDialog } from "./add-client-dialog"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"
import { ViewClientDialog } from "./view-client-dialog"
import type { Client } from "@/types/client"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

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

  // Check if the table exists by attempting to query it
  const checkTableExists = async () => {
    try {
      // Try to query the clients table with a limit of 0 to just check if it exists
      const { data, error } = await supabase.from("clients").select("id").limit(0)

      // If there's no error, the table exists
      if (!error) {
        setTableExists(true)
        return true
      }

      // If the error indicates the table doesn't exist, update the state
      if (
        error.message.includes('relation "clients" does not exist') ||
        error.message.includes('relation "public.clients" does not exist')
      ) {
        setTableExists(false)
        return false
      }

      // For other errors, log them but assume the table might exist
      console.error("Error checking if table exists:", error)
      return false
    } catch (error) {
      console.error("Error checking if table exists:", error)
      setTableExists(false)
      return false
    }
  }

  const fetchClients = async () => {
    setLoading(true)
    try {
      // Fetch clients without the join first
      const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*").order("name")

      if (clientsError) {
        console.error("Error fetching clients:", clientsError)
        toast({
          title: "Error",
          description: `Error fetching clients: ${clientsError.message}`,
          variant: "destructive",
        })

        // If the error indicates the table doesn't exist, update the state
        if (clientsError.message.includes('relation "clients" does not exist')) {
          setTableExists(false)
        }
        return
      }

      // Now fetch companies separately to get company names
      const { data: companiesData, error: companiesError } = await supabase.from("companies").select("*")

      if (companiesError) {
        console.error("Error fetching companies:", companiesError)
        // If we can't get companies, just use the clients data without company names
        setClients(clientsData || [])
        return
      }

      // Create a map of company IDs to company names
      const companyMap = new Map()

      if (companiesData && companiesData.length > 0) {
        // Determine which column to use for company name
        const firstCompany = companiesData[0]
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
          companiesData.forEach((company) => {
            companyMap.set(company.id, company[nameColumn])
          })
        }
      }

      // Combine clients with company names
      const clientsWithCompanies = clientsData.map((client) => ({
        ...client,
        company_name: companyMap.get(client.company_id) || "Unknown Company",
      }))

      setClients(clientsWithCompanies || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: `Error fetching clients: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
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

      // Use the RPC function to create the clients table
      const { error } = await supabase.rpc("create_clients_table")

      if (error) {
        console.error("Error creating clients table:", error)
        toast({
          title: "Error",
          description: `Error creating clients table: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Clients table created successfully",
      })

      // Update the state to reflect that the table now exists
      setTableExists(true)

      // After creating the table, fetch clients again
      fetchClients()
    } catch (error) {
      console.error("Error creating clients table:", error)
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
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    {searchTerm ? "No clients found matching your search." : "No clients found. Add your first client."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
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
      </div>
    </TooltipProvider>
  )
}
