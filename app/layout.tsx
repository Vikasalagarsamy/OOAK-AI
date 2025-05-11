import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionRefresh } from "@/components/session-refresh"
import { ToasterWrapper } from "@/components/toaster-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Photography Portal",
  description: "Management portal for photography business",
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
        <SessionRefresh />
        <ToasterWrapper>{children}</ToasterWrapper>
      </body>
    </html>
  )
}
