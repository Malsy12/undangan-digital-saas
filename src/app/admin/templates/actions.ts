"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/templates/queries";
import type { TemplateFormInput } from "@/lib/templates/types";

// Nama bucket case-sensitive di Supabase Storage — sesuaikan kalau Anda
// membuat bucket dengan nama berbeda dari "Templates".
const STORAGE_BUCKET = "Templates";
const MAX_ASSET_BYTES = 4 * 1024 * 1024;

// Upload dilakukan lewat service-role client (bukan client Storage RLS biasa)
// karena action ini hanya bisa dipanggil dari halaman yang sudah dijaga
// middleware admin — jadi aman melewati RLS Storage yang belum tentu di-setup.
//
// Validasi ukuran & tipe di TemplateForm (client) bisa dilewati kalau ada yang
// memanggil action ini langsung, jadi tetap dicek ulang di sini: ukuran, DAN
// verifikasi kontennya benar-benar gambar (bukan cuma percaya file.type yang
// gampang dipalsukan) lewat sharp().metadata().
async function uploadIfPresent(
  formData: FormData,
  fileKey: string,
  existingUrlKey: string
): Promise<string | null> {
  const file = formData.get(fileKey);
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_ASSET_BYTES) {
      throw new Error(
        `Ukuran file "${fileKey}" melebihi ${MAX_ASSET_BYTES / (1024 * 1024)}MB`
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let format: string | undefined;
    try {
      format = (await sharp(buffer).metadata()).format;
    } catch {
      throw new Error(`File "${fileKey}" bukan gambar yang valid`);
    }
    if (!format || !["jpeg", "png", "webp"].includes(format)) {
      throw new Error(`Format file "${fileKey}" harus JPG, PNG, atau WEBP`);
    }

    const admin = createAdminClient();
    const path = `${randomUUID()}.${format === "jpeg" ? "jpg" : format}`;
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
  const existing = formData.get(existingUrlKey);
  return typeof existing === "string" && existing.length > 0 ? existing : null;
}

/**
 * Satu Server Action untuk create & update — dibedakan lewat parameter "id".
 * FormData berisi field JSON di key "payload" + (opsional) file thumbnail/
 * background/overlay yang baru dipilih admin.
 */
export async function saveTemplateAction(id: string | null, formData: FormData) {
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    throw new Error("Payload template tidak ditemukan");
  }
  const payload = JSON.parse(payloadRaw) as Omit<
    TemplateFormInput,
    "thumbnailUrl" | "backgroundUrl" | "overlayUrl"
  >;

  const [thumbnailUrl, backgroundUrl, overlayUrl] = await Promise.all([
    uploadIfPresent(formData, "thumbnail", "existingThumbnailUrl"),
    uploadIfPresent(formData, "background", "existingBackgroundUrl"),
    uploadIfPresent(formData, "overlay", "existingOverlayUrl"),
  ]);

  const input: TemplateFormInput = {
    ...payload,
    thumbnailUrl,
    backgroundUrl,
    overlayUrl,
  };

  const admin = createAdminClient();
  if (id) {
    await updateTemplate(admin, id, input);
  } else {
    await createTemplate(admin, input);
  }

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function deleteTemplateAction(id: string) {
  const admin = createAdminClient();
  await deleteTemplate(admin, id);
  revalidatePath("/admin/templates");
}
