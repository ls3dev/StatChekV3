import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.statcheckapp.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "StatCheck: The 2nd Brain for Sports Fans",
  description: "The 2nd brain for sports fans. Create and share player lists.",
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "StatCheck: The 2nd Brain for Sports Fans",
    description: "The 2nd brain for sports fans. Create and share player lists.",
    type: "website",
    url: baseUrl,
    siteName: "StatCheck",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "StatCheck: The 2nd Brain for Sports Fans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StatCheck: The 2nd Brain for Sports Fans",
    description: "The 2nd brain for sports fans. Create and share player lists.",
    images: [`${baseUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <Providers>
          <Header />
          <div className="pt-16">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
