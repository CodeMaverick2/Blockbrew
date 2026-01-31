import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BlockBrew - Multi-Chain Transaction Explorer",
  description:
    "View blockchain transactions from any wallet address. Supports Ethereum, Polygon, Solana, Bitcoin, Polkadot, Cosmos, Bittensor, Ronin, and more. Export to CSV for tax reporting.",
  keywords: [
    "blockchain",
    "transactions",
    "crypto",
    "wallet",
    "ethereum",
    "bitcoin",
    "solana",
    "polkadot",
    "cosmos",
    "bittensor",
    "tax",
    "csv",
    "explorer",
    "multi-chain",
    "koinly",
    "cointracker",
  ],
  authors: [{ name: "BlockBrew" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "BlockBrew - Multi-Chain Transaction Explorer",
    description:
      "View and export blockchain transactions from any wallet address. Supports 14+ blockchains.",
    type: "website",
    siteName: "BlockBrew",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockBrew - Multi-Chain Transaction Explorer",
    description:
      "View and export blockchain transactions from any wallet address.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
