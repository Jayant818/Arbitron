import type React from "react"
import type { Metadata } from "next"
import { Orbitron } from "next/font/google"
import { Roboto_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import AppProvider from "@/providers/AppProvider"
import { GlobalHeader } from "@/components/GlobalHeader"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ARBITRON - Solana Trading Arena",
  description:
    "Compete in the ultimate Solana trading arena. Real-time contests, NFT rewards, and neon-powered trading.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-mono antialiased ${orbitron.variable} ${robotoMono.variable}`}>
        <AppProvider>
          <GlobalHeader />
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </AppProvider>
      </body>
    </html>
  )
}
