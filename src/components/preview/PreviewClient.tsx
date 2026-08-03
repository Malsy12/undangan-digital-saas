"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useInvitationStore } from "@/lib/store/useInvitationStore";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/template-layout";
import type { Template } from "@/lib/templates/types";

// Konva butuh <canvas> browser API — tidak boleh ikut di-render di server.
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

  // Komponen ini client-only (data dari localStorage), jadi tema diambil
  // lewat API route publik /api/templates/[id], bukan query Supabase langsung.
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

  // State (bukan useRef biasa) supaya effect di bawah otomatis jalan ulang
  // begitu div kontainer benar-benar ter-mount — perlu karena divnya baru
  // muncul setelah kondisi "hasHydrated"/"isDataComplete" terpenuhi, jadi
  // useRef+useEffect([]) klasik akan lolos duluan saat container masih null.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerEl) return;
    // Ukur langsung begitu container ter-mount — jangan tunggu callback
    // pertama ResizeObserver, supaya kanvas tetap muncul instan meski RO
    // baru benar-benar terpicu belakangan saat window di-resize.
    setContainerWidth(containerEl.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

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

      <div className="mt-6 flex gap-3">
        <Link
          href={`/form?template=${template.id}`}
          className="flex-1 rounded-full border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Kembali ke Form
        </Link>
        <Link
          href="/result"
          className="flex-1 rounded-full bg-brand-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
        >
          Lanjut ke Generate
        </Link>
      </div>
    </main>
  );
}
