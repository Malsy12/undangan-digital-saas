// Utility murni canvas untuk memotong gambar sesuai area crop dari react-easy-crop,
// termasuk rotasi. Hanya jalan di browser (dipanggil dari client component).

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function getRadianAngle(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Bounding box gambar setelah dirotasi, supaya kanvas rotasi tidak memotong sudut gambar.
function rotatedBoundingBox(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Menghasilkan Blob JPEG dari area crop (pixelCrop) & rotasi (derajat) yang
 * dipilih user di ImageCropperModal. outputWidth dibatasi 1080px karena itu
 * lebar akhir undangan (Sharp) — tidak perlu simpan resolusi lebih tinggi.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  outputWidth = 1080
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotatedBoundingBox(
    image.width,
    image.height,
    rotation
  );

  // Tahap 1: gambar penuh digambar ke kanvas sementara dalam kondisi diputar.
  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = bBoxWidth;
  rotatedCanvas.height = bBoxHeight;
  const rotatedCtx = rotatedCanvas.getContext("2d");
  if (!rotatedCtx) throw new Error("Canvas context tidak tersedia");

  rotatedCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotatedCtx.rotate(rotRad);
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  // Tahap 2: area crop dari kanvas yang sudah diputar, di-resize ke outputWidth.
  const outputHeight = Math.round((outputWidth / pixelCrop.width) * pixelCrop.height);
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("Canvas context tidak tersedia");

  outputCtx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal membuat blob hasil crop"))),
      "image/jpeg",
      0.9
    );
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
