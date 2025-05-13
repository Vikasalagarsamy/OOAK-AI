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
