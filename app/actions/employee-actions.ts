"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateEmployeeId } from "@/utils/employee-id-generator"
import type { EmployeeFormData, EmployeeCompanyFormData } from "@/types/employee"

export async function getEmployees() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      companies(name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = data.map((employee) => ({
    ...employee,
    department_name: employee.departments?.name || "Not Assigned",
    designation_name: employee.designations?.name || "Not Assigned",
    home_branch_name: employee.branches?.name || "Not Assigned",
    primary_company_name: employee.companies?.name || "Not Assigned",
  }))

  return transformedData
}

export async function getEmployee(id: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      companies(name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching employee:", error)
    throw new Error(`Error fetching employee: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = {
    ...data,
    department_name: data.departments?.name || "Not Assigned",
    designation_name: data.designations?.name || "Not Assigned",
    home_branch_name: data.branches?.name || "Not Assigned",
    primary_company_name: data.companies?.name || "Not Assigned",
  }

  return transformedData
}

export async function getEmployeeCompanies(employeeId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employee_companies")
    .select(`
      *,
      companies(name),
      branches(name)
    `)
    .eq("employee_id", employeeId)
    .order("is_primary", { ascending: false })

  if (error) {
    console.error("Error fetching employee companies:", error)
    throw new Error(`Error fetching employee companies: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = data.map((employeeCompany) => ({
    ...employeeCompany,
    company_name: employeeCompany.companies?.name || "Unknown",
    branch_name: employeeCompany.branches?.name || "Unknown",
  }))

  return transformedData
}

export async function createEmployee(formData: EmployeeFormData) {
  const supabase = createClient()

  try {
    // Generate employee ID
    const employeeId = await generateEmployeeId(formData.primary_company_id, formData.first_name, formData.last_name)

    // Insert employee
    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_id: employeeId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        hire_date: formData.hire_date,
        termination_date: formData.termination_date || null,
        status: formData.status,
        department_id: formData.department_id,
        designation_id: formData.designation_id,
        job_title: formData.job_title,
        home_branch_id: formData.home_branch_id,
        primary_company_id: formData.primary_company_id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating employee: ${error.message}`)
    }

    // Create primary company allocation (100%)
    await supabase.from("employee_companies").insert({
      employee_id: data.id,
      company_id: formData.primary_company_id,
      branch_id: formData.home_branch_id || null,
      allocation_percentage: 100,
      is_primary: true,
    })

    revalidatePath("/people/employees")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEmployee(id: number, formData: EmployeeFormData) {
  const supabase = createClient()

  try {
    // Update employee
    const { data, error } = await supabase
      .from("employees")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        hire_date: formData.hire_date,
        termination_date: formData.termination_date || null,
        status: formData.status,
        department_id: formData.department_id,
        designation_id: formData.designation_id,
        job_title: formData.job_title,
        home_branch_id: formData.home_branch_id,
        primary_company_id: formData.primary_company_id,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating employee: ${error.message}`)
    }

    // Update primary company if changed
    const { data: primaryCompany } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("employee_id", id)
      .eq("is_primary", true)
      .single()

    if (primaryCompany && primaryCompany.company_id !== formData.primary_company_id) {
      await supabase
        .from("employee_companies")
        .update({
          company_id: formData.primary_company_id,
          branch_id: formData.home_branch_id || null,
        })
        .eq("id", primaryCompany.id)
    }

    revalidatePath(`/people/employees/${id}`)
    revalidatePath("/people/employees")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error updating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployee(id: number) {
  const supabase = createClient()

  try {
    // Delete employee companies first (foreign key constraint)
    await supabase.from("employee_companies").delete().eq("employee_id", id)

    // Delete employee
    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting employee: ${error.message}`)
    }

    revalidatePath("/people/employees")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting employee:", error)
    return { success: false, error: error.message }
  }
}

export async function addEmployeeCompany(employeeId: number, formData: EmployeeCompanyFormData) {
  const supabase = createClient()

  try {
    // Check if total allocation would exceed 100%
    const { data: existingAllocations } = await supabase
      .from("employee_companies")
      .select("allocation_percentage")
      .eq("employee_id", employeeId)
      .neq("company_id", formData.company_id) // Exclude the company we're adding/updating

    const totalExistingAllocation =
      existingAllocations?.reduce((sum, item) => sum + (item.allocation_percentage || 0), 0) || 0

    if (totalExistingAllocation + formData.allocation_percentage > 100) {
      throw new Error(
        `Total allocation would exceed 100%. Current total: ${totalExistingAllocation}%, Trying to add: ${formData.allocation_percentage}%`,
      )
    }

    // Check if this company already exists for this employee
    const { data: existingCompany } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("company_id", formData.company_id)
      .maybeSingle()

    let result

    if (existingCompany) {
      // Update existing allocation
      result = await supabase
        .from("employee_companies")
        .update({
          branch_id: formData.branch_id,
          allocation_percentage: formData.allocation_percentage,
          is_primary: formData.is_primary,
        })
        .eq("id", existingCompany.id)
        .select()
        .single()
    } else {
      // Insert new allocation
      result = await supabase
        .from("employee_companies")
        .insert({
          employee_id: employeeId,
          company_id: formData.company_id,
          branch_id: formData.branch_id,
          allocation_percentage: formData.allocation_percentage,
          is_primary: formData.is_primary,
        })
        .select()
        .single()
    }

    if (result.error) {
      throw new Error(`Error managing employee company: ${result.error.message}`)
    }

    // If this is the primary company, update employee record
    if (formData.is_primary) {
      // Update all other companies to not be primary
      await supabase
        .from("employee_companies")
        .update({ is_primary: false })
        .eq("employee_id", employeeId)
        .neq("company_id", formData.company_id)

      // Update employee record
      await supabase
        .from("employees")
        .update({
          primary_company_id: formData.company_id,
          home_branch_id: formData.branch_id,
        })
        .eq("id", employeeId)
    }

    revalidatePath(`/people/employees/${employeeId}`)
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("Error managing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function removeEmployeeCompany(employeeId: number, companyId: number) {
  const supabase = createClient()

  try {
    // Check if this is the primary company
    const { data: companyData } = await supabase
      .from("employee_companies")
      .select("is_primary")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .single()

    if (companyData?.is_primary) {
      throw new Error("Cannot remove primary company. Please assign a different primary company first.")
    }

    // Delete the company allocation
    const { error } = await supabase
      .from("employee_companies")
      .delete()
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)

    if (error) {
      throw new Error(`Error removing employee company: ${error.message}`)
    }

    revalidatePath(`/people/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error removing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function getDepartments() {
  const supabase = createClient()

  const { data, error } = await supabase.from("departments").select("*").order("name")

  if (error) {
    console.error("Error fetching departments:", error)
    throw new Error(`Error fetching departments: ${error.message}`)
  }

  return data
}

export async function getDesignations() {
  const supabase = createClient()

  const { data, error } = await supabase.from("designations").select("*").order("name")

  if (error) {
    console.error("Error fetching designations:", error)
    throw new Error(`Error fetching designations: ${error.message}`)
  }

  return data
}

export async function getBranches() {
  const supabase = createClient()

  const { data, error } = await supabase.from("branches").select("*").order("name")

  if (error) {
    console.error("Error fetching branches:", error)
    throw new Error(`Error fetching branches: ${error.message}`)
  }

  return data
}

export async function getCompanies() {
  const supabase = createClient()

  const { data, error } = await supabase.from("companies").select("*").order("name")

  if (error) {
    console.error("Error fetching companies:", error)
    throw new Error(`Error fetching companies: ${error.message}`)
  }

  return data
}
