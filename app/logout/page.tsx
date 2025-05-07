import { logoutAction } from "@/actions/logout-action"

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
        <p className="mb-6">Click the button below to log out.</p>
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            Confirm Logout
          </button>
        </form>
      </div>
    </div>
  )
}
