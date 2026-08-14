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
    // Wajib di-set SEBELUM src, dan HANYA untuk URL lintas-origin (http/https).
    // Data URL (base64, dipakai untuk foto anak yang diupload user) tidak
    // butuh ini dan browser akan mengabaikannya untuk data: URL.
    // Tanpa ini, gambar background/overlay tema (dimuat dari storage lain,
    // domain berbeda) membuat <canvas> "tainted" sehingga stage.toDataURL()
    // di PreviewClient (fitur download JPEG langsung dari preview) gagal
    // total dengan error "Tainted canvases may not be exported".
    if (/^https?:\/\//i.test(url)) {
      img.crossOrigin = "anonymous";
    }
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
