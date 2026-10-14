import type { Metadata } from "next";
import { Fredoka, Playpen_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const fredoka = Fredoka({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const playpen = Playpen_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600"],
  variable: "--font-playpen",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "המעטפת", template: "%s · המעטפת" },
  description: "המעטפת – קהילת נשים מבית חד או פאן. הפורום, המיליונרית וחוגגות חודש טוב.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${fredoka.variable} ${playpen.variable}`}>
      <body>{children}</body>
    </html>
  );
}
