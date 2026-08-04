// Layout kanvas undangan — dipakai bersama oleh preview client (Konva, Tahap 4)
// dan nantinya render final di server (Sharp, Tahap 5), supaya hasil JPEG akhir
// dijamin identik posisinya dengan yang dilihat customer di preview.
//
// Semua koordinat dalam ruang kanvas tetap 1080x1920 (resolusi output akhir).
// Tinggi tiap kotak teks SENGAJA dibatasi (fixed), bukan mengikuti panjang isi —
// teks yang kepanjangan dipotong dengan ellipsis ("...") di Konva supaya tidak
// pernah meluber keluar frame, sesuai requirement produk.

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export interface TextLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  align?: "left" | "center" | "right";
  color?: string;
  lineHeight?: number;
}

export interface PhotoShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  /** 0-1 */
  opacity: number;
}

export interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "circle" | "rect";
  /** Opsional — kalau tidak diisi berarti tanpa shadow (perilaku lama). */
  shadow?: PhotoShadow;
}

export const DEFAULT_PHOTO_SHADOW: PhotoShadow = {
  enabled: true,
  color: "#000000",
  blur: 24,
  offsetX: 0,
  offsetY: 8,
  opacity: 0.35,
};

export interface LogoPlaceholder {
  x: number;
  y: number;
  size: number;
}

export interface TemplateLayout {
  canvasWidth: number;
  canvasHeight: number;
  photoPlaceholder: PhotoPlaceholder;
  logoPlaceholder: LogoPlaceholder;
  textLayers: {
    kategori: TextLayer;
    namaAnak: TextLayer;
    orangTua: TextLayer;
    tanggal: TextLayer;
    alamat: TextLayer;
    ucapan: TextLayer;
    doa: TextLayer;
    keluarga: TextLayer;
  };
}

export const MARGIN_X = 80;
export const CONTENT_WIDTH = CANVAS_WIDTH - MARGIN_X * 2;
const GAP = 20;

// Fallback posisi untuk tema LAMA yang "text_positions"-nya di database belum
// punya key "keluarga" (dibuat sebelum fitur ini ada) — lihat rowToTemplate
// di lib/templates/mappers.ts. Ditaruh dekat bagian bawah kanvas karena
// perannya sebagai penutup/signature, bukan bagian dari susunan teks utama.
export const DEFAULT_KELUARGA_LAYER: TextLayer = {
  x: MARGIN_X,
  y: CANVAS_HEIGHT - 150,
  width: CONTENT_WIDTH,
  height: 60,
  fontSize: 22,
  align: "center",
};

/**
 * Layout default dipakai semua tema dummy sekarang (Tahap 1-5). Setiap tema
 * nantinya bisa override posisi ini lewat admin panel (Tahap 6) — hasil
 * override-nya akan disimpan di kolom "text_positions"/"photo_placeholder"
 * (jsonb) pada tabel templates, dengan bentuk yang sama seperti tipe di atas.
 */
export function getDefaultLayout(photoAspectRatio: number): TemplateLayout {
  const photoWidth = 620;
  const photoHeight = Math.round(photoWidth / photoAspectRatio);
  const photoY = 260;

  const photoPlaceholder: PhotoPlaceholder = {
    x: (CANVAS_WIDTH - photoWidth) / 2,
    y: photoY,
    width: photoWidth,
    height: photoHeight,
    shape: photoAspectRatio === 1 ? "circle" : "rect",
  };

  // Setiap elemen teks ditumpuk berurutan dari bawah foto, supaya tinggi foto
  // yang berbeda-beda antar tema (tergantung photoAspectRatio) tidak pernah
  // membuat elemen di bawahnya bertabrakan.
  let cursorY = photoPlaceholder.y + photoPlaceholder.height + 56;

  function stack(height: number): number {
    const y = cursorY;
    cursorY += height + GAP;
    return y;
  }

  const namaAnak: TextLayer = {
    x: MARGIN_X,
    y: stack(72),
    width: CONTENT_WIDTH,
    height: 72,
    fontSize: 52,
    fontStyle: "bold",
    align: "center",
  };

  const orangTua: TextLayer = {
    x: MARGIN_X,
    y: stack(44),
    width: CONTENT_WIDTH,
    height: 44,
    fontSize: 28,
    align: "center",
  };

  const tanggal: TextLayer = {
    x: MARGIN_X,
    y: stack(80),
    width: CONTENT_WIDTH,
    height: 80,
    fontSize: 26,
    align: "center",
    lineHeight: 1.4,
  };

  const alamat: TextLayer = {
    x: MARGIN_X,
    y: stack(90),
    width: CONTENT_WIDTH,
    height: 90,
    fontSize: 24,
    align: "center",
    lineHeight: 1.35,
  };

  const ucapan: TextLayer = {
    x: MARGIN_X,
    y: stack(150),
    width: CONTENT_WIDTH,
    height: 150,
    fontSize: 23,
    fontStyle: "italic",
    align: "center",
    lineHeight: 1.4,
  };

  const doa: TextLayer = {
    x: MARGIN_X,
    y: stack(150),
    width: CONTENT_WIDTH,
    height: 150,
    fontSize: 23,
    fontStyle: "italic",
    align: "center",
    lineHeight: 1.4,
  };

  // Penutup/signature ("Kami yang berbahagia, <nama keluarga>") — elemen
  // paling akhir, ditumpuk setelah doa.
  const keluarga: TextLayer = {
    x: MARGIN_X,
    y: stack(60),
    width: CONTENT_WIDTH,
    height: 60,
    fontSize: 22,
    align: "center",
    lineHeight: 1.4,
  };

  return {
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    photoPlaceholder,
    logoPlaceholder: { x: CANVAS_WIDTH - 160, y: 56, size: 96 },
    textLayers: {
      kategori: {
        x: 0,
        y: 90,
        width: CANVAS_WIDTH,
        height: 44,
        fontSize: 30,
        fontStyle: "bold",
        align: "center",
      },
      namaAnak,
      orangTua,
      tanggal,
      alamat,
      ucapan,
      doa,
      keluarga,
    },
  };
}
