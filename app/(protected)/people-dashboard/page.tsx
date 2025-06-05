import { createClient } from "@/lib/supabase"
import { PeopleDashboard } from "@/components/people-dashboard/people-dashboard"

export const dynamic = "force-dynamic"

async function getEmployeeData() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_comprehensive_employee_data")

  if (error) {
    console.error("Error fetching employee data:", error)
    return []
  }

  return data || []
}

export default async function PeopleDashboardPage() {
  const employeeData = await getEmployeeData()

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">People Dashboard</h1>
      <PeopleDashboard employeeData={employeeData} />
    </div>
  )
}
