import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import sharp, { type OverlayOptions, type Sharp } from "sharp";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type TextLayer,
  type PhotoPlaceholder,
  type PhotoShadow,
} from "@/lib/template-layout";
import { SUPPORTED_FONTS, resolveFontName } from "@/lib/fonts";
import type { Template } from "@/lib/templates/types";
import { wrapText } from "./wrapText";

// Server serverless (Vercel dkk) TIDAK punya font sistem terinstall (beda
// dengan komputer dev yang punya Arial/dsb) — tanpa font disematkan langsung,
// semua teks di gambar hasil generate akan tampil sebagai kotak kosong
// ("tofu"). Cuma font yang benar-benar dipakai template yang disematkan
// (bukan semua font pilihan sekaligus), hasilnya di-cache per nama font
// supaya request berikutnya dengan font sama tidak baca file ulang.
const fontFaceStyleCache = new Map<string, string>();

function loadFontFaceStyle(requestedFontName: string): string {
  const fontName = resolveFontName(requestedFontName);
  const cached = fontFaceStyleCache.get(fontName);
  if (cached) return cached;

  const { files } = SUPPORTED_FONTS[fontName];
  const fontsDir = join(process.cwd(), "src/lib/render/fonts");
  const toBase64 = (filename: string) =>
    readFileSync(join(fontsDir, filename)).toString("base64");

  const faces = [
    `@font-face { font-family: '${fontName}'; font-weight: 400; font-style: normal; src: url(data:font/woff;base64,${toBase64(files.normal)}) format('woff'); }`,
  ];
  if (files.bold) {
    faces.push(
      `@font-face { font-family: '${fontName}'; font-weight: 700; font-style: normal; src: url(data:font/woff;base64,${toBase64(files.bold)}) format('woff'); }`
    );
  }
  if (files.italic) {
    faces.push(
      `@font-face { font-family: '${fontName}'; font-weight: 400; font-style: italic; src: url(data:font/woff;base64,${toBase64(files.italic)}) format('woff'); }`
    );
  }
  if (files.boldItalic) {
    faces.push(
      `@font-face { font-family: '${fontName}'; font-weight: 700; font-style: italic; src: url(data:font/woff;base64,${toBase64(files.boldItalic)}) format('woff'); }`
    );
  }

  const style = `<style>${faces.join("\n")}</style>`;
  fontFaceStyleCache.set(fontName, style);
  return style;
}

export interface RenderInvitationFormData {
  namaAnak: string;
  jenisKelamin: "Laki-laki" | "Perempuan" | "";
  namaAyah: string;
  namaIbu: string;
  tanggalLahir: string;
  tanggalPelaksanaan: string;
  alamat: string;
  ucapan: string;
  doa: string;
  namaKeluarga?: string;
}

export interface RenderInvitationInput {
  template: Template;
  formData: RenderInvitationFormData;
  photoBuffer: Buffer;
  logoBuffer: Buffer | null;
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0");
  const value = parseInt(full, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/**
 * Bayangan frame foto dirender sebagai SVG terpisah (feGaussianBlur + feOffset +
 * feColorMatrix — bukan feDropShadow supaya kompatibel lebih luas di librsvg),
 * dikomposit SEBELUM foto supaya cuma bagian yang meluber di luar frame yang
 * kelihatan (bagian tengahnya ketutup total oleh foto di atasnya).
 */
function buildPhotoShadowSvg(placeholder: PhotoPlaceholder, shadow: PhotoShadow): string {
  const { x, y, width, height, shape } = placeholder;
  const shapeEl =
    shape === "circle"
      ? `<circle cx="${x + width / 2}" cy="${y + height / 2}" r="${width / 2}" fill="#000"/>`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" ry="20" fill="#000"/>`;
  const [r, g, b] = hexToRgb01(shadow.color);

  return `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="photoShadow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${shadow.blur / 2}" result="blur"/>
          <feOffset in="blur" dx="${shadow.offsetX}" dy="${shadow.offsetY}" result="offsetBlur"/>
          <feColorMatrix in="offsetBlur" type="matrix" values="
            0 0 0 0 ${r}
            0 0 0 0 ${g}
            0 0 0 0 ${b}
            0 0 0 ${shadow.opacity} 0"/>
        </filter>
      </defs>
      <g filter="url(#photoShadow)">${shapeEl}</g>
    </svg>
  `;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil asset gambar: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Render satu TextLayer jadi elemen <text> SVG. Kalau "lines" diberikan
 * langsung (mis. tanggal, sudah dipisah per baris oleh pemanggil), tidak
 * di-word-wrap lagi — cuma dipakai apa adanya (baris pendek yang sudah pasti muat).
 */
function textLayerToSvg(
  text: string,
  layer: TextLayer,
  fontFamily: string,
  defaultFill: string,
  lines?: string[]
): string {
  const resolvedLines =
    lines ?? wrapText(text, layer.width, layer.fontSize, layer.height);
  const lineHeight = layer.fontSize * (layer.lineHeight ?? 1.3);

  const anchor =
    layer.align === "center"
      ? "middle"
      : layer.align === "right"
        ? "end"
        : "start";
  const x =
    layer.align === "center"
      ? layer.x + layer.width / 2
      : layer.align === "right"
        ? layer.x + layer.width
        : layer.x;

  const fontWeight = layer.fontStyle?.includes("bold") ? "bold" : "normal";
  const fontStyleAttr = layer.fontStyle?.includes("italic")
    ? "italic"
    : "normal";
  const fill = layer.color ?? defaultFill;

  // Baseline baris pertama = y + fontSize (SVG text y = baseline, bukan top).
  const tspans = resolvedLines
    .map(
      (line, i) =>
        `<tspan x="${x}" y="${layer.y + layer.fontSize + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  // resolveFontName menjamin nama yang dipakai di sini SAMA dengan nama yang
  // disematkan loadFontFaceStyle — kalau beda, browser/librsvg tidak akan
  // ketemu face-nya dan render text jadi tofu lagi (lihat riwayat bug font).
  const resolvedFontFamily = resolveFontName(fontFamily);
  return `<text font-family="${escapeXml(resolvedFontFamily)}, Arial, Helvetica, sans-serif" font-size="${layer.fontSize}" font-weight="${fontWeight}" font-style="${fontStyleAttr}" fill="${fill}" text-anchor="${anchor}">${tspans}</text>`;
}

/**
 * Render satu undangan jadi buffer JPEG final (1080x1920, quality 95).
 * Semua posisi diambil dari template.layout — sumber yang sama dipakai
 * preview Konva (Tahap 4/6) — supaya hasil akhir konsisten dengan yang
 * dilihat customer & admin sebelum generate/publish.
 */
export async function renderInvitationImage({
  template,
  formData,
  photoBuffer,
  logoBuffer,
}: RenderInvitationInput): Promise<Buffer> {
  const layout = template.layout;
  const sebutan = formData.jenisKelamin === "Laki-laki" ? "Putra" : "Putri";
  const fontFaceStyle = loadFontFaceStyle(template.fontName);

  // 1) Background: pakai background_url asli kalau sudah diupload admin,
  // else solid dominantColor. Label kategori dirasterisasi jadi satu lapisan.
  const kategoriSvg = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>${fontFaceStyle}</defs>
      ${textLayerToSvg(template.category.toUpperCase(), layout.textLayers.kategori, template.fontName, "#ffffff")}
    </svg>
  `;

  let base: Sharp;
  if (template.backgroundUrl) {
    const backgroundBuffer = await fetchImageBuffer(template.backgroundUrl);
    base = sharp(await sharp(backgroundBuffer).resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: "cover" }).toBuffer());
  } else {
    base = sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        channels: 4,
        background: template.dominantColor,
      },
    });
  }
  base = sharp(
    await base
      .composite([{ input: Buffer.from(kategoriSvg), left: 0, top: 0 }])
      .png()
      .toBuffer()
  );

  // 2) Foto anak: resize -> crop cover -> mask sesuai bentuk frame (lingkaran/kotak membulat).
  const { x: photoX, y: photoY, width, height, shape } = layout.photoPlaceholder;
  const resizedPhoto = await sharp(photoBuffer)
    .resize(width, height, { fit: "cover" })
    .toBuffer();

  const maskSvg =
    shape === "circle"
      ? `<svg width="${width}" height="${height}"><circle cx="${width / 2}" cy="${height / 2}" r="${width / 2}" fill="#fff"/></svg>`
      : `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="20" ry="20" fill="#fff"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();

  const maskedPhoto = await sharp(resizedPhoto)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const overlays: OverlayOptions[] = [];
  if (layout.photoPlaceholder.shadow?.enabled) {
    const shadowSvg = buildPhotoShadowSvg(layout.photoPlaceholder, layout.photoPlaceholder.shadow);
    overlays.push({ input: Buffer.from(shadowSvg), left: 0, top: 0 });
  }
  overlays.push({
    input: maskedPhoto,
    left: Math.round(photoX),
    top: Math.round(photoY),
  });

  // 3) Overlay dekoratif (bingkai/ornamen) opsional, di atas foto sebelum teks.
  if (template.overlayUrl) {
    const overlayBuffer = await fetchImageBuffer(template.overlayUrl);
    const resizedOverlay = await sharp(overlayBuffer)
      .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: "cover" })
      .toBuffer();
    overlays.push({ input: resizedOverlay, left: 0, top: 0 });
  }

  // 4) Logo opsional — ditempel apa adanya, tanpa masking.
  if (logoBuffer) {
    const { x: logoX, y: logoY, size } = layout.logoPlaceholder;
    const resizedLogo = await sharp(logoBuffer)
      .resize(size, size, { fit: "contain" })
      .png()
      .toBuffer();
    overlays.push({
      input: resizedLogo,
      left: Math.round(logoX),
      top: Math.round(logoY),
    });
  }

  // 5) Semua teks data (nama, ortu, tanggal, alamat, ucapan, doa) dalam satu
  // lapisan SVG transparan, dikomposit paling atas.
  const textSvg = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>${fontFaceStyle}</defs>
      ${textLayerToSvg(formData.namaAnak || "Nama Anak", layout.textLayers.namaAnak, template.fontName, template.fontColor)}
      ${textLayerToSvg(
        `${sebutan} dari Bapak ${formData.namaAyah || "-"} & Ibu ${formData.namaIbu || "-"}`,
        layout.textLayers.orangTua,
        template.fontName,
        template.fontColor
      )}
      ${textLayerToSvg("", layout.textLayers.tanggal, template.fontName, template.fontColor, [
        `Lahir: ${formatTanggal(formData.tanggalLahir)}`,
        `Acara: ${formatTanggal(formData.tanggalPelaksanaan)}`,
      ])}
      ${textLayerToSvg(formData.alamat || "-", layout.textLayers.alamat, template.fontName, template.fontColor)}
      ${textLayerToSvg(formData.ucapan || "-", layout.textLayers.ucapan, template.fontName, template.fontColor)}
      ${textLayerToSvg(formData.doa || "-", layout.textLayers.doa, template.fontName, template.fontColor)}
      ${
        formData.namaKeluarga
          ? textLayerToSvg(
              "",
              layout.textLayers.keluarga,
              template.fontName,
              template.fontColor,
              ["Kami yang berbahagia,", formData.namaKeluarga]
            )
          : ""
      }
    </svg>
  `;
  overlays.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  return base.composite(overlays).jpeg({ quality: 95 }).toBuffer();
}
