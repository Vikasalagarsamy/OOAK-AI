"use client"

import CompanyManager from "@/components/company-manager"

export default function CompaniesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Companies Management</h1>
        <p className="text-muted-foreground">Manage your companies, branches, and organizational structure.</p>
      </div>
      
      <CompanyManager />
    </div>
  )
}
