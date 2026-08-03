import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Poppins dimuat sebagai CSS variable supaya bisa dipakai lewat Tailwind
// (lihat "fontFamily.sans" di tailwind.config.ts).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "Undangan Digital — Buat Undangan Aqiqah & Kelahiran Instan";
const description =
  "Buat undangan digital aqiqah dan kelahiran dalam hitungan menit, tanpa Photoshop atau Canva. Pilih tema, isi data, langsung download JPEG siap kirim ke WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Undangan Digital",
  },
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Undangan Digital",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
