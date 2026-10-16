import type { Metadata, Viewport } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "HARVEST ZERO: Post-Harvest Loss Prevention Platform",
  description:
    "Decision-support platform connecting farmers, storage facilities, transport operators, and buyers to eliminate agricultural waste and optimize perishables distribution.",
};

import { LanguageProvider } from "@/lib/i18n";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable} h-full antialiased bg-[#FBFBFD] text-[#1D1D1F]`}>
      <body className="min-h-full flex flex-col bg-[#FBFBFD] text-[#1D1D1F]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
