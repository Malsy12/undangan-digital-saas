"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  getDefaultLayout,
  type TemplateLayout,
  type TextLayer,
} from "@/lib/template-layout";
import type { Template, TemplateCategory } from "@/lib/templates/types";
import { saveTemplateAction } from "@/app/admin/templates/actions";

const InvitationCanvasStage = dynamic(
  () => import("@/components/preview/InvitationCanvasStage"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[9/16] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
        Memuat preview...
      </div>
    ),
  }
);

// Data contoh untuk live preview editor — admin belum tentu punya foto/data
// customer asli, jadi dipakai teks placeholder yang representatif.
const SAMPLE_FORM_DATA = {
  namaAnak: "Nama Anak",
  jenisKelamin: "Perempuan" as const,
  namaAyah: "Nama Ayah",
  namaIbu: "Nama Ibu",
  tanggalLahir: "2026-01-01",
  tanggalPelaksanaan: "2026-02-01",
  alamat: "Contoh alamat lengkap tempat acara akan ditampilkan di sini",
  ucapan: "Contoh kalimat ucapan undangan akan tampil di sini.",
  doa: "Contoh kalimat doa akan tampil di sini.",
};

const TEXT_LAYER_LABELS: Record<keyof TemplateLayout["textLayers"], string> = {
  kategori: "Label Kategori",
  namaAnak: "Nama Anak",
  orangTua: "Nama Orang Tua",
  tanggal: "Tanggal",
  alamat: "Alamat",
  ucapan: "Ucapan",
  doa: "Doa",
};

const PREVIEW_WIDTH = 320;
// Dibatasi per-file (bukan cuma andalkan limit total Server Action di
// next.config.mjs) supaya admin dapat pesan error yang jelas dari awal.
const MAX_TEMPLATE_ASSET_BYTES = 4 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const labelClass = "block text-xs font-medium text-gray-500";

export default function TemplateForm({
  initialTemplate,
}: {
  initialTemplate?: Template;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState(initialTemplate?.name ?? "");
  const [category, setCategory] = useState<TemplateCategory>(
    initialTemplate?.category ?? "Aqiqah"
  );
  const [isActive, setIsActive] = useState(initialTemplate?.isActive ?? true);
  const [dominantColor, setDominantColor] = useState(
    initialTemplate?.dominantColor ?? "#ec4899"
  );
  const [fontName, setFontName] = useState(initialTemplate?.fontName ?? "Poppins");
  const [fontColor, setFontColor] = useState(
    initialTemplate?.fontColor ?? "#1f2937"
  );
  const [fontSize, setFontSize] = useState(initialTemplate?.fontSize ?? 32);

  const [layout, setLayout] = useState<TemplateLayout>(
    initialTemplate?.layout ?? getDefaultLayout(1)
  );

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialTemplate?.thumbnailUrl ?? null
  );
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    initialTemplate?.backgroundUrl ?? null
  );
  const [overlayPreview, setOverlayPreview] = useState<string | null>(
    initialTemplate?.overlayUrl ?? null
  );

  function updatePhotoField(
    field: "x" | "y" | "width" | "height",
    value: number
  ) {
    setLayout((prev) => ({
      ...prev,
      photoPlaceholder: { ...prev.photoPlaceholder, [field]: value },
    }));
  }

  function updatePhotoShape(shape: "circle" | "rect") {
    setLayout((prev) => ({
      ...prev,
      photoPlaceholder: { ...prev.photoPlaceholder, shape },
    }));
  }

  function updateLogoField(field: "x" | "y" | "size", value: number) {
    setLayout((prev) => ({
      ...prev,
      logoPlaceholder: { ...prev.logoPlaceholder, [field]: value },
    }));
  }

  function updateTextLayer(
    key: keyof TemplateLayout["textLayers"],
    field: keyof TextLayer,
    value: string | number
  ) {
    setLayout((prev) => ({
      ...prev,
      textLayers: {
        ...prev.textLayers,
        [key]: { ...prev.textLayers[key], [field]: value },
      },
    }));
  }

  function handleFilePicked(
    kind: "thumbnail" | "background" | "overlay",
    file: File | null
  ) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Asset gambar harus JPG, PNG, atau WEBP");
      return;
    }
    if (file.size > MAX_TEMPLATE_ASSET_BYTES) {
      setErrorMessage(
        `Ukuran ${kind} maksimal ${MAX_TEMPLATE_ASSET_BYTES / (1024 * 1024)}MB`
      );
      return;
    }
    setErrorMessage(null);

    const url = URL.createObjectURL(file);
    if (kind === "thumbnail") {
      setThumbnailFile(file);
      setThumbnailPreview(url);
    } else if (kind === "background") {
      setBackgroundFile(file);
      setBackgroundPreview(url);
    } else {
      setOverlayFile(file);
      setOverlayPreview(url);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      name,
      category,
      isActive,
      dominantColor,
      fontName,
      fontSize,
      fontColor,
      layout,
    };

    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
    if (backgroundFile) fd.append("background", backgroundFile);
    if (overlayFile) fd.append("overlay", overlayFile);
    fd.append("existingThumbnailUrl", initialTemplate?.thumbnailUrl ?? "");
    fd.append("existingBackgroundUrl", initialTemplate?.backgroundUrl ?? "");
    fd.append("existingOverlayUrl", initialTemplate?.overlayUrl ?? "");

    startTransition(async () => {
      try {
        await saveTemplateAction(initialTemplate?.id ?? null, fd);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal menyimpan tema"
        );
      }
    });
  }

  const previewTemplate: Template = {
    id: initialTemplate?.id ?? "preview",
    name: name || "Nama Tema",
    category,
    isActive,
    thumbnailUrl: thumbnailPreview,
    backgroundUrl: backgroundPreview,
    overlayUrl: overlayPreview,
    dominantColor,
    fontName,
    fontSize,
    fontColor,
    layout,
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-8">
        {/* Info dasar */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Info Dasar</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama Tema</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Mis. Aqiqah Putri Floral"
              />
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className={inputClass}
              >
                <option value="Aqiqah">Aqiqah</option>
                <option value="Kelahiran">Kelahiran</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Warna Dominan</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={dominantColor}
                  onChange={(e) => setDominantColor(e.target.value)}
                  className="h-9 w-9 rounded border border-gray-300"
                />
                <input
                  value={dominantColor}
                  onChange={(e) => setDominantColor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Nama Font</label>
              <input
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Warna Font</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="h-9 w-9 rounded border border-gray-300"
                />
                <input
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Ukuran Font Dasar</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-brand-600"
            />
            Tampilkan di landing page (aktif)
          </label>
        </section>

        {/* Asset gambar */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Asset Gambar</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                ["thumbnail", "Thumbnail", thumbnailPreview],
                ["background", "Background", backgroundPreview],
                ["overlay", "Overlay (opsional)", overlayPreview],
              ] as const
            ).map(([kind, label, previewUrl]) => (
              <div key={kind}>
                <label className={labelClass}>{label}</label>
                <div className="mt-1 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Belum ada</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    handleFilePicked(kind, e.target.files?.[0] ?? null)
                  }
                  className="mt-2 w-full text-xs"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Frame foto & logo */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Posisi Frame Foto & Logo
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className={labelClass}>X</label>
              <input
                type="number"
                value={layout.photoPlaceholder.x}
                onChange={(e) => updatePhotoField("x", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Y</label>
              <input
                type="number"
                value={layout.photoPlaceholder.y}
                onChange={(e) => updatePhotoField("y", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lebar</label>
              <input
                type="number"
                value={layout.photoPlaceholder.width}
                onChange={(e) =>
                  updatePhotoField("width", Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tinggi</label>
              <input
                type="number"
                value={layout.photoPlaceholder.height}
                onChange={(e) =>
                  updatePhotoField("height", Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Bentuk</label>
              <select
                value={layout.photoPlaceholder.shape}
                onChange={(e) =>
                  updatePhotoShape(e.target.value as "circle" | "rect")
                }
                className={inputClass}
              >
                <option value="circle">Lingkaran</option>
                <option value="rect">Kotak</option>
              </select>
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Rasio crop foto customer mengikuti lebar/tinggi di atas (
            {(layout.photoPlaceholder.width / layout.photoPlaceholder.height).toFixed(2)}
            ).
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Logo X</label>
              <input
                type="number"
                value={layout.logoPlaceholder.x}
                onChange={(e) => updateLogoField("x", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Logo Y</label>
              <input
                type="number"
                value={layout.logoPlaceholder.y}
                onChange={(e) => updateLogoField("y", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ukuran Logo</label>
              <input
                type="number"
                value={layout.logoPlaceholder.size}
                onChange={(e) =>
                  updateLogoField("size", Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Posisi teks */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Posisi Teks</h2>
          <div className="space-y-5">
            {(
              Object.keys(layout.textLayers) as Array<
                keyof TemplateLayout["textLayers"]
              >
            ).map((key) => {
              const layer = layout.textLayers[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    {TEXT_LAYER_LABELS[key]}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                    <div>
                      <label className={labelClass}>X</label>
                      <input
                        type="number"
                        value={layer.x}
                        onChange={(e) =>
                          updateTextLayer(key, "x", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Y</label>
                      <input
                        type="number"
                        value={layer.y}
                        onChange={(e) =>
                          updateTextLayer(key, "y", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Lebar</label>
                      <input
                        type="number"
                        value={layer.width}
                        onChange={(e) =>
                          updateTextLayer(key, "width", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tinggi</label>
                      <input
                        type="number"
                        value={layer.height}
                        onChange={(e) =>
                          updateTextLayer(key, "height", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Ukuran Font</label>
                      <input
                        type="number"
                        value={layer.fontSize}
                        onChange={(e) =>
                          updateTextLayer(
                            key,
                            "fontSize",
                            Number(e.target.value)
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Gaya</label>
                      <select
                        value={layer.fontStyle ?? "normal"}
                        onChange={(e) =>
                          updateTextLayer(key, "fontStyle", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="italic">Italic</option>
                        <option value="bold italic">Bold Italic</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Warna (opsional)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={layer.color ?? fontColor}
                          onChange={(e) =>
                            updateTextLayer(key, "color", e.target.value)
                          }
                          className="h-8 w-8 shrink-0 rounded border border-gray-300"
                        />
                        {layer.color && (
                          <button
                            type="button"
                            onClick={() =>
                              setLayout((prev) => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { color: _color, ...rest } =
                                  prev.textLayers[key];
                                return {
                                  ...prev,
                                  textLayers: { ...prev.textLayers, [key]: rest },
                                };
                              })
                            }
                            className="text-xs text-gray-400 hover:text-gray-600"
                            title="Pakai warna font dasar"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Tema"}
        </button>
      </div>

      <div className="lg:sticky lg:top-8 lg:h-fit">
        <p className="mb-2 text-xs font-medium text-gray-500">
          Live Preview (data contoh)
        </p>
        <div style={{ width: PREVIEW_WIDTH }}>
          <InvitationCanvasStage
            template={previewTemplate}
            formData={SAMPLE_FORM_DATA}
            fotoAnakDataUrl=""
            logoDataUrl={null}
            containerWidth={PREVIEW_WIDTH}
          />
        </div>
      </div>
    </form>
  );
}
