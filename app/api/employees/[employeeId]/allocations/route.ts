import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { employeeId: string } }) {
  const employeeId = params.employeeId
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Fetch all allocations for the employee, including company and branch details
    const { data, error } = await supabase
      .from("employee_companies")
      .select(`
        id,
        employee_id,
        company_id,
        companies(name),
        branch_id,
        branches(name),
        project_id,
        projects(name),
        percentage,
        is_primary,
        start_date,
        end_date,
        status
      `)
      .eq("employee_id", employeeId)
      .order("is_primary", { ascending: false })

    if (error) {
      console.error("Error fetching allocations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedData = data.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      companyId: item.company_id,
      companyName: item.companies?.name || "Unknown Company",
      branchId: item.branch_id,
      branchName: item.branches?.name || "Unknown Branch",
      projectId: item.project_id || undefined,
      projectName: item.projects?.name || undefined,
      percentage: item.percentage || 0,
      isPrimary: item.is_primary || false,
      startDate: item.start_date || null,
      endDate: item.end_date || null,
      status: item.status || "active",
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { employeeId: string } }) {
  const employeeId = params.employeeId
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const requestData = await request.json()

    // Validate the request data
    if (!requestData.companyId || !requestData.branchId) {
      return NextResponse.json({ error: "Company and branch are required" }, { status: 400 })
    }

    // Check if the total allocation would exceed 100%
    const { data: existingAllocations, error: fetchError } = await supabase
      .from("employee_companies")
      .select("percentage, start_date, end_date")
      .eq("employee_id", employeeId)
      .is("end_date", null)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Calculate current total allocation for active allocations
    const currentTotal = existingAllocations.reduce((sum, allocation) => sum + (allocation.percentage || 0), 0)

    if (currentTotal + requestData.percentage > 100) {
      return NextResponse.json({ error: "Total allocation cannot exceed 100%" }, { status: 400 })
    }

    // If this is marked as primary, update all other allocations to not be primary
    if (requestData.isPrimary) {
      const { error: updateError } = await supabase
        .from("employee_companies")
        .update({ is_primary: false })
        .eq("employee_id", employeeId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Insert the new allocation
    const { data, error: insertError } = await supabase
      .from("employee_companies")
      .insert({
        employee_id: employeeId,
        company_id: requestData.companyId,
        branch_id: requestData.branchId,
        project_id: requestData.projectId || null,
        percentage: requestData.percentage,
        is_primary: requestData.isPrimary || false,
        start_date: requestData.startDate || null,
        end_date: requestData.endDate || null,
        status: "active", // Default status
      })
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
