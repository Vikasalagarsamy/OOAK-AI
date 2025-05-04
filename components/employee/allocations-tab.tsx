"use client"

import { useState } from "react"
import { format } from "date-fns"
import { PlusCircle, Pencil, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllocationForm } from "./allocation-form"
import { useEmployeeAllocations, type Allocation, type AllocationFormData } from "@/hooks/use-employee-allocations"

type AllocationsTabProps = {
  employeeId: string
}

export function AllocationsTab({ employeeId }: AllocationsTabProps) {
  const {
    allocations,
    isLoading,
    error,
    fetchAllocations,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    calculateTotalPercentage,
  } = useEmployeeAllocations(employeeId)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Filter allocations based on the active tab
  const filteredAllocations = allocations.filter((allocation) => {
    if (activeTab === "all") return true
    return allocation.status === activeTab
  })

  // Count allocations by status
  const statusCounts = {
    all: allocations.length,
    active: allocations.filter((a) => a.status === "active").length,
    pending: allocations.filter((a) => a.status === "pending").length,
    completed: allocations.filter((a) => a.status === "completed").length,
  }

  // Calculate total percentage for active allocations
  const totalPercentage = calculateTotalPercentage()

  // Handle adding a new allocation
  const handleAddAllocation = async (data: AllocationFormData) => {
    const success = await addAllocation(data)
    if (success) {
      setIsAddDialogOpen(false)
      await fetchAllocations() // Refresh to get the latest data
    }
    return success
  }

  // Handle editing an allocation
  const handleEditAllocation = async (data: AllocationFormData) => {
    if (!selectedAllocation) return false

    const success = await updateAllocation(selectedAllocation.id, data)
    if (success) {
      setIsEditDialogOpen(false)
      setSelectedAllocation(null)
      await fetchAllocations() // Refresh to get the latest data
    }
    return success
  }

  // Handle deleting an allocation
  const handleDeleteAllocation = async () => {
    if (!selectedAllocation) return

    const success = await deleteAllocation(selectedAllocation.id)
    if (success) {
      setIsDeleteDialogOpen(false)
      setSelectedAllocation(null)
      await fetchAllocations() // Refresh to get the latest data
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-gray-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Calculate current total excluding the selected allocation (for editing)
  const getCurrentTotalExcludingSelected = () => {
    if (!selectedAllocation) return totalPercentage

    // Only subtract if the allocation is active
    if (selectedAllocation.status === "active") {
      return totalPercentage - selectedAllocation.percentage
    }

    return totalPercentage
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Company & Project Allocations</h3>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Allocation
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Allocation Summary</CardTitle>
          <CardDescription>Current allocation: {totalPercentage}% of 100%</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={totalPercentage} className="h-2 mb-2" />
          <div className="text-xs text-muted-foreground">{100 - totalPercentage}% remaining</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">Loading allocations...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : filteredAllocations.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No {activeTab !== "all" ? activeTab : ""} allocations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{allocation.companyName}</TableCell>
                    <TableCell>{allocation.branchName}</TableCell>
                    <TableCell>{allocation.projectName || "-"}</TableCell>
                    <TableCell>{allocation.percentage}%</TableCell>
                    <TableCell>
                      {allocation.startDate ? format(new Date(allocation.startDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {allocation.endDate ? format(new Date(allocation.endDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(allocation.status)}</TableCell>
                    <TableCell>
                      {allocation.isPrimary ? <CheckCircle className="h-4 w-4 text-green-500" /> : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAllocation(allocation)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAllocation(allocation)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Allocation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Company Allocation</DialogTitle>
          </DialogHeader>
          <AllocationForm
            employeeId={employeeId}
            currentTotal={totalPercentage}
            onSubmit={handleAddAllocation}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company Allocation</DialogTitle>
          </DialogHeader>
          {selectedAllocation && (
            <AllocationForm
              employeeId={employeeId}
              allocation={selectedAllocation}
              currentTotal={getCurrentTotalExcludingSelected()}
              onSubmit={handleEditAllocation}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedAllocation(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this allocation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAllocation(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllocation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
