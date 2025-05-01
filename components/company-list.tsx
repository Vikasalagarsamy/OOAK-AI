"use client"

import { useState } from "react"
import type { Company, Branch } from "@/types/company"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ChevronDown, ChevronRight, MapPin, Mail, Phone, Edit, MoreVertical, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CompanyListProps {
  companies: Company[]
  getBranchesForCompany: (companyId: number) => Branch[]
  onEditCompany: (company: Company) => void
  onEditBranch: (branch: Branch) => void
}

export default function CompanyList({
  companies,
  getBranchesForCompany,
  onEditCompany,
  onEditBranch,
}: CompanyListProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Record<number, boolean>>({})

  const toggleCompany = (companyId: number) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }))
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No companies added yet. Add your first company to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => {
        const branches = getBranchesForCompany(company.id)

        return (
          <Card key={company.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{company.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditCompany(company)}
                    aria-label={`Edit ${company.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleCompany(company.id)}
                    aria-expanded={expandedCompanies[company.id]}
                    aria-label={expandedCompanies[company.id] ? "Collapse branches" : "Expand branches"}
                  >
                    {expandedCompanies[company.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription>{company.address}</CardDescription>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                {company.company_code && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs bg-gray-100 px-2 py-0.5 rounded">
                      Code: {company.company_code}
                    </span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {company.email}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {company.phone}
                  </div>
                )}
              </div>
            </CardHeader>

            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                expandedCompanies[company.id] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <CardContent className="pt-0 pb-3">
                  <h3 className="text-sm font-medium mb-2">Branches ({branches.length})</h3>
                  {branches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No branches added yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {branches.map((branch) => (
                        <li key={branch.id} className="bg-muted/50 p-3 rounded-md relative">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{branch.name}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditBranch(branch)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Branch
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {branch.branch_code && (
                            <div className="flex items-center gap-1 mt-1">
                              <Hash className="h-3 w-3" />
                              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {branch.branch_code}
                              </span>
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {branch.address}
                          </div>
                          {branch.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {branch.email}
                            </div>
                          )}
                          {branch.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {branch.phone}
                            </div>
                          )}
                          {branch.is_remote && (
                            <div className="mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Remote Branch
                              </span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
