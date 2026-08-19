import type { Metadata } from "next"
import { Fraunces, Manrope } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics"
import { GlobalAnimatedBackground } from "@/components/GlobalAnimatedBackground"
import { InitialLoader } from "@/components/shared/InitialLoader"



const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
  weight: ["400", "600", "700", "900"],
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Threadify - AI-Powered Custom Fashion Marketplace",
  description: "See It. Stitch It. Wear It. Connect with verified tailors, get AI analysis of your fashion inspiration, and track your custom orders.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn(fraunces.variable, manrope.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-transparent font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
        <GoogleAnalytics />
        <InitialLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <GlobalAnimatedBackground />
        </ThemeProvider>
      </body>
    </html>
  )
}
