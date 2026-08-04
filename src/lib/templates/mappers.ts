import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_KELUARGA_LAYER,
  type TemplateLayout,
} from "@/lib/template-layout";
import type { Database } from "@/lib/supabase/database.types";
import type { Template, TemplateFormInput } from "./types";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateInsertRow = Database["public"]["Tables"]["templates"]["Insert"];

// Kolom "photo_placeholder" jsonb dipakai juga untuk menyimpan logoPlaceholder
// (di key "logo") supaya tidak perlu migration kolom baru — lihat catatan di
// supabase/migrations/0001_init_schema.sql yang cuma menyiapkan photo_placeholder
// untuk foto anak.
interface PhotoPlaceholderColumn {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "circle" | "rect";
  shadow?: TemplateLayout["photoPlaceholder"]["shadow"];
  logo?: TemplateLayout["logoPlaceholder"];
}

const DEFAULT_LOGO_PLACEHOLDER: TemplateLayout["logoPlaceholder"] = {
  x: CANVAS_WIDTH - 160,
  y: 56,
  size: 96,
};

export function rowToTemplate(row: TemplateRow): Template {
  // "keluarga" ditambahkan belakangan — tema yang dibuat sebelum fitur ini
  // ada belum punya key ini di JSON "text_positions", jadi diisi fallback
  // supaya tidak undefined saat dipakai preview/render.
  const rawTextLayers = row.text_positions as unknown as Partial<
    TemplateLayout["textLayers"]
  >;
  const textLayers: TemplateLayout["textLayers"] = {
    ...rawTextLayers,
    keluarga: rawTextLayers.keluarga ?? DEFAULT_KELUARGA_LAYER,
  } as TemplateLayout["textLayers"];
  const photoPlaceholderColumn =
    row.photo_placeholder as unknown as PhotoPlaceholderColumn;
  const { logo, ...photoPlaceholder } = photoPlaceholderColumn;

  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "Aqiqah",
    isActive: row.is_active,
    thumbnailUrl: row.thumbnail_url,
    backgroundUrl: row.background_url,
    overlayUrl: row.overlay_url,
    dominantColor: row.dominant_color,
    fontName: row.font_name,
    fontSize: row.font_size,
    fontColor: row.font_color,
    layout: {
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      textLayers,
      photoPlaceholder,
      logoPlaceholder: logo ?? DEFAULT_LOGO_PLACEHOLDER,
    },
  };
}

export function templateInputToRow(
  input: TemplateFormInput
): Omit<TemplateInsertRow, "id" | "created_at" | "updated_at"> {
  const photoPlaceholderColumn: PhotoPlaceholderColumn = {
    ...input.layout.photoPlaceholder,
    logo: input.layout.logoPlaceholder,
  };

  return {
    name: input.name,
    category: input.category,
    is_active: input.isActive,
    thumbnail_url: input.thumbnailUrl,
    background_url: input.backgroundUrl,
    overlay_url: input.overlayUrl,
    dominant_color: input.dominantColor,
    font_name: input.fontName,
    font_size: input.fontSize,
    font_color: input.fontColor,
    text_positions: input.layout.textLayers as unknown as Record<string, unknown>,
    photo_placeholder: photoPlaceholderColumn as unknown as Record<string, unknown>,
    layers: [],
  };
}
