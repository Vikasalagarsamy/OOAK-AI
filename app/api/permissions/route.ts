import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get("resource")
  const action = searchParams.get("action")

  if (!resource || !action) {
    return new Response(
      JSON.stringify({
        hasPermission: false,
        error: "Missing resource or action parameter",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  try {
    const user = await getCurrentUser()

    // If no authenticated user, deny permission
    if (!user) {
      return new Response(
        JSON.stringify({
          hasPermission: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Check permission for authenticated user
    // const hasPermission = await checkPermission(resource, action)
    const supabase = createClient()

    // Use our new database function to check permissions
    const viewResult = await supabase.rpc("check_user_permission", {
      p_user_id: user.id,
      p_resource: resource,
      p_action: action,
    })

    if (viewResult.error) {
      console.error("Error checking permissions:", viewResult.error)
      return new Response(
        JSON.stringify({
          hasPermission: false,
          error: "Error checking permission",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const hasPermission = viewResult.data || false

    return new Response(JSON.stringify({ hasPermission }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Permission check error:", error)
    return new Response(
      JSON.stringify({
        hasPermission: false,
        error: "Error checking permission",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
