"use client";

import { useRef, useState } from "react";
import { validateImageFile } from "@/lib/validation/invitation-schema";

interface LogoUploadFieldProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

// Logo bersifat opsional dan tidak melalui proses crop — cukup ditempel
// apa adanya oleh Sharp di posisi yang diatur admin (Tahap 5/6).
export default function LogoUploadField({ value, onChange }: LogoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Logo (opsional)
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="mt-1 flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Preview logo"
            className="h-16 w-16 rounded-lg object-contain ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xl text-gray-400">
            🖼️
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {value ? "Ganti Logo" : "Upload Logo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {localError && <p className="mt-1 text-xs text-red-600">{localError}</p>}
    </div>
  );
}
