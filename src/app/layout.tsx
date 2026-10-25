import type { Metadata } from "next";
import { Fredoka, Playpen_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";
import { getContent } from "@/lib/content";

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

/** The site name and description come from «תוכן האתר» (general.brand / general.meta_description). */
export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const brand = c.get("general.brand");
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: brand, template: `%s · ${brand}` },
    description: c.get("general.meta_description"),
    robots: { index: false, follow: false },
    icons: { icon: "/icon.png" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${fredoka.variable} ${playpen.variable}`}>
      <body>{children}</body>
    </html>
  );
}
