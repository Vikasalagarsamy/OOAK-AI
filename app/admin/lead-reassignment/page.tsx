import { TestLeadReassignment } from "@/components/admin/test-lead-reassignment"
import { ReassignmentPerformanceDashboard } from "@/components/admin/reassignment-performance-dashboard"

export default function LeadReassignmentPage() {
  return (
    <div className="container mx-auto py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Lead Reassignment Management</h1>
        <p className="text-gray-500">Monitor and test the automatic lead reassignment system</p>
      </div>

      <ReassignmentPerformanceDashboard />

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Testing Tools</h2>
        <TestLeadReassignment />
      </div>
    </div>
  )
}
