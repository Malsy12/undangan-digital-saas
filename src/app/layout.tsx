import type { Metadata } from "next";
import {
  Poppins,
  Playfair_Display,
  Montserrat,
  Dancing_Script,
  Lora,
} from "next/font/google";
import "./globals.css";

// Poppins dimuat sebagai CSS variable supaya bisa dipakai lewat Tailwind
// (lihat "fontFamily.sans" di tailwind.config.ts).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Font pilihan tema (lihat lib/fonts.ts) — dimuat di sini supaya tersedia
// untuk live preview Konva (InvitationCanvasStage memakai nama font ini
// langsung sebagai fontFamily). Tidak dipakai lewat Tailwind, jadi variable-nya
// cuma perlu ditempel di <html> supaya Next.js menyertakan @font-face-nya,
// tanpa perlu dipakai eksplisit di CSS manapun. Padanan file .woff-nya untuk
// hasil JPEG final ada di lib/render/fonts/ (lihat renderInvitationImage.ts).
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-dancing-script",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
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
    <html
      lang="id"
      className={`${poppins.variable} ${playfairDisplay.variable} ${montserrat.variable} ${dancingScript.variable} ${lora.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
