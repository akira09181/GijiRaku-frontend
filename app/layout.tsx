import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://giji-raku-frontend.vercel.app/";
const siteTitle = "マチボイス｜議会の一次情報から市民参加をひらく";
const siteDescription = "マチボイスは、自治体ごとに形式の異なる会議録を発言単位に構造化し、議員の質問と行政の答弁を原文付きで届ける市民参加基盤です。市民が議論を知り、一次情報を確かめ、自分の意思を届けられるようにします。";
const socialDescription = "議会を知る、原文を確かめる、声を届ける。選挙の日だけで終わらない市民参加を日常へ。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "マチボイス",
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: socialDescription,
    type: "website",
    url: siteUrl,
    siteName: "マチボイス",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: socialDescription,
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "マチボイス",
  applicationCategory: "CivicApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "マチボイスは、自治体の会議録を発言単位に構造化し、議員の質問と行政の答弁を原文付きで届ける、原文検証可能な議会情報・市民参加基盤です。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
