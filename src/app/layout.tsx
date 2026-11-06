import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://network-design-studio-xi.vercel.app"),
  title: "Network Design Studio — Minimum Spanning Trees",
  description: "Design a minimum-cost connected network and compare Kruskal's and Prim's minimum spanning tree algorithms step by step.",
  icons: { icon: "/network-design-studio.svg", apple: "/network-design-studio.svg" },
  openGraph: { title: "Network Design Studio", description: "A mathematically verifiable DMGT laboratory for minimum spanning trees.", images: [{ url: "/network-design-studio.svg", width: 512, height: 512, alt: "Network Design Studio logo" }] },
};

export const viewport: Viewport = { themeColor: "#15231f", colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}
