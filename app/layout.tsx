import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { StaticNavigation } from "@/components/static-navigation"
import { RoleProvider } from "@/contexts/role-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Photography Portal",
  description: "Secure login for photography management",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoleProvider>
          <StaticNavigation />
          <main>{children}</main>
          <Toaster />
        </RoleProvider>
      </body>
    </html>
  )
}
