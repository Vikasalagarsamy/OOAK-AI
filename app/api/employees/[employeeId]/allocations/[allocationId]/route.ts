import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/postgresql-client"
import { cookies } from "next/headers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<any> },
) {
  const resolvedParams = await params
    const { employeeId, allocationId } = resolvedParams
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const requestData = await request.json()

    // If this is marked as primary, update all other allocations to not be primary
    if (requestData.isPrimary) {
      const { error: updateError } = await supabase
        .from("employee_companies")
        .update({ is_primary: false })
        .eq("employee_id", employeeId)
        .neq("id", allocationId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Prepare the update data
    const updateData: Record<string, any> = {}

    if (requestData.companyId !== undefined) updateData.company_id = requestData.companyId
    if (requestData.branchId !== undefined) updateData.branch_id = requestData.branchId
    if (requestData.projectId !== undefined) updateData.project_id = requestData.projectId || null
    if (requestData.percentage !== undefined) updateData.percentage = requestData.percentage
    if (requestData.isPrimary !== undefined) updateData.is_primary = requestData.isPrimary
    if (requestData.startDate !== undefined) updateData.start_date = requestData.startDate
    if (requestData.endDate !== undefined) updateData.end_date = requestData.endDate

    // Update the allocation status based on dates
    if (requestData.startDate || requestData.endDate) {
      const now = new Date()
      const startDate = requestData.startDate ? new Date(requestData.startDate) : null
      const endDate = requestData.endDate ? new Date(requestData.endDate) : null

      if (endDate && endDate < now) {
        updateData.status = "completed"
      } else if (startDate && startDate > now) {
        updateData.status = "pending"
      } else {
        updateData.status = "active"
      }
    }

    // Update the allocation
    const { data, error } = await supabase
      .from("employee_companies")
      .update(updateData)
      .eq("id", allocationId)
      .eq("employee_id", employeeId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> },
) {
  const resolvedParams = await params
    const { employeeId, allocationId } = resolvedParams
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Delete the allocation
    const { error } = await supabase
      .from("employee_companies")
      .delete()
      .eq("id", allocationId)
      .eq("employee_id", employeeId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
