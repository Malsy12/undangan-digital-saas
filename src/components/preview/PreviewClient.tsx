"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type Konva from "konva";
import { useInvitationStore } from "@/lib/store/useInvitationStore";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/template-layout";
import type { Template } from "@/lib/templates/types";

// Konva butuh <canvas> browser API -- tidak boleh ikut di-render di server.
const InvitationCanvasStage = dynamic(
  () => import("./InvitationCanvasStage"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      >
        Memuat preview...
      </div>
    ),
  }
);

export default function PreviewClient() {
  const hasHydrated = useInvitationStore((s) => s.hasHydrated);
  const store = useInvitationStore();

  const [template, setTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const stageRef = useRef<Konva.Stage>(null);

  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !store.templateId) {
      setTemplateLoading(false);
      return;
    }
    setTemplateLoading(true);
    fetch(`/api/templates/${store.templateId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTemplate(data))
      .finally(() => setTemplateLoading(false));
  }, [hasHydrated, store.templateId]);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerEl) return;
    setContainerWidth(containerEl.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  function handleDownloadJpegFromPreview() {
    const stage = stageRef.current;
    if (!stage || containerWidth <= 0) return;
    const pixelRatio = CANVAS_WIDTH / containerWidth;
    const dataUrl = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.95,
      pixelRatio,
    });
    const filename = `undangan-${template?.name ?? "preview"}.jpg`;

    try {
      const byteString = atob(dataUrl.split(",")[1]);
      const byteArray = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {}

    setSavedImageUrl(dataUrl);
  }

  if (!hasHydrated || templateLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-sm text-gray-400">
        Memuat data...
      </main>
    );
  }

  const isDataComplete =
    template && store.namaAnak && store.fotoAnakDataUrl && store.jenisKelamin;

  if (!isDataComplete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Data undangan belum lengkap
        </h1>
        <p className="max-w-sm text-gray-600">
          Silakan isi form data anak terlebih dahulu sebelum melihat preview.
        </p>
        <Link
          href="/#tema"
          className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Pilih Tema
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs text-gray-400">Preview Undangan</p>
          <p className="font-semibold text-gray-900">{template.name}</p>
        </div>
        <Link
          href={`/form?template=${template.id}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Edit Data
        </Link>
      </div>

      <div ref={setContainerEl} className="w-full">
        {containerWidth > 0 && (
          <InvitationCanvasStage
            ref={stageRef}
            template={template}
            formData={{
              namaAnak: store.namaAnak,
              jenisKelamin: store.jenisKelamin,
              namaAyah: store.namaAyah,
              namaIbu: store.namaIbu,
              tanggalLahir: store.tanggalLahir,
              tanggalPelaksanaan: store.tanggalPelaksanaan,
              alamat: store.alamat,
              ucapan: store.ucapan,
              doa: store.doa,
              namaKeluarga: store.namaKeluarga,
            }}
            fotoAnakDataUrl={store.fotoAnakDataUrl!}
            logoDataUrl={store.logoDataUrl}
            containerWidth={containerWidth}
          />
        )}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        Elemen teks & foto otomatis dipotong (...) kalau kepanjangan supaya
        tidak keluar dari frame.
      </p>

      <button
        type="button"
        onClick={handleDownloadJpegFromPreview}
        className="mt-6 w-full rounded-full bg-brand-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
      >
        Download JPEG dari Preview Ini
      </button>

      <div className="mt-3 flex gap-3">
        <Link
          href={`/form?template=${template.id}`}
          className="flex-1 rounded-full border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Kembali ke Form
        </Link>
        <Link
          href="/result"
          className="flex-1 rounded-full border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Lanjut ke Generate (server)
        </Link>
      </div>

      {savedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-6"
          onClick={() => setSavedImageUrl(null)}
        >
          <p className="max-w-xs text-center text-sm font-medium text-white">
            Tekan &amp; tahan gambar di bawah ini, lalu pilih &quot;Simpan ke
            Foto&quot; (iPhone/Safari) -- atau klik kanan lalu &quot;Simpan
            Gambar&quot; (desktop).
          </p>
          <img
            src={savedImageUrl}
            alt="Preview undangan untuk disimpan"
            className="max-h-[70vh] w-auto rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setSavedImageUrl(null)}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900"
          >
            Tutup
          </button>
        </div>
      )}
    </main>
  );
}
