import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { NextResponse } from "next/server";

// Route debug sementara — dihapus setelah masalah font selesai didiagnosis.
export async function GET() {
  const fontPath = join(
    process.cwd(),
    "src/lib/render/fonts/Poppins-Regular.woff"
  );
  const fontBase64 = readFileSync(fontPath).toString("base64");

  const svg = `
    <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'PoppinsEmbed';
            src: url(data:font/woff;base64,${fontBase64}) format('woff');
          }
        </style>
      </defs>
      <rect width="600" height="200" fill="#ffffff"/>
      <text x="20" y="100" font-family="PoppinsEmbed" font-size="40" fill="#000000">Aisyah Zahra Test</text>
      <text x="20" y="160" font-family="sans-serif" font-size="30" fill="#000000">sans-serif fallback</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
}
