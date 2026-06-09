import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [
    {
      path: "./fonts/Geist-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/Geist-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} dark h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950">{children}</body>
    </html>
  );
}
