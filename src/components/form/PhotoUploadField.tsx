"use client";

import { useRef, useState } from "react";
import { validateImageFile } from "@/lib/validation/invitation-schema";
import { blobToDataUrl } from "@/lib/image/cropImage";
import ImageCropperModal from "./ImageCropperModal";

interface PhotoUploadFieldProps {
  label: string;
  /** Rasio wajib (width/height) frame foto pada template terpilih. */
  aspect: number;
  /** Data URL hasil crop, disimpan di form state (bukan File, supaya gampang di-persist). */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string;
}

export default function PhotoUploadField({
  label,
  aspect,
  value,
  onChange,
  error,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset supaya bisa pilih file yang sama lagi kalau ganti
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    // Dibuka otomatis ke cropper begitu file valid dipilih (sesuai spesifikasi:
    // "Setelah upload foto: cropper otomatis").
    setRawImageSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob) {
    const dataUrl = await blobToDataUrl(blob);
    onChange(dataUrl);
    closeCropper();
  }

  function closeCropper() {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="mt-1">
        {value ? (
          <div className="flex items-center gap-4">
            {/* Preview data URL hasil crop — bukan asset statis, next/image tidak relevan di sini. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview foto anak"
              className={`h-24 w-24 object-cover ring-1 ring-gray-200 ${
                aspect === 1 ? "rounded-full" : "rounded-lg"
              }`}
              style={aspect !== 1 ? { aspectRatio: aspect } : undefined}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-brand-600 px-4 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              Ganti Foto
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600"
          >
            <span className="text-2xl">📷</span>
            Klik untuk upload foto anak
            <span className="text-xs text-gray-400">
              JPG, PNG, atau WEBP — maks 10MB
            </span>
          </button>
        )}
      </div>

      {(localError || error) && (
        <p className="mt-1 text-xs text-red-600">{localError ?? error}</p>
      )}

      {rawImageSrc && (
        <ImageCropperModal
          imageSrc={rawImageSrc}
          aspect={aspect}
          cropShape={aspect === 1 ? "round" : "rect"}
          onCancel={closeCropper}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
