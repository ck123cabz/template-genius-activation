import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Priority Access Dashboard",
  description: "Manage client activations and priority access confirmations",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body
        style={{
          transform: "scale(0.9)",
          transformOrigin: "top left",
          width: "111.11%",
          height: "111.11%",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
