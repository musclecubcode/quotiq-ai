import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quotiq AI — Contractor Estimating",
    template: "%s · Quotiq AI",
  },
  description:
    "AI-powered estimating, work order tracking, and invoicing built for contractors.",
  applicationName: "Quotiq AI",
  other: {
    "impact-site-verification": "d61d3758-6d35-4b66-96cc-ddc41aee4897",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quotiq AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorBackground: "#111c31",
          colorForeground: "#f1f5f9",
          colorMutedForeground: "#aebdd0",
          colorNeutral: "#f1f5f9",
          colorInput: "#0f172a",
          colorInputForeground: "#f1f5f9",
          colorPrimary: "#3b82f6",
          colorDanger: "#f87171",
          borderRadius: "0.75rem",
        },
        elements: {
          cardBox: "shadow-2xl shadow-black/30",
          card: "border border-slate-700",
          footer: "bg-transparent",
        },
      }}
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full bg-slate-950 text-slate-100">{children}</body>
      </html>
    </ClerkProvider>
  );
}
