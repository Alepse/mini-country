import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import BackgroundBeams from "@/components/background-beams"

export const metadata: Metadata = {
  title: "Mini-Country",
  description: "Search the world by country",
  icons: { icon: "/favicon.svg" },
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <div className="relative min-h-dvh">
          <BackgroundBeams className="fixed inset-0 z-0" />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  )
}

export default Layout
