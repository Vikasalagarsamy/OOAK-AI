import type { Metadata } from "next"
import { AdminLoginForm } from "@/components/admin/login-form"
import { Logo } from "@/components/logo"

export const metadata: Metadata = {
  title: "Admin Login | Company Management System",
  description: "Secure login portal for system administrators",
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Administrator Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Secure access for system administrators</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  )
}
