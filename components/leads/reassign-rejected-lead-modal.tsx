"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Building, MapPin, RefreshCw, AlertCircle } from "lucide-react"
import { reassignRejectedLead } from "@/actions/lead-actions"
import { getCompaniesForReassignment, getBranchesForCompany } from "@/actions/rejected-leads-actions"

interface Company {
  id: number
  name: string
}

interface Branch {
  id: number
  name: string
  location?: string
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
  onReassignComplete?: () => void
  rejectionNotes?: string
}

export function ReassignRejectedLeadModal({
  lead,
  open,
  onOpenChange,
  onReassignComplete,
  rejectionNotes,
}: ReassignRejectedLeadModalProps) {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingCompanies, setFetchingCompanies] = useState(false)
  const [fetchingBranches, setFetchingBranches] = useState(false)

  // Reset selected values when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedCompanyId("")
      setSelectedBranchId("")
      setBranches([])
    } else {
      fetchCompanies()
    }
  }, [open, lead.company_id])

  // Fetch branches when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      fetchBranches(Number.parseInt(selectedCompanyId))
    } else {
      setBranches([])
      setSelectedBranchId("")
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    setFetchingCompanies(true)
    try {
      // Fetch companies excluding the current company
      const result = await getCompaniesForReassignment(lead.company_id)
      if (result.success) {
        setCompanies(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch companies",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      })
    } finally {
      setFetchingCompanies(false)
    }
  }

  const fetchBranches = async (companyId: number) => {
    setFetchingBranches(true)
    try {
      // Fetch branches for the selected company, excluding the current branch if it belongs to the same company
      const excludeBranchId = companyId === lead.company_id ? lead.branch_id : null
      const result = await getBranchesForCompany(companyId, excludeBranchId)
      if (result.success) {
        setBranches(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch branches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching branches:", error)
      toast({
        title: "Error",
        description: "Failed to fetch branches",
        variant: "destructive",
      })
    } finally {
      setFetchingBranches(false)
    }
  }

  const handleReassign = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Company required",
        description: "Please select a company to reassign this lead to",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const companyId = Number.parseInt(selectedCompanyId)
      const branchId = selectedBranchId && selectedBranchId !== "no-branch" ? Number.parseInt(selectedBranchId) : null

      const result = await reassignRejectedLead(lead.id, companyId, branchId, rejectionNotes)

      if (result.success) {
        toast({
          title: "Lead reassigned",
          description: `Lead ${lead.lead_number} has been reassigned successfully`,
        })
        if (onReassignComplete) {
          onReassignComplete()
        }
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
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reassign Rejected Lead
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
            <p>
              Lead <span className="font-medium">{lead.lead_number}</span> for{" "}
              <span className="font-medium">{lead.client_name}</span> has been rejected from{" "}
              <span className="font-medium">{lead.company_name || "current company"}</span>
              {lead.branch_name && (
                <>
                  {" "}
                  (<span className="font-medium">{lead.branch_name}</span>)
                </>
              )}
              .
            </p>
            {rejectionNotes && (
              <div className="mt-2">
                <p className="font-medium text-xs">Rejection reason:</p>
                <p className="text-xs mt-1 italic">{rejectionNotes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Select New Company
              </Label>
              {fetchingCompanies ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading companies...</span>
                </div>
              ) : (
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} disabled={loading}>
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Select a company" />
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

            <div className="space-y-2">
              <Label htmlFor="branch" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Branch (Optional)
              </Label>
              {fetchingBranches ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading branches...</span>
                </div>
              ) : (
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                  disabled={loading || !selectedCompanyId || branches.length === 0}
                >
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select a branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-branch">No specific branch</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                        {branch.location && ` - ${branch.location}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {companies.length === 0 && !fetchingCompanies && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p>There are no other companies available for reassignment. Please create a new company first.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={loading || !selectedCompanyId || companies.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reassign Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
