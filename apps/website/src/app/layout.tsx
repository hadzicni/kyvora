import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Kyvora — Open-source homelab control plane",
  description:
    "Kyvora is an open-source homelab control plane for managing servers, agents, monitoring, users, and infrastructure operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950">{children}</body>
    </html>
  );
}
