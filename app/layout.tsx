import type React from "react"
import "./globals.css"
import { Inter, Dancing_Script } from "next/font/google"
import { Toaster } from "@/components/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { initializeDatabase } from "@/lib/init-database"
import { FollowUpNotificationListener } from "@/components/follow-ups/follow-up-notification-listener"

const inter = Inter({ subsets: ["latin"] })
const dancingScript = Dancing_Script({ 
  subsets: ["latin"], 
  variable: "--font-dancing-script",
  display: "swap"
})

export const metadata = {
  title: "Business Management System",
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
try {
  initializeDatabase()
    .then((result) => {
      if (result?.success) {
        console.log("✅ Database initialization completed:", result.message)
      } else if (result) {
        console.warn("⚠️ Database initialization issues:", result.message)
      }
    })
    .catch((error) => {
      console.error("❌ Error during database initialization:", error)
    })
} catch (error) {
  console.error("❌ Critical error during database initialization:", error)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dancingScript.variable}`} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster />
          <FollowUpNotificationListener />
        </ThemeProvider>
      </body>
    </html>
  )
}
