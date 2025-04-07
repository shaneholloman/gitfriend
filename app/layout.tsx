// app/layout.tsx
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"

// Optimized font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://gitfriend..vercel.app"), // replace with your actual domain
  title: {
    default: "Git Friend - Make Git Simple Again",
    template: "%s | Git Friend",
  },
  description:
    "Git Friend simplifies complex Git workflows, making version control intuitive and collaborative for developers of all skill levels.",
  keywords: [
    "Git",
    "GitHub",
    "Version Control",
    "Open Source",
    "Git Workflow",
    "Developer Tools",
    "Git Assistant",
    "Git UI",
  ],
  authors: [{ name: "Git Friend Team", url: "https://gitfriend.vercel.app" }],
  creator: "Git Friend",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gitfriend.vercel.app",
    title: "Git Friend - Make Git Simple Again",
    description:
      "Git Friend simplifies complex Git workflows, making version control intuitive and collaborative.",
    siteName: "Git Friend",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Friend - Make Git Simple Again",
    description:
      "Simplify your Git workflow with Git Friend – an intuitive tool for developers at all levels.",
    creator: "", 
  },
  themeColor: "#ffffff",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
