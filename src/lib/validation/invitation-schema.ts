import { z } from "zod";

// Nomor WA Indonesia: boleh diawali "08" atau "+62"/"62", diikuti 8-12 digit.
const WA_REGEX = /^(?:\+?62|0)8[1-9][0-9]{6,10}$/;

// Skema ini dipakai di client (react-hook-form, Tahap 3) dan nantinya dipakai
// ulang di API route /api/generate (Tahap 5) supaya validasi client & server
// konsisten dari satu sumber kebenaran.
export const invitationFormSchema = z.object({
  templateId: z.string().min(1, "Tema belum dipilih"),
  namaAnak: z.string().min(2, "Nama anak minimal 2 karakter").max(100),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], {
    error: "Pilih jenis kelamin",
  }),
  namaAyah: z.string().min(2, "Nama ayah minimal 2 karakter").max(100),
  namaIbu: z.string().min(2, "Nama ibu minimal 2 karakter").max(100),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  tanggalPelaksanaan: z.string().min(1, "Tanggal pelaksanaan wajib diisi"),
  alamat: z.string().min(10, "Alamat minimal 10 karakter").max(500),
  nomorWa: z
    .string()
    .regex(WA_REGEX, "Format nomor WA tidak valid, contoh: 081234567890"),
  ucapan: z.string().min(5, "Ucapan minimal 5 karakter").max(500),
  doa: z.string().min(5, "Doa minimal 5 karakter").max(500),
  // Opsional — kalau diisi, dipakai sebagai baris penutup "Kami yang
  // berbahagia, <namaKeluarga>" di gambar undangan.
  namaKeluarga: z.string().max(150, "Maksimal 150 karakter").optional(),
});

export type InvitationFormValues = z.infer<typeof invitationFormSchema>;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Validasi file foto/logo yang diunggah. Return null jika valid, atau pesan error. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Format file harus JPG, PNG, atau WEBP";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Ukuran file maksimal 10MB";
  }
  return null;
}
