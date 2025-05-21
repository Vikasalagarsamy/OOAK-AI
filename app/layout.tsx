import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { initializeDatabase } from "@/lib/init-database"
import { FollowUpNotificationListener } from "@/components/follow-ups/follow-up-notification-listener"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ONE OF A KIND PORTAL",
  description: "Manage your company branches and employees efficiently",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
    generator: 'v0.dev'
}

// Initialize database tables during server startup, but don't block rendering
// This is a top-level await which will run before any requests are handled
try {
  initializeDatabase()
    .then((result) => {
      if (result && result.success) {
        console.log("Database initialization completed:", result.message)
        // Log details at debug level
        if (process.env.NODE_ENV !== "production") {
          console.log("Database initialization details:", JSON.stringify(result.details))
        }
      } else if (result) {
        console.warn("Database initialization issues:", result.message)
        // Log details at debug level
        if (process.env.NODE_ENV !== "production") {
          console.warn("Database initialization details:", JSON.stringify(result.details))
        }
      }
    })
    .catch((error) => {
      console.error("Error during database initialization:", error)
      // Application will continue despite the error
    })
} catch (error) {
  console.error("Critical error during database initialization setup:", error)
  // Application will continue despite the error
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="fixed top-0 left-0 w-full bg-blue-700 text-white py-2 px-4 text-center font-bold z-50 shadow-md">
          ONE OF A KIND PORTAL
        </div>
        <div className="pt-10">
          {" "}
          {/* Add padding to the top to account for the fixed banner */}
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
            <Toaster />
            <FollowUpNotificationListener />
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
