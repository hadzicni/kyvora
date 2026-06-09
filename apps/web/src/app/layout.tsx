import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import enMessages from "@/i18n/messages/en.json";

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
  title: "Kyvora",
  description: "Kyvora infrastructure dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
