import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentEmployeeId } from "@/utils/get-current-employee"

export async function GET() {
  try {
    const employeeId = await getCurrentEmployeeId()

    if (!employeeId) {
      return NextResponse.json(
        {
          error: "Your account is not linked to an employee record. Please contact your administrator.",
        },
        { status: 403 },
      )
    }

    const supabase = createClient()

    // Use the correct column names based on the actual table structure
    let query = supabase.from("leads").select(`
      id,
      lead_number,
      client_name,
      email,
      phone,
      company_id,
      branch_id,
      status,
      created_at,
      updated_at,
      assigned_to,
      lead_source,
      location
    `)

    // Always filter by the current user's employee ID - no admin bypass
    query = query.eq("assigned_to", employeeId)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching leads:", error)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    // We also need to join with companies and branches to get their names
    if (data && data.length > 0) {
      // Get unique company IDs and branch IDs
      const companyIds = [...new Set(data.map((lead) => lead.company_id).filter(Boolean))]
      const branchIds = [...new Set(data.map((lead) => lead.branch_id).filter(Boolean))]

      // Fetch company names
      let companyNames = {}
      if (companyIds.length > 0) {
        const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds)

        if (companies) {
          companyNames = companies.reduce((acc, company) => {
            acc[company.id] = company.name
            return acc
          }, {})
        }
      }

      // Fetch branch names
      let branchNames = {}
      if (branchIds.length > 0) {
        const { data: branches } = await supabase.from("branches").select("id, name").in("id", branchIds)

        if (branches) {
          branchNames = branches.reduce((acc, branch) => {
            acc[branch.id] = branch.name
            return acc
          }, {})
        }
      }

      // Add company_name and branch_name to each lead
      data.forEach((lead) => {
        lead.company_name = lead.company_id ? companyNames[lead.company_id] || "Unknown" : null
        lead.branch_name = lead.branch_id ? branchNames[lead.branch_id] || null : null
      })
    }

    // Add debug information about the current user
    console.log(`Fetched ${data?.length || 0} leads for employee ID: ${employeeId}`)

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in my-leads API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
