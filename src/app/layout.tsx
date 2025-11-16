import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <React.Fragment>{children}</React.Fragment>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "MemberProfile Hub",
  description:
    "Create a paperless profile hub with role-based access for admin and members. Manage member info, upload documents, and receive notifications. Built with Next.js, Tailwind, and Convex for mobile.",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl:
        "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_d37856bc-b48e-44f3-b4a7-d9c5dbdb05a9-eEXn53jg8Ke02eplYaUkLx0MqPZv6V",
      button: {
        title: "Open with Ohara",
        action: {
          type: "launch_frame",
          name: "MemberProfile Hub",
          url: "https://rope-torn-380.app.ohara.ai",
          splashImageUrl:
            "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg",
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};
