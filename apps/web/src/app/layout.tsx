import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://statcheck.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "StatCheck - Share Your Player Lists",
  description: "View and share basketball player lists",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "StatCheck",
    description: "View and share basketball player lists",
    type: "website",
    url: baseUrl,
    siteName: "StatCheck",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StatCheck - Share Your Player Lists",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StatCheck",
    description: "View and share basketball player lists",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <div className="pt-16">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
