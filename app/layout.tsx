import type { Metadata } from "next";
import React from 'react';
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { CartDrawer } from "@/components/CartDrawer";
import { SplashScreen } from "@/components/SplashScreen";
import { getSettings } from "@/app/admin/marketing/actions";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zeuz.supply'),
  title: "ZEUZ_SUPPLY // Industrial Lithium-Ion Solutions",
  description: "Premium wholesale 18650 & 21700 cells for high-drain industrial applications. Verified UK/EU Supply Chain. Molicel, Samsung, Murata. OEM Inquiries Only.",
  keywords: ["18650", "21700", "Lithium Ion", "Wholesale Batteries", "Molicel", "Industrial Battery Supply", "UK Battery Wholesale"],
  openGraph: {
    siteName: 'ZEUZ SUPPLY',
    title: "ZEUZ SUPPLY // Power Infrastructure",
    description: "Industrial-grade energy storage solutions. Secure allocation now.",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: '/cell_transparent_shadow.png',
        width: 1200,
        height: 630,
        alt: 'ZEUZ SUPPLY Industrial Cells',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ZEUZ SUPPLY // Power Infrastructure",
    description: "Industrial-grade energy storage solutions. Secure allocation now.",
    images: ['/cell_transparent_shadow.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Navbar } from "@/components/Navbar";

import { ThemeManager } from "@/components/ThemeManager";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { DeploymentVersion } from "@/components/DeploymentVersion";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeManager />
        <Navbar />
        <React.Suspense fallback={null}>
          <SplashScreen
            enabled={settings.find((s: any) => s.key === 'SHOW_SPLASH')?.value ?? true}
            message={settings.find((s: any) => s.key === 'SPLASH_MESSAGE')?.value}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <OrderConfirmation />
        </React.Suspense>
        <CartDrawer />
        <DeploymentVersion />
        {children}
      </body>
    </html>
  );
}
