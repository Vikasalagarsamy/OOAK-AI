import { logoutAction } from "@/actions/logout-action"
import { Button } from "@/components/ui/button"

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
          <p className="mb-6 text-gray-600">Click the button below to log out of your account.</p>
        </div>

        <form action={logoutAction}>
          <Button
            type="submit"
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md"
          >
            Confirm Logout
          </Button>
        </form>
      </div>
    </div>
  )
}
