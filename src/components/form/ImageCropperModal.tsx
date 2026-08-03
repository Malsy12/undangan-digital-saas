"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob, type PixelCrop } from "@/lib/image/cropImage";

interface ImageCropperModalProps {
  imageSrc: string;
  /** Rasio lebar/tinggi wajib, mengikuti photo_placeholder template. */
  aspect: number;
  /** "round" dipakai kalau frame template berbentuk lingkaran (aspect = 1). */
  cropShape?: "rect" | "round";
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function ImageCropperModal({
  imageSrc,
  aspect,
  cropShape = "rect",
  onCancel,
  onConfirm,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onConfirm(blob);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="relative h-80 w-full bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-gray-600">
              Zoom
              <span>{zoom.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-medium text-gray-600">
              Rotasi
              <span>{rotation}°</span>
            </label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                ⟲ Putar Kiri
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                ⟳ Putar Kanan
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 rounded-full bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isProcessing ? "Memproses..." : "Gunakan Foto Ini"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
