"use client"

import { useState } from "react"
import type { Designation } from "@/types/designation"
import type { Department } from "@/types/department"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Plus, Search, Trash2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DesignationListProps {
  designations: Designation[]
  departments: Department[]
  onEditDesignation: (designation: Designation) => void
  onAddDesignation: () => void
  onDeleteDesignation: (id: number) => Promise<{ success: boolean }>
}

export default function DesignationList({
  designations,
  departments,
  onEditDesignation,
  onAddDesignation,
  onDeleteDesignation,
}: DesignationListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const filteredDesignations = designations.filter((designation) => {
    // Search filter
    const matchesSearch =
      designation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      designation.description?.toLowerCase().includes(searchTerm.toLowerCase())

    // Department filter
    const matchesDepartment =
      departmentFilter === "all" ||
      (departmentFilter === "none" && !designation.department_id) ||
      designation.department_id?.toString() === departmentFilter

    return matchesSearch && matchesDepartment
  })

  const getDepartmentName = (departmentId?: number) => {
    if (!departmentId) return "—"
    const department = departments.find((d) => d.id === departmentId)
    return department ? department.name : "Unknown Department"
  }

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const result = await onDeleteDesignation(deletingId)

      if (result.success) {
        toast({
          title: "Designation deleted",
          description: "The designation has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete designation. It may be in use by employees.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting designation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  if (designations.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Designations</CardTitle>
          <Button onClick={onAddDesignation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Designation
          </Button>
        </CardHeader>
        <CardContent className="pt-0 text-center">
          <p className="text-muted-foreground">No designations added yet. Add your first designation to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="none">No Department</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id.toString()}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAddDesignation} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Button>
      </div>

      {filteredDesignations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No designations found matching your search.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignations.map((designation) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium">{designation.name}</TableCell>
                    <TableCell>{getDepartmentName(designation.department_id)}</TableCell>
                    <TableCell>{designation.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEditDesignation(designation)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(designation.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the designation and may affect employees
              associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
