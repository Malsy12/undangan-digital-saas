import type { TemplateLayout } from "@/lib/template-layout";

export type TemplateCategory = "Aqiqah" | "Kelahiran";

/**
 * Bentuk template yang dipakai di seluruh aplikasi (landing, form, preview,
 * generate, admin) — hasil mapping dari baris tabel "templates" Supabase.
 * Rasio crop foto TIDAK disimpan terpisah, cukup dihitung dari
 * layout.photoPlaceholder.width / height (lihat getPhotoAspectRatio).
 */
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  isActive: boolean;
  thumbnailUrl: string | null;
  backgroundUrl: string | null;
  overlayUrl: string | null;
  dominantColor: string;
  fontName: string;
  fontSize: number;
  fontColor: string;
  layout: TemplateLayout;
}

/** Payload dari form admin (create/update) — tanpa id/created_at/updated_at. */
export interface TemplateFormInput {
  name: string;
  category: TemplateCategory;
  isActive: boolean;
  thumbnailUrl: string | null;
  backgroundUrl: string | null;
  overlayUrl: string | null;
  dominantColor: string;
  fontName: string;
  fontSize: number;
  fontColor: string;
  layout: TemplateLayout;
}

export function getPhotoAspectRatio(template: Pick<Template, "layout">): number {
  const { width, height } = template.layout.photoPlaceholder;
  return width / height;
}
