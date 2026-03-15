import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Scheduly | Akıllı Randevu Sistemi",
  description: "İşletmeniz için profesyonel randevu ve müşteri yönetim platformu.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Scheduly | Akıllı Randevu Sistemi",
    description: "İşletmeniz için profesyonel randevu ve müşteri yönetim platformu.",
    url: "https://scheduly-liard.vercel.app",
    siteName: "Scheduly",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scheduly | Akıllı Randevu Sistemi",
    description: "İşletmeniz için profesyonel randevu ve müşteri yönetim platformu.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
