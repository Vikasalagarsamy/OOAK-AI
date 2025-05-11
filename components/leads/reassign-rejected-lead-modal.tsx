"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Building, MapPin, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { reassignRejectedLead } from "@/actions/lead-actions"
import { createClient } from "@/lib/supabase"

interface Company {
  id: number
  name: string
}

interface Branch {
  id: number
  name: string
  company_id: number
}

interface ReassignRejectedLeadModalProps {
  lead: {
    id: number
    lead_number: string
    client_name: string
    company_id: number
    company_name?: string
    branch_id?: number | null
    branch_name?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onReassignComplete: () => void
  rejectionNotes?: string // Add this prop to receive rejection notes
}

export function ReassignRejectedLeadModal({
  lead,
  open,
  onOpenChange,
  onReassignComplete,
  rejectionNotes = "", // Default to empty string
}: ReassignRejectedLeadModalProps) {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [rejectionReason, setRejectionReason] = useState(rejectionNotes) // Initialize with passed notes
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Update rejection reason when rejectionNotes prop changes
  useEffect(() => {
    setRejectionReason(rejectionNotes)
  }, [rejectionNotes])

  // Fetch companies and branches when the modal opens
  useEffect(() => {
    if (open) {
      fetchCompaniesAndBranches()
    }
  }, [open])

  // Filter branches when company selection changes
  useEffect(() => {
    if (selectedCompanyId) {
      const companyId = Number.parseInt(selectedCompanyId)
      setFilteredBranches(branches.filter((branch) => branch.company_id === companyId))
      setSelectedBranchId("") // Reset branch selection when company changes
    } else {
      setFilteredBranches([])
    }
  }, [selectedCompanyId, branches])

  const fetchCompaniesAndBranches = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active")
        .order("name")

      if (companiesError) {
        throw companiesError
      }

      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("id, name, company_id")
        .eq("status", "active")
        .order("name")

      if (branchesError) {
        throw branchesError
      }

      // Filter out the current company
      const filteredCompanies = companiesData.filter((company) => company.id !== lead.company_id)
      setCompanies(filteredCompanies)
      setBranches(branchesData || [])
    } catch (error) {
      console.error("Error fetching companies and branches:", error)
      toast({
        title: "Error",
        description: "Failed to load companies and branches",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Company required",
        description: "Please select a company for reassignment",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await reassignRejectedLead(
        lead.id,
        Number.parseInt(selectedCompanyId),
        selectedBranchId ? Number.parseInt(selectedBranchId) : null,
        rejectionReason,
      )

      if (result.success) {
        toast({
          title: "Lead reassigned",
          description: `Lead ${lead.lead_number} has been reassigned and marked as unassigned`,
        })
        onReassignComplete()
        onOpenChange(false)
      } else {
        toast({
          title: "Reassignment failed",
          description: result.message || "Failed to reassign lead",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error reassigning lead:", error)
      toast({
        title: "Reassignment failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Reassign Rejected Lead
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
            <p>
              Lead <span className="font-medium">{lead.lead_number}</span> for{" "}
              <span className="font-medium">{lead.client_name}</span> has been rejected from{" "}
              <span className="font-medium">{lead.company_name || "Current Company"}</span>
              {lead.branch_name && (
                <>
                  {" "}
                  (<span className="font-medium">{lead.branch_name}</span>)
                </>
              )}
              .
            </p>
            <p className="mt-1">Please reassign this lead to a different company.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              New Company
            </Label>
            {isLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading companies...</span>
              </div>
            ) : (
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="no-companies" disabled>
                      No other companies available
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
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              New Branch (Optional)
            </Label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              disabled={!selectedCompanyId || isLoading}
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-branch">No specific branch</SelectItem>
                {filteredBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Why was this lead rejected? This information will help with reassignment."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedCompanyId || companies.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reassign Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
