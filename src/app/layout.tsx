import type { Metadata } from "next";
import { Raleway, Merriweather } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'], // Removed '500'
  variable: '--font-merriweather',
});

export const metadata: Metadata = {
  title: "TradeShield",
  description: "AI-powered tariff and supply chain risk intelligence.",
  icons: {
    icon: "/tradeshield-logo.png",
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
        className={`${raleway.variable} ${merriweather.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
