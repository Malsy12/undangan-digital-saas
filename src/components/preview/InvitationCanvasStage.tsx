"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { useCanvasImage } from "@/lib/hooks/useCanvasImage";
import { CANVAS_WIDTH, CANVAS_HEIGHT, type TextLayer } from "@/lib/template-layout";
import type { Template } from "@/lib/templates/types";

export interface InvitationFormPreviewData {
  namaAnak: string;
  jenisKelamin: "Laki-laki" | "Perempuan" | "";
  namaAyah: string;
  namaIbu: string;
  tanggalLahir: string;
  tanggalPelaksanaan: string;
  alamat: string;
  ucapan: string;
  doa: string;
}

interface InvitationCanvasStageProps {
  template: Template;
  formData: InvitationFormPreviewData;
  /** String kosong ("") dianggap "belum ada foto" — dipakai admin editor untuk preview tanpa foto asli. */
  fotoAnakDataUrl: string;
  logoDataUrl: string | null;
  /** Lebar tampilan aktual (px) di layar — dipakai untuk scale kanvas 1080px agar responsif. */
  containerWidth: number;
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Komponen ini HANYA boleh dirender di client (Konva butuh <canvas>), makanya
// selalu diimpor lewat next/dynamic({ ssr: false }). Dipakai baik di preview
// customer (PreviewClient) maupun live preview editor admin (TemplateForm).
export default function InvitationCanvasStage({
  template,
  formData,
  fotoAnakDataUrl,
  logoDataUrl,
  containerWidth,
}: InvitationCanvasStageProps) {
  const photoImage = useCanvasImage(fotoAnakDataUrl);
  const logoImage = useCanvasImage(logoDataUrl);
  const backgroundImage = useCanvasImage(template.backgroundUrl);
  const overlayImage = useCanvasImage(template.overlayUrl);
  const layerRef = useRef<Konva.Layer>(null);

  // HTMLImageElement selesai loading di luar siklus render Konva (async), jadi
  // layer perlu diminta redraw manual — draw() dipakai (bukan batchDraw yang
  // bergantung requestAnimationFrame) supaya pasti langsung ter-render.
  useEffect(() => {
    layerRef.current?.draw();
  }, [photoImage, logoImage, backgroundImage, overlayImage]);

  const layout = template.layout;
  const scale = containerWidth / CANVAS_WIDTH;
  const sebutan = formData.jenisKelamin === "Laki-laki" ? "Putra" : "Putri";

  function renderTextLayer(text: string, layer: TextLayer, defaultFill: string) {
    return (
      <Text
        text={text}
        {...layer}
        fill={layer.color ?? defaultFill}
        fontFamily={template.fontName}
        wrap="word"
        ellipsis
      />
    );
  }

  return (
    <Stage
      width={CANVAS_WIDTH * scale}
      height={CANVAS_HEIGHT * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer ref={layerRef}>
        {/* Background: pakai background_url asli kalau sudah diupload admin, else solid dominantColor. */}
        {backgroundImage ? (
          <KonvaImage
            image={backgroundImage}
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={template.dominantColor}
          />
        )}

        {renderTextLayer(
          template.category.toUpperCase(),
          layout.textLayers.kategori,
          "#ffffff"
        )}

        {/* Shadow frame foto: shape solid TANPA clip, digambar di bawah foto —
            bagian tengahnya nanti tertutup total oleh foto, yang kelihatan cuma
            bayangan yang meluber di luar frame. */}
        {layout.photoPlaceholder.shadow?.enabled &&
          (layout.photoPlaceholder.shape === "circle" ? (
            <Circle
              x={layout.photoPlaceholder.x + layout.photoPlaceholder.width / 2}
              y={layout.photoPlaceholder.y + layout.photoPlaceholder.height / 2}
              radius={layout.photoPlaceholder.width / 2}
              fill="#ffffff"
              shadowColor={layout.photoPlaceholder.shadow.color}
              shadowBlur={layout.photoPlaceholder.shadow.blur}
              shadowOffsetX={layout.photoPlaceholder.shadow.offsetX}
              shadowOffsetY={layout.photoPlaceholder.shadow.offsetY}
              shadowOpacity={layout.photoPlaceholder.shadow.opacity}
            />
          ) : (
            <Rect
              x={layout.photoPlaceholder.x}
              y={layout.photoPlaceholder.y}
              width={layout.photoPlaceholder.width}
              height={layout.photoPlaceholder.height}
              cornerRadius={20}
              fill="#ffffff"
              shadowColor={layout.photoPlaceholder.shadow.color}
              shadowBlur={layout.photoPlaceholder.shadow.blur}
              shadowOffsetX={layout.photoPlaceholder.shadow.offsetX}
              shadowOffsetY={layout.photoPlaceholder.shadow.offsetY}
              shadowOpacity={layout.photoPlaceholder.shadow.opacity}
            />
          ))}

        {/* Frame foto: di-clip sesuai bentuk (lingkaran/kotak) supaya foto tidak pernah keluar frame. */}
        <Group
          clipFunc={(ctx) => {
            const { x, y, width, height, shape } = layout.photoPlaceholder;
            ctx.beginPath();
            if (shape === "circle") {
              const r = width / 2;
              ctx.arc(x + r, y + height / 2, r, 0, Math.PI * 2, false);
            } else {
              ctx.roundRect(x, y, width, height, 20);
            }
          }}
        >
          {photoImage ? (
            <KonvaImage
              image={photoImage}
              x={layout.photoPlaceholder.x}
              y={layout.photoPlaceholder.y}
              width={layout.photoPlaceholder.width}
              height={layout.photoPlaceholder.height}
            />
          ) : (
            <Rect
              x={layout.photoPlaceholder.x}
              y={layout.photoPlaceholder.y}
              width={layout.photoPlaceholder.width}
              height={layout.photoPlaceholder.height}
              fill="#ffffff"
              opacity={0.4}
            />
          )}
        </Group>

        {/* Overlay dekoratif (bingkai/ornamen) opsional, di atas foto sebelum teks. */}
        {overlayImage && (
          <KonvaImage
            image={overlayImage}
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        )}

        {logoImage && (
          <KonvaImage
            image={logoImage}
            x={layout.logoPlaceholder.x}
            y={layout.logoPlaceholder.y}
            width={layout.logoPlaceholder.size}
            height={layout.logoPlaceholder.size}
          />
        )}

        {renderTextLayer(
          formData.namaAnak || "Nama Anak",
          layout.textLayers.namaAnak,
          template.fontColor
        )}
        {renderTextLayer(
          `${sebutan} dari Bapak ${formData.namaAyah || "-"} & Ibu ${
            formData.namaIbu || "-"
          }`,
          layout.textLayers.orangTua,
          template.fontColor
        )}
        {renderTextLayer(
          `Lahir: ${formatTanggal(
            formData.tanggalLahir
          )}\nAcara: ${formatTanggal(formData.tanggalPelaksanaan)}`,
          layout.textLayers.tanggal,
          template.fontColor
        )}
        {renderTextLayer(
          formData.alamat || "-",
          layout.textLayers.alamat,
          template.fontColor
        )}
        {renderTextLayer(
          formData.ucapan || "-",
          layout.textLayers.ucapan,
          template.fontColor
        )}
        {renderTextLayer(
          formData.doa || "-",
          layout.textLayers.doa,
          template.fontColor
        )}
      </Layer>
    </Stage>
  );
}
