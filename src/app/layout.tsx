import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { env } from "@/env";
import { PrintResume } from "@/features/resume/components/PrintResume";

import "./globals.css";

// Geist ships its font files in the package and loads them with
// next/font/local, so the build never fetches a font.
export const metadata: Metadata = {
  title: {
    default: `${env.NEXT_PUBLIC_APP_NAME}: AI job matching and live ATS scoring`,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "Upload your resume once. SwaraMatch scans live job boards, ranks every post against your experience and shows exactly what to fix to beat the ATS.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-svh bg-background font-sans text-foreground">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
          <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Logo className="size-7" />
              {env.NEXT_PUBLIC_APP_NAME}
            </Link>
            <div className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
              <a href="#how" className="hover:text-foreground">
                How it works
              </a>
              <a href="#workspace" className="hover:text-foreground">
                Try it
              </a>
              <a href="#tech" className="hover:text-foreground">
                Under the hood
              </a>
            </div>
            <a
              href="#workspace"
              className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:ml-0"
            >
              Get matched
            </a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <Logo className="size-4" />
              Independent prototype by Savitha Sista for a SWARA application. Not an official SWARA
              product.
            </p>
            <p>
              Jobs from Remotive, Arbeitnow and RemoteOK public APIs. Each listing links to its
              source.
            </p>
          </div>
        </footer>
        <PrintResume />
      </body>
    </html>
  );
}
