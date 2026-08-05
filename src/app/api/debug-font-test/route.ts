import sharp from "sharp";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { NextResponse, type NextRequest } from "next/server";
import { getDefaultLayout } from "@/lib/template-layout";
import { renderInvitationImage } from "@/lib/render/renderInvitationImage";
import { SUPPORTED_FONTS } from "@/lib/fonts";
import { debugBuildFontFaceStyle } from "@/lib/render/renderInvitationImage";
import type { Template } from "@/lib/templates/types";

// Route debug sementara — dihapus setelah verifikasi pilihan font selesai.
export async function GET(request: NextRequest) {
  const fontName = request.nextUrl.searchParams.get("font") ?? "Poppins";

  if (request.nextUrl.searchParams.get("debug") === "2") {
    const fontFaceStyle = debugBuildFontFaceStyle(fontName);
    return new NextResponse(fontFaceStyle, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (request.nextUrl.searchParams.get("debug") === "4") {
    return NextResponse.json({
      sharpVersions: sharp.versions,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });
  }

  if (request.nextUrl.searchParams.get("debug") === "3") {
    // Replika PERSIS pola kode lama yang confirmed bekerja di production
    // (readFileSync dengan filename string literal langsung di call site,
    // bukan hasil lookup objek runtime) — untuk isolasi apakah masalahnya
    // benar-benar soal literal-vs-dinamis, atau ada sebab lain.
    const fontsDir = join(process.cwd(), "src/lib/render/fonts");
    const toBase64 = (filename: string) =>
      readFileSync(join(fontsDir, filename)).toString("base64");
    const style = `
      <style>
        @font-face { font-family: 'Poppins'; font-weight: 400; font-style: normal; src: url(data:font/woff;base64,${toBase64("Poppins-Regular.woff")}) format('woff'); }
        @font-face { font-family: 'Poppins'; font-weight: 700; font-style: normal; src: url(data:font/woff;base64,${toBase64("Poppins-Bold.woff")}) format('woff'); }
      </style>
    `;
    const svg = `
      <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>${style}</defs>
        <rect width="600" height="200" fill="#ffffff"/>
        <text x="20" y="100" font-family="Poppins, Arial, Helvetica, sans-serif" font-size="40" fill="#000000">Yasmine Test</text>
        <text x="20" y="160" font-family="Poppins, Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="#000000">Bold Test</text>
      </svg>
    `;
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png" },
    });
  }

  if (request.nextUrl.searchParams.get("debug") === "1") {
    const fontsDir = join(process.cwd(), "src/lib/render/fonts");
    const dirExists = existsSync(fontsDir);
    let dirListing: string[] = [];
    try {
      dirListing = dirExists ? readdirSync(fontsDir) : [];
    } catch (e) {
      dirListing = [`ERROR: ${e instanceof Error ? e.message : String(e)}`];
    }
    const fileChecks: Record<string, string> = {};
    for (const [name, def] of Object.entries(SUPPORTED_FONTS)) {
      for (const file of Object.values(def.files)) {
        if (!file) continue;
        const p = join(fontsDir, file);
        try {
          const buf = readFileSync(p);
          fileChecks[`${name}/${file}`] = `OK ${buf.length} bytes`;
        } catch (e) {
          fileChecks[`${name}/${file}`] = `FAIL ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    }
    return NextResponse.json({
      cwd: process.cwd(),
      fontsDir,
      dirExists,
      dirListing,
      fileChecks,
    });
  }

  const template: Template = {
    id: "debug",
    name: "Debug Font",
    category: "Aqiqah",
    isActive: false,
    thumbnailUrl: null,
    backgroundUrl: null,
    overlayUrl: null,
    dominantColor: "#f472b6",
    fontName,
    fontSize: 32,
    fontColor: "#1f2937",
    layout: getDefaultLayout(1),
  };

  const photoBuffer = await sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 200, g: 150, b: 100 } },
  })
    .jpeg()
    .toBuffer();

  const buffer = await renderInvitationImage({
    template,
    formData: {
      namaAnak: "Yasmine Aqila",
      jenisKelamin: "Perempuan",
      namaAyah: "Malsy",
      namaIbu: "Kiky",
      tanggalLahir: "2020-01-01",
      tanggalPelaksanaan: "2026-01-01",
      alamat: "Jl Merdeka No 1",
      ucapan: "Dengan memohon rahmat Allah SWT",
      doa: "Semoga tumbuh sholehah",
      namaKeluarga: `Font: ${fontName}`,
    },
    photoBuffer,
    logoBuffer: null,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/jpeg" },
  });
}
