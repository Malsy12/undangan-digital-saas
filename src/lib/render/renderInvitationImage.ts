import "server-only";
import sharp, { type OverlayOptions, type Sharp } from "sharp";
import { CANVAS_WIDTH, CANVAS_HEIGHT, type TextLayer } from "@/lib/template-layout";
import type { Template } from "@/lib/templates/types";
import { wrapText } from "./wrapText";

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

  return `<text font-family="${escapeXml(fontFamily)}, Arial, Helvetica, sans-serif" font-size="${layer.fontSize}" font-weight="${fontWeight}" font-style="${fontStyleAttr}" fill="${fill}" text-anchor="${anchor}">${tspans}</text>`;
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

  // 1) Background: pakai background_url asli kalau sudah diupload admin,
  // else solid dominantColor. Label kategori dirasterisasi jadi satu lapisan.
  const kategoriSvg = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
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

  const overlays: OverlayOptions[] = [
    { input: maskedPhoto, left: Math.round(photoX), top: Math.round(photoY) },
  ];

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
    </svg>
  `;
  overlays.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  return base.composite(overlays).jpeg({ quality: 95 }).toBuffer();
}
