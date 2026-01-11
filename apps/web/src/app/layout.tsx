import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StatCheck - Share Your Player Lists",
  description: "View and share basketball player lists",
  openGraph: {
    title: "StatCheck",
    description: "View and share basketball player lists",
    type: "website",
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
        <Header />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
