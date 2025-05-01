"use client"

import { useState } from "react"
import type { Branch } from "@/types/company"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Mail, Phone, Edit, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BranchListProps {
  branches: Branch[]
  getCompanyName: (companyId: number) => string
  onEditBranch: (branch: Branch) => void
}

export default function BranchList({ branches, getCompanyName, onEditBranch }: BranchListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branch_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCompanyName(branch.company_id).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No branches added yet. Add your first branch to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Input
          placeholder="Search branches by name, code, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredBranches.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No branches found matching your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditBranch(branch)}
                    aria-label={`Edit ${branch.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {getCompanyName(branch.company_id)}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2 text-sm">
                  {branch.branch_code && (
                    <div className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {branch.branch_code}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {branch.address}
                  </div>
                  {branch.email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {branch.email}
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {branch.phone}
                    </div>
                  )}
                  {branch.is_remote && (
                    <div className="mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Remote Branch</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
