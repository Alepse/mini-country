import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mini-Country Viewer",
  description: "Explore the world with a minimalist, interactive atlas and searchable country list.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  )
}
