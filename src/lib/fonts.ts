// Daftar font yang BENAR-BENAR didukung ujung-ke-ujung: dimuat di browser
// (lewat next/font/google di layout.tsx, untuk live preview Konva) DAN
// disematkan sebagai file .woff di server (lihat lib/render/fonts/ +
// renderInvitationImage.ts, untuk hasil JPEG final). Admin cuma boleh pilih
// dari daftar ini (dropdown di TemplateForm) — nama font bebas-teks sudah
// tidak dipakai lagi karena tidak pernah benar-benar mengubah tampilan hasil
// akhir (font yang tidak dikenal selalu fallback diam-diam ke Poppins).
//
// File ini TIDAK boleh diberi "server-only" — dipakai juga di komponen client
// (TemplateForm) untuk mengisi pilihan dropdown.
export interface FontFiles {
  normal: string;
  bold?: string;
  italic?: string;
  boldItalic?: string;
}

export interface FontDefinition {
  /** Nama tampil di dropdown, sama dengan nama family Google Fonts asalnya. */
  label: string;
  files: FontFiles;
}

export const DEFAULT_FONT_NAME = "Poppins";

export const SUPPORTED_FONTS: Record<string, FontDefinition> = {
  Poppins: {
    label: "Poppins (Sans-serif modern)",
    files: {
      normal: "Poppins-Regular.woff",
      bold: "Poppins-Bold.woff",
      italic: "Poppins-Italic.woff",
      boldItalic: "Poppins-BoldItalic.woff",
    },
  },
  "Playfair Display": {
    label: "Playfair Display (Serif elegan)",
    files: {
      normal: "PlayfairDisplay-Regular.woff",
      bold: "PlayfairDisplay-Bold.woff",
      italic: "PlayfairDisplay-Italic.woff",
      boldItalic: "PlayfairDisplay-BoldItalic.woff",
    },
  },
  Montserrat: {
    label: "Montserrat (Sans-serif clean)",
    files: {
      normal: "Montserrat-Regular.woff",
      bold: "Montserrat-Bold.woff",
      italic: "Montserrat-Italic.woff",
      boldItalic: "Montserrat-BoldItalic.woff",
    },
  },
  "Dancing Script": {
    label: "Dancing Script (Kaligrafi)",
    files: {
      normal: "DancingScript-Regular.woff",
      bold: "DancingScript-Bold.woff",
    },
  },
  Lora: {
    label: "Lora (Serif mudah dibaca)",
    files: {
      normal: "Lora-Regular.woff",
      bold: "Lora-Bold.woff",
      italic: "Lora-Italic.woff",
      boldItalic: "Lora-BoldItalic.woff",
    },
  },
};

export const SUPPORTED_FONT_NAMES = Object.keys(SUPPORTED_FONTS);

/** Nama font tak dikenal (mis. tema lama isian bebas-teks) fallback ke Poppins. */
export function resolveFontName(name: string): string {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_FONTS, name)
    ? name
    : DEFAULT_FONT_NAME;
}
