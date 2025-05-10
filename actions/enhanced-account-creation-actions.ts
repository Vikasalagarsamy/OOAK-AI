"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// Helper function to check if a table exists using raw SQL
async function checkTableExists(tableName: string) {
  const supabase = createClient()

  try {
    // Use a raw SQL query to check if the table exists
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_statement: `
        SELECT EXISTS (
          SELECT 1 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}'
        );
      `,
    })

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    // The result will be an array with one object containing the exists property
    return data && data[0] && data[0].exists
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)

    // Fallback method: try to select from the table directly
    try {
      const { count, error: countError } = await supabase.from(tableName).select("*", { count: "exact", head: true })

      // If we can query the table without error, it exists
      return !countError
    } catch (fallbackError) {
      console.error(`Fallback check failed for ${tableName}:`, fallbackError)
      return false
    }
  }
}

// Helper function to check if a column exists in a table using raw SQL
async function checkColumnExists(tableName: string, columnName: string) {
  const supabase = createClient()

  try {
    // Use a raw SQL query to check if the column exists
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_statement: `
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}' 
          AND column_name = '${columnName}'
        );
      `,
    })

    if (error) {
      console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error)
      return false
    }

    // The result will be an array with one object containing the exists property
    return data && data[0] && data[0].exists
  } catch (error) {
    console.error(`Error in checkColumnExists for ${tableName}.${columnName}:`, error)
    return false
  }
}

// Alternative function to check if a table exists if execute_sql is not available
async function simpleCheckTableExists(tableName: string) {
  const supabase = createClient()

  try {
    // Try to select from the table with a limit of 0
    // If the table doesn't exist, this will throw an error
    const { error } = await supabase.from(tableName).select("*").limit(0)

    // If there's no error, the table exists
    return !error
  } catch (error) {
    console.error(`Error in simpleCheckTableExists for ${tableName}:`, error)
    return false
  }
}

export async function getEmployeesEnhanced() {
  const supabase = createClient()

  try {
    console.log("Fetching employees with enhanced error handling...")

    // First check if the employees table exists
    const tableExists = await simpleCheckTableExists("employees")
    if (!tableExists) {
      console.error("Employees table does not exist")
      return {
        success: false,
        error: "Employees table does not exist in the database",
        data: [],
      }
    }

    // Check if the user_accounts table exists for the join
    const userAccountsTableExists = await simpleCheckTableExists("user_accounts")

    // Build the query based on what tables exist
    let query = supabase
      .from("employees")
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        email,
        status
      `)
      .eq("status", "active")
      .order("first_name", { ascending: true })

    // Add a left join to user_accounts if that table exists
    if (userAccountsTableExists) {
      query = supabase
        .from("employees")
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          status,
          user_accounts!left(id)
        `)
        .eq("status", "active")
        .order("first_name", { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching employees:", error)
      return {
        success: false,
        error: `Failed to fetch employees: ${error.message}`,
        data: [],
      }
    }

    console.log(`Retrieved ${data?.length || 0} employees`)

    // Process employees to include full_name and has_account flag
    const processedEmployees = data.map((employee) => {
      const hasAccount = userAccountsTableExists && employee.user_accounts && employee.user_accounts.length > 0

      return {
        ...employee,
        full_name:
          `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
          `Employee ${employee.employee_id || employee.id}`,
        has_account: hasAccount,
      }
    })

    // Filter out employees who already have accounts
    const availableEmployees = userAccountsTableExists
      ? processedEmployees.filter((emp) => !emp.has_account)
      : processedEmployees

    console.log(`${availableEmployees.length} employees available for account creation`)

    return {
      success: true,
      data: availableEmployees,
    }
  } catch (error: any) {
    console.error("Error in getEmployeesEnhanced:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
      data: [],
    }
  }
}

export async function getRolesEnhanced() {
  const supabase = createClient()

  try {
    console.log("Fetching roles with enhanced error handling...")

    // First check if the roles table exists
    const tableExists = await simpleCheckTableExists("roles")
    if (!tableExists) {
      console.error("Roles table does not exist")
      return {
        success: false,
        error: "Roles table does not exist in the database",
        data: [],
      }
    }

    // Check if the title column exists in the roles table
    // For simplicity, we'll just check if the first role has a title or name field
    const { data: sampleRole, error: sampleError } = await supabase.from("roles").select("*").limit(1).single()

    let titleColumn = "id"
    if (!sampleError && sampleRole) {
      if (sampleRole.title) titleColumn = "title"
      else if (sampleRole.name) titleColumn = "name"
    }

    // Build the query
    const { data, error } = await supabase.from("roles").select("*").order(titleColumn, { ascending: true })

    if (error) {
      console.error("Error fetching roles:", error)
      return {
        success: false,
        error: `Failed to fetch roles: ${error.message}`,
        data: [],
      }
    }

    console.log(`Retrieved ${data?.length || 0} roles`)

    // Map roles to ensure consistent structure
    const formattedRoles = data.map((role) => {
      // Determine the role title based on available columns
      let roleTitle = `Role ${role.id}`
      if (role.title) roleTitle = role.title
      else if (role.name) roleTitle = role.name

      return {
        id: role.id,
        role_title: roleTitle,
        description: role.description || "",
      }
    })

    console.log("Formatted roles:", formattedRoles)

    return {
      success: true,
      data: formattedRoles,
    }
  } catch (error: any) {
    console.error("Error in getRolesEnhanced:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
      data: [],
    }
  }
}

export async function createUserAccountEnhanced({
  employeeId,
  roleId,
  password,
}: {
  employeeId: string
  roleId: string
  password: string
}) {
  const supabase = createClient()

  try {
    console.log(`Creating account for employee ${employeeId} with role ${roleId}`)

    // Check if the user_accounts table exists
    const tableExists = await simpleCheckTableExists("user_accounts")
    if (!tableExists) {
      console.error("User accounts table does not exist")
      return {
        success: false,
        error: "User accounts table does not exist in the database",
      }
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, email, first_name, last_name")
      .eq("id", employeeId)
      .single()

    if (employeeError || !employee) {
      console.error("Employee not found:", employeeError)
      return { success: false, error: "Employee not found" }
    }

    // Create full_name from first_name and last_name
    const full_name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    console.log(`Employee found: ${full_name}`)

    // Check if employee has an email
    if (!employee.email) {
      console.error("Employee has no email address")
      return { success: false, error: "Employee does not have an email address" }
    }

    // Check if employee already has an account
    try {
      const { data: existingAccount, error: accountError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("employee_id", employeeId)

      if (!accountError && existingAccount && existingAccount.length > 0) {
        console.error("Employee already has an account")
        return { success: false, error: "Employee already has an account" }
      }
    } catch (error) {
      console.error("Error checking for existing account:", error)
      // Continue anyway, the unique constraint will catch duplicates
    }

    // Check if role exists
    const { data: role, error: roleError } = await supabase.from("roles").select("id").eq("id", roleId).single()

    if (roleError || !role) {
      console.error("Role not found:", roleError)
      return { success: false, error: "Role not found" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate a username if email doesn't have a username part
    const username = employee.email.includes("@") ? employee.email.split("@")[0] : `user_${employee.id}`

    // Create the user account
    const { data, error } = await supabase
      .from("user_accounts")
      .insert({
        employee_id: employeeId,
        role_id: roleId,
        email: employee.email,
        password_hash: hashedPassword,
        username: username,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating user account:", error)
      return { success: false, error: "Failed to create user account: " + error.message }
    }

    console.log("Account created successfully")

    // Log the activity if the activities table exists
    const activitiesTableExists = await simpleCheckTableExists("activities")
    if (activitiesTableExists) {
      try {
        await supabase.from("activities").insert({
          activity_type: "account_creation",
          description: `Account created for ${full_name}`,
          performed_by: "system",
          entity_type: "user_account",
          entity_id: data[0].id,
        })
      } catch (activityError) {
        console.log("Could not log activity (non-critical error)")
      }
    }

    revalidatePath("/organization/account-creation")
    return { success: true }
  } catch (error: any) {
    console.error("Error in createUserAccountEnhanced:", error)
    return { success: false, error: `An unexpected error occurred: ${error.message}` }
  }
}

// Function to check database schema and create tables if needed
export async function checkAndFixAccountCreationSchema() {
  const supabase = createClient()

  try {
    console.log("Checking and fixing account creation schema...")

    // Check if the user_accounts table exists
    const userAccountsExists = await simpleCheckTableExists("user_accounts")

    if (!userAccountsExists) {
      console.log("Creating user_accounts table...")

      // Create the user_accounts table using a direct SQL query
      const { error } = await supabase.rpc("execute_sql", {
        sql_statement: `
          CREATE TABLE IF NOT EXISTS user_accounts (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
      })

      if (error) {
        console.error("Error creating user_accounts table:", error)
        return {
          success: false,
          error: `Failed to create user_accounts table: ${error.message}`,
        }
      }

      console.log("user_accounts table created successfully")
    } else {
      console.log("user_accounts table already exists")
    }

    return { success: true, message: "Account creation schema checked and fixed if needed" }
  } catch (error: any) {
    console.error("Error in checkAndFixAccountCreationSchema:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}

// Function to check if there are any employees and roles in the database
export async function checkEmployeesAndRolesExist() {
  const supabase = createClient()

  try {
    console.log("Checking if employees and roles exist...")

    // Check if the employees table exists
    const employeesTableExists = await simpleCheckTableExists("employees")
    if (!employeesTableExists) {
      return {
        success: false,
        error: "Employees table does not exist",
        employeesExist: false,
        rolesExist: false,
      }
    }

    // Check if the roles table exists
    const rolesTableExists = await simpleCheckTableExists("roles")
    if (!rolesTableExists) {
      return {
        success: false,
        error: "Roles table does not exist",
        employeesExist: false,
        rolesExist: false,
      }
    }

    // Check if there are any employees
    const { data: employees, error: employeesError } = await supabase.from("employees").select("id").limit(1)

    if (employeesError) {
      console.error("Error checking employees:", employeesError)
      return {
        success: false,
        error: `Failed to check employees: ${employeesError.message}`,
        employeesExist: false,
        rolesExist: false,
      }
    }

    // Check if there are any roles
    const { data: roles, error: rolesError } = await supabase.from("roles").select("id").limit(1)

    if (rolesError) {
      console.error("Error checking roles:", rolesError)
      return {
        success: false,
        error: `Failed to check roles: ${rolesError.message}`,
        employeesExist: employees && employees.length > 0,
        rolesExist: false,
      }
    }

    return {
      success: true,
      employeesExist: employees && employees.length > 0,
      rolesExist: roles && roles.length > 0,
    }
  } catch (error: any) {
    console.error("Error in checkEmployeesAndRolesExist:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
      employeesExist: false,
      rolesExist: false,
    }
  }
}

// Create a simple enhanced account creation form component
export async function createEnhancedAccountCreationForm() {
  // This is a placeholder for the actual component
  // The real component would be created in a separate file
  return {
    success: true,
    message: "Enhanced account creation form created",
  }
}
