import { NextResponse } from "next/server";
import { z } from "zod";
import sharp, { type Metadata } from "sharp";
import {
  invitationFormSchema,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validation/invitation-schema";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates/queries";
import { renderInvitationImage } from "@/lib/render/renderInvitationImage";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DATA_URL_REGEX = /^data:image\/(jpeg|png|webp);base64,([a-zA-Z0-9+/]+=*)$/;
const MAX_IMAGE_DIMENSION = 6000;

const requestSchema = z.object({
  formData: invitationFormSchema,
  fotoAnakDataUrl: z.string().min(1, "Foto anak wajib diisi"),
  logoDataUrl: z.string().nullable(),
});

/**
 * Decode data URL lalu verifikasi BENAR-BENAR gambar valid (bukan cuma
 * percaya prefix "data:image/..." yang gampang dipalsukan client) — cek
 * lewat sharp().metadata(), yang akan gagal kalau bytes-nya bukan gambar
 * asli. Dimensi dibatasi supaya tidak ada yang coba kirim gambar raksasa
 * (decompression bomb) yang menghabiskan memori saat di-resize.
 */
async function dataUrlToVerifiedBuffer(dataUrl: string): Promise<Buffer> {
  const match = DATA_URL_REGEX.exec(dataUrl);
  if (!match) {
    throw new Error("Format foto harus JPG, PNG, atau WEBP");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Ukuran foto melebihi 10MB");
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error("File bukan gambar yang valid");
  }

  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error("Format gambar tidak didukung");
  }
  if (
    (metadata.width ?? 0) > MAX_IMAGE_DIMENSION ||
    (metadata.height ?? 0) > MAX_IMAGE_DIMENSION
  ) {
    throw new Error("Dimensi gambar terlalu besar");
  }

  return buffer;
}

// Diapakai flag ini supaya generate tidak gagal total kalau project Supabase
// belum di-setup (env masih placeholder dari .env.example) — render JPEG
// tetap jalan, cuma pencatatan riwayat ke DB yang di-skip.
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes("xxxxxxxxxxxx"));
}

const GENERATE_LIMIT = 5;
const GENERATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`generate:${clientIp}`, GENERATE_LIMIT, GENERATE_WINDOW_MS);
  if (rateLimit.limited) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid" },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { formData, fotoAnakDataUrl, logoDataUrl } = parsed.data;

  const supabase = await createClient();
  const template = await getTemplateById(supabase, formData.templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Tema tidak ditemukan" },
      { status: 404 }
    );
  }

  let photoBuffer: Buffer;
  let logoBuffer: Buffer | null = null;
  try {
    photoBuffer = await dataUrlToVerifiedBuffer(fotoAnakDataUrl);
    if (logoDataUrl) logoBuffer = await dataUrlToVerifiedBuffer(logoDataUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Foto tidak valid";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let resultBuffer: Buffer;
  try {
    resultBuffer = await renderInvitationImage({
      template,
      formData,
      photoBuffer,
      logoBuffer,
    });
  } catch (err) {
    console.error("Gagal render undangan:", err);
    return NextResponse.json(
      { error: "Gagal membuat gambar undangan" },
      { status: 500 }
    );
  }

  // Best-effort: catat riwayat generate ke Supabase. Upload foto/hasil ke
  // Supabase Storage sengaja belum dilakukan di tahap ini (bucket belum
  // tentu sudah dibuat) — cukup catat form_data & status di tabel
  // generated_images. Kegagalan di sini tidak boleh menggagalkan response JPEG.
  let generatedImageId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("generated_images")
        .insert({
          template_id: template.id,
          form_data: formData,
          status: "completed",
        })
        .select("id")
        .single();
      if (error) throw error;
      generatedImageId = data.id;
    } catch (err) {
      console.warn(
        "Lewati pencatatan ke Supabase (belum dikonfigurasi atau gagal):",
        err
      );
    }
  }

  return new NextResponse(new Uint8Array(resultBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `inline; filename="undangan-${template.id}.jpg"`,
      ...(generatedImageId
        ? { "X-Generated-Image-Id": generatedImageId }
        : {}),
    },
  });
}
