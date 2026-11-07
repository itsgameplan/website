import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./admin.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Admin · Gameplan", template: "%s · Gameplan Admin" },
  robots: { index: false, follow: false },
};

/** The admin area has its own root layout (English, no site chrome). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="ga-body">{children}</body>
    </html>
  );
}
