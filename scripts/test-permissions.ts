import { supabase } from "@/lib/supabase-singleton"
import { hasPermission, checkPermissions } from "@/lib/permission-utils"

async function testPermissions() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.from("users").select("id, email")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return
    }

    console.log(`Testing permissions for ${users.length} users`)

    for (const user of users) {
      console.log(`\nUser: ${user.email}`)

      // Test individual permission checks
      console.log("Testing individual permissions:")
      const employeesView = await hasPermission(String(user.id), "/people/employees", "view")
      const departmentsView = await hasPermission(String(user.id), "/people/departments", "view")
      const designationsView = await hasPermission(String(user.id), "/people/designations", "view")

      console.log(`- /people/employees.view: ${employeesView}`)
      console.log(`- /people/departments.view: ${departmentsView}`)
      console.log(`- /people/designations.view: ${designationsView}`)

      // Test batch permission checks
      const batchResults = await checkPermissions(String(user.id), [
        { path: "/people/employees", action: "view" },
        { path: "/people/departments", action: "view" },
        { path: "/people/designations", action: "view" },
      ])

      console.log("Batch results:")
      console.log(batchResults)
    }

    console.log("\nPermission testing complete")
  } catch (error) {
    console.error("Error testing permissions:", error)
  }
}

testPermissions()
