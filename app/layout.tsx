import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { initializeDatabase } from "@/lib/init-database"
import { FollowUpNotificationListener } from "@/components/follow-ups/follow-up-notification-listener"
import { RoleProvider } from "@/contexts/role-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Company Branch Manager",
  description: "Manage your company branches and employees efficiently",
    generator: 'v0.dev'
}

// Initialize database tables during server startup
// This is a top-level await which will run before any requests are handled
initializeDatabase()
  .then((result) => {
    if (result && result.success) {
      console.log("Database initialized successfully:", result.message)
    } else if (result) {
      console.error("Database initialization issues:", result.message, JSON.stringify(result.details))
    } else {
      console.error("Database initialization failed with unknown error")
    }
  })
  .catch((error) => {
    console.error("Error initializing database:", error)
  })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RoleProvider>
            {children}
            <Toaster />
            <FollowUpNotificationListener />
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
