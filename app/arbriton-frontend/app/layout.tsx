import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import App from "next/app"
import AppProvider from "@/lib/AppProvider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const geistMono = GeistMono

export const metadata: Metadata = {
  title: "Arbitron",
  description:
    "Compete in short-duration trading contests on Solana. Test your skills, win prizes, and earn NFT badges.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${spaceGrotesk.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <AppProvider>
            <Navbar/>
          {children}
          </AppProvider>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            theme="dark"
          />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
