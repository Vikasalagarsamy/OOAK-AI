"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, MapPin, Phone, Mail, User, RefreshCw, Zap, Gauge, ExternalLink } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import AddBranchForm from "@/components/add-branch-form"
import EditBranchModal from "@/components/edit-branch-modal"
import type { Company, Branch } from "@/types/company"
// Removed PostgreSQL import - using API calls instead
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function UltraFastBranches() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const { toast } = useToast()

  // Edit modal states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  const loadOrganizationData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🏢 Loading branches data via API...')
      
      const [companiesResponse, branchesResponse] = await Promise.all([
        fetch('/api/companies', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/branches', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ])
      
      if (!companiesResponse.ok || !branchesResponse.ok) {
        throw new Error(`API failed: Companies ${companiesResponse.status}, Branches ${branchesResponse.status}`)
      }
      
      const [companiesResult, branchesResult] = await Promise.all([
        companiesResponse.json(),
        branchesResponse.json()
      ])
      
      if (companiesResult?.success && branchesResult?.success) {
        setCompanies(companiesResult.companies || [])
        setBranches(branchesResult.branches || [])
        setLoadTime(Date.now() - startTime)
        setDataSource('database')
        
        console.log(`✅ Branches data loaded: ${companiesResult.companies?.length || 0} companies, ${branchesResult.branches?.length || 0} branches`)
        
        toast({
          title: "Success",
          description: `Loaded ${companiesResult.companies?.length || 0} companies and ${branchesResult.branches?.length || 0} branches`,
          variant: "default",
        })
      }
      
    } catch (error) {
      console.error('❌ Failed to load organization data:', error)
      setDataSource('fallback')
      toast({
        title: "Error",
        description: "Failed to load branches data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrganizationData()
  }, [])

  const addBranch = async (branch: Omit<Branch, "id" | "created_at" | "updated_at">) => {
    try {
      console.log(`🏢 Adding new branch: ${branch.name}`)
      
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branch)
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to add branch')
      }

      if (result.branch) {
        setBranches([...branches, result.branch])
        loadOrganizationData()
      }

      console.log(`✅ Branch added successfully: ${branch.name}`)
      return { success: true, data: result.branch }
    } catch (error) {
      console.error("❌ Error adding branch:", error)
      return { success: false, error }
    }
  }

  const updateBranch = async (id: number, updates: Partial<Branch>) => {
    try {
      console.log(`🔄 Updating branch ID: ${id}`)
      
      const response = await fetch("/api/branches/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates })
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update branch')
      }

      if (result.data && result.data.length > 0) {
        setBranches(branches.map((branch) => (branch.id === id ? { ...branch, ...result.data[0] } : branch)))
        loadOrganizationData()
      }

      console.log(`✅ Branch updated successfully: ID ${id}`)
      return { success: true, data: result.data }
    } catch (error) {
      console.error("❌ Error updating branch:", error)
      return { success: false, error }
    }
  }

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : "Unknown Company"
  }

  const getPerformanceGrade = () => {
    if (loadTime < 50) return 'A+'
    if (loadTime < 200) return 'A'
    if (loadTime < 500) return 'B'
    if (loadTime < 1000) return 'C'
    return 'F'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading branches...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Branches</h1>
            <p className="text-muted-foreground">Manage your organization's branch locations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Grade {getPerformanceGrade()}</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Gauge className="h-3 w-3" />
              <span>{loadTime}ms</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrganizationData(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="branches">View Branches</TabsTrigger>
          <TabsTrigger value="add-branch">Add Branch</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>All Branches ({branches.length})</span>
              </CardTitle>
              <CardDescription>
                Complete list of all branch locations across companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No branches found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCompanyName(branch.company_id)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{branch.address || 'No address'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {branch.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{branch.phone}</span>
                              </div>
                            )}
                            {branch.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{branch.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBranch(branch)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-branch">
          <AddBranchForm companies={companies} onAddBranch={addBranch} />
        </TabsContent>
      </Tabs>

      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          companies={companies}
          open={!!editingBranch}
          onOpenChange={(open) => !open && setEditingBranch(null)}
          onUpdateBranch={updateBranch}
        />
      )}
    </div>
  )
}

export default UltraFastBranches
