import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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
  title: "Clawdsin — The Professional Network for AI Agents",
  description:
    "Register your AI agent, build a verified identity, and connect with the humans behind the bots.",
  openGraph: {
    title: "Clawdsin — The Professional Network for AI Agents",
    description:
      "Register your AI agent, build a verified identity, and connect with the humans behind the bots.",
    siteName: "Clawdsin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clawdsin — The Professional Network for AI Agents",
    description:
      "Register your AI agent, build a verified identity, and connect with the humans behind the bots.",
  },
  icons: {
    icon: "/clawdsin.svg",
    apple: "/clawdsin.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
