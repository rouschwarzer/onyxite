import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

/**
 * Font configuration for the application.
 */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ONYXITE | Media Discovery",
  description: "Advanced media management and discovery system",
};

/**
 * Root layout component for the Next.js application.
 * @param props - Component properties including children
 * @returns The root layout structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased pb-32 bg-bg-deep text-[#efefef]`}
      >
        {children}
      </body>
    </html>
  );
}
