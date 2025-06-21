"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"
import { Plus, Filter, Download, Save, Trash2, Settings, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SavedReport {
  id: string
  name: string
  description: string
  lastModified: string
  filters: ReportFilters
  columns: string[]
}

interface ReportFilters {
  dateRange: string
  leadSource: string[]
  assignedEmployee: string[]
  status: string[]
  includeRevenue: boolean
  includeConversions: boolean
  groupBy: string
}

interface ReportData {
  headers: string[]
  rows: any[][]
  summary: {
    totalRecords: number
    totalRevenue: number
    averageConversion: number
  }
}

export function CustomReportsGenerator() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [currentReport, setCurrentReport] = useState<ReportFilters>({
    dateRange: 'last30days',
    leadSource: [],
    assignedEmployee: [],
    status: [],
    includeRevenue: true,
    includeConversions: true,
    groupBy: 'none'
  })
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
    loadSavedReports()
  }, [])

  const loadInitialData = async () => {
    try {
      // Load employees and lead sources
      const [employeesRes, leadsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/leads')
      ])
      
      if (employeesRes.ok && leadsRes.ok) {
        const employees = await employeesRes.json()
        const leads = await leadsRes.json()
        
        setAvailableEmployees(employees.data || [])
        
        const sources = [...new Set(leads.data?.map((lead: any) => lead.lead_source).filter(Boolean))]
        setAvailableSources(sources)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadSavedReports = () => {
    // Load from localStorage for demo purposes
    const saved = localStorage.getItem('customReports')
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load saved reports:', error)
      }
    } else {
      // Add some sample reports
      const sampleReports: SavedReport[] = [
        {
          id: '1',
          name: 'Monthly Conversion by Source',
          description: 'Shows conversion rates by lead source over the last 30 days',
          lastModified: '3 days ago',
          filters: {
            dateRange: 'last30days',
            leadSource: [],
            assignedEmployee: [],
            status: ['quotation_generated', 'quotation_approved'],
            includeRevenue: true,
            includeConversions: true,
            groupBy: 'source'
          },
          columns: ['Source', 'Leads', 'Conversions', 'Rate', 'Revenue']
        },
        {
          id: '2',
          name: 'Team Performance Q4',
          description: 'Detailed breakdown of team performance metrics for Q4',
          lastModified: '1 week ago',
          filters: {
            dateRange: 'last90days',
            leadSource: [],
            assignedEmployee: [],
            status: [],
            includeRevenue: true,
            includeConversions: true,
            groupBy: 'employee'
          },
          columns: ['Employee', 'Leads Assigned', 'Quotes Generated', 'Conversions', 'Revenue']
        }
      ]
      setSavedReports(sampleReports)
      localStorage.setItem('customReports', JSON.stringify(sampleReports))
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      console.log('🔍 Generating custom report...')
      
      // Fetch data based on filters
      const [leadsRes, salesRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/sales/batch?sections=analytics')
      ])
      
      if (!leadsRes.ok || !salesRes.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const [leadsData, salesData] = await Promise.all([
        leadsRes.json(),
        salesRes.json()
      ])
      
      const leads = leadsData.data || []
      
      // Apply filters
      let filteredLeads = leads
      
      if (currentReport.leadSource.length > 0) {
        filteredLeads = filteredLeads.filter((lead: any) => 
          currentReport.leadSource.includes(lead.lead_source)
        )
      }
      
      if (currentReport.assignedEmployee.length > 0) {
        filteredLeads = filteredLeads.filter((lead: any) => 
          currentReport.assignedEmployee.includes(lead.assigned_to?.toString())
        )
      }
      
      if (currentReport.status.length > 0) {
        filteredLeads = filteredLeads.filter((lead: any) => {
          if (currentReport.status.includes('quotation_generated') && (lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION' || lead.status === 'WON')) return true
          if (currentReport.status.includes('quotation_approved') && lead.status === 'WON') return true
          if (currentReport.status.includes('new') && (lead.status === 'NEW' || lead.status === 'ASSIGNED' || lead.status === 'CONTACTED')) return true
          return false
        })
      }
      
      // Generate report data based on groupBy
      let headers: string[] = []
      let rows: any[][] = []
      
      if (currentReport.groupBy === 'source') {
        headers = ['Lead Source', 'Total Leads', 'Quotations Generated', 'Conversions', 'Conversion Rate']
        if (currentReport.includeRevenue) headers.push('Revenue')
        
        const sourceGroups = filteredLeads.reduce((acc: any, lead: any) => {
          const source = lead.lead_source || 'Unknown'
          if (!acc[source]) {
            acc[source] = { leads: 0, quotations: 0, conversions: 0, revenue: 0 }
          }
          acc[source].leads++
          if (lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION' || lead.status === 'WON') acc[source].quotations++
          if (lead.status === 'WON') {
            acc[source].conversions++
            acc[source].revenue += 50000 // Mock revenue for won leads
          }
          return acc
        }, {})
        
        rows = Object.entries(sourceGroups).map(([source, data]: [string, any]) => {
          const conversionRate = data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0
          const row = [source, data.leads, data.quotations, data.conversions, `${conversionRate}%`]
          if (currentReport.includeRevenue) row.push(`₹${data.revenue.toLocaleString('en-IN')}`)
          return row
        })
        
      } else if (currentReport.groupBy === 'employee') {
        headers = ['Employee', 'Leads Assigned', 'Quotations Generated', 'Conversions', 'Conversion Rate']
        if (currentReport.includeRevenue) headers.push('Revenue')
        
        const employeeGroups = filteredLeads.reduce((acc: any, lead: any) => {
          const employeeId = lead.assigned_to || 'Unassigned'
          const employeeName = availableEmployees.find(emp => emp.id === employeeId)?.display_name || 'Unassigned'
          
          if (!acc[employeeName]) {
            acc[employeeName] = { leads: 0, quotations: 0, conversions: 0, revenue: 0 }
          }
          acc[employeeName].leads++
          if (lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION' || lead.status === 'WON') acc[employeeName].quotations++
          if (lead.status === 'WON') {
            acc[employeeName].conversions++
            acc[employeeName].revenue += 50000 // Mock revenue for won leads
          }
          return acc
        }, {})
        
        rows = Object.entries(employeeGroups).map(([employee, data]: [string, any]) => {
          const conversionRate = data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0
          const row = [employee, data.leads, data.quotations, data.conversions, `${conversionRate}%`]
          if (currentReport.includeRevenue) row.push(`₹${data.revenue.toLocaleString('en-IN')}`)
          return row
        })
        
      } else {
        // Default: show individual leads
        headers = ['Lead ID', 'Name', 'Source', 'Assigned Employee', 'Status']
        if (currentReport.includeRevenue) headers.push('Quotation Value')
        
        rows = filteredLeads.map((lead: any) => {
          const employeeName = availableEmployees.find(emp => emp.id === lead.assigned_to)?.display_name || 'Unassigned'
          const status = lead.status === 'WON' ? 'Converted' : 
                       (lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION') ? 'Quoted' : 'New'
          
          const row = [lead.id, lead.client_name, lead.lead_source || 'Unknown', employeeName, status]
          if (currentReport.includeRevenue) row.push(lead.status === 'WON' ? '₹50,000' : '₹0')
          return row
        })
      }
      
      const summary = {
        totalRecords: filteredLeads.length,
        totalRevenue: filteredLeads.reduce((sum: number, lead: any) => 
          sum + (lead.status === 'WON' ? 50000 : 0), 0),
        averageConversion: filteredLeads.length > 0 ? 
          Math.round((filteredLeads.filter((lead: any) => lead.status === 'WON').length / filteredLeads.length) * 100) : 0
      }
      
      setGeneratedReport({ headers, rows, summary })
      console.log(`✅ Report generated: ${filteredLeads.length} records`)
      
      toast({
        title: "Report Generated",
        description: `Successfully generated report with ${filteredLeads.length} records`,
      })
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveReport = () => {
    if (!reportName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report name",
        variant: "destructive",
      })
      return
    }
    
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      lastModified: 'Just now',
      filters: { ...currentReport },
      columns: generatedReport?.headers || []
    }
    
    const updatedReports = [...savedReports, newReport]
    setSavedReports(updatedReports)
    localStorage.setItem('customReports', JSON.stringify(updatedReports))
    
    setReportName('')
    setReportDescription('')
    
    toast({
      title: "Success",
      description: "Report saved successfully",
    })
  }

  const loadReport = (report: SavedReport) => {
    setCurrentReport(report.filters)
    setReportName(report.name)
    setReportDescription(report.description)
    
    toast({
      title: "Report Loaded",
      description: `Loaded configuration for "${report.name}"`,
    })
  }

  const deleteReport = (reportId: string) => {
    const updatedReports = savedReports.filter(r => r.id !== reportId)
    setSavedReports(updatedReports)
    localStorage.setItem('customReports', JSON.stringify(updatedReports))
    
    toast({
      title: "Success",
      description: "Report deleted successfully",
    })
  }

  const exportReport = () => {
    if (!generatedReport) return
    
    // Create CSV content
    const csvContent = [
      generatedReport.headers.join(','),
      ...generatedReport.rows.map(row => row.join(','))
    ].join('\n')
    
    // Download as CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportName || 'custom-report'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Success",
      description: "Report exported as CSV",
    })
  }

  return (
    <div className="space-y-6">
      <ReportsHeader title="Custom Reports" />
      <ReportsSubmenu />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">📊 Saved Reports</h2>
        <Button onClick={() => setReportName('')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedReports.map((report) => (
          <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {report.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteReport(report.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardTitle>
              <CardDescription>{report.description}</CardDescription>
              <Badge variant="outline">Last modified: {report.lastModified}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => loadReport(report)}>
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Load
                </Button>
                <Button variant="outline" size="sm" onClick={() => { loadReport(report); generateReport(); }}>
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center p-6">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground font-medium">Create New Report</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🛠️ Report Builder</CardTitle>
          <CardDescription>Configure your custom report parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>
              
              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Input
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Brief description of the report"
                />
              </div>

              <div>
                <Label>Date Range</Label>
                <Select value={currentReport.dateRange} onValueChange={(value) => 
                  setCurrentReport(prev => ({ ...prev, dateRange: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last90days">Last 90 days</SelectItem>
                    <SelectItem value="last12months">Last 12 months</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Group By</Label>
                <Select value={currentReport.groupBy} onValueChange={(value) => 
                  setCurrentReport(prev => ({ ...prev, groupBy: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Individual Records</SelectItem>
                    <SelectItem value="source">Lead Source</SelectItem>
                    <SelectItem value="employee">Assigned Employee</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Lead Sources (optional)</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {availableSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source}`}
                        checked={currentReport.leadSource.includes(source)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCurrentReport(prev => ({
                              ...prev,
                              leadSource: [...prev.leadSource, source]
                            }))
                          } else {
                            setCurrentReport(prev => ({
                              ...prev,
                              leadSource: prev.leadSource.filter(s => s !== source)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`source-${source}`} className="text-sm">{source}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Include Options</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRevenue"
                      checked={currentReport.includeRevenue}
                      onCheckedChange={(checked) => 
                        setCurrentReport(prev => ({ ...prev, includeRevenue: !!checked }))
                      }
                    />
                    <Label htmlFor="includeRevenue" className="text-sm">Include Revenue Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeConversions"
                      checked={currentReport.includeConversions}
                      onCheckedChange={(checked) => 
                        setCurrentReport(prev => ({ ...prev, includeConversions: !!checked }))
                      }
                    />
                    <Label htmlFor="includeConversions" className="text-sm">Include Conversion Metrics</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setCurrentReport({
                dateRange: 'last30days',
                leadSource: [],
                assignedEmployee: [],
                status: [],
                includeRevenue: true,
                includeConversions: true,
                groupBy: 'none'
              })
              setReportName('')
              setReportDescription('')
              setGeneratedReport(null)
            }}>
              Clear
            </Button>
            
            {generatedReport && (
              <>
                <Button variant="outline" onClick={saveReport}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </>
            )}
            
            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedReport && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Generated Report</CardTitle>
            <CardDescription>
              {generatedReport.summary.totalRecords} records • 
              ₹{generatedReport.summary.totalRevenue.toLocaleString('en-IN')} revenue • 
              {generatedReport.summary.averageConversion}% avg conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {generatedReport.headers.map((header, index) => (
                      <th key={index} className="text-left p-2 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.rows.slice(0, 50).map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {generatedReport.rows.length > 50 && (
                <div className="text-center py-4 text-muted-foreground">
                  Showing first 50 of {generatedReport.rows.length} records. Export to see all.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 