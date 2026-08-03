"use client";

import { useEffect, useState } from "react";

/**
 * Loader gambar minimal untuk Konva, sengaja tidak lewat HTMLImageElement.decode()
 * (dipakai library "use-image") — di beberapa environment (termasuk browser
 * testing/headless) promise dari decode() tidak pernah resolve walau event
 * "load" normal tetap terpicu, bikin gambar tidak pernah tampil. Cukup andalkan
 * "load"/"error", yang didukung semua browser dan cukup untuk drawImage() di canvas.
 */
export function useCanvasImage(url: string | null | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return image;
}
