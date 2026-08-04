"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInvitationStore } from "@/lib/store/useInvitationStore";
import type { Template } from "@/lib/templates/types";

type GenerateStatus = "idle" | "generating" | "success" | "error";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "undangan"
  );
}

export default function ResultClient() {
  const hasHydrated = useInvitationStore((s) => s.hasHydrated);
  const store = useInvitationStore();

  const [template, setTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);

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

  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const isDataComplete =
    template && store.namaAnak && store.fotoAnakDataUrl && store.jenisKelamin;

  const generate = useCallback(async () => {
    if (!template || !store.fotoAnakDataUrl) return;
    setStatus("generating");
    setErrorMessage(null);
    setShareNotice(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: {
            templateId: template.id,
            namaAnak: store.namaAnak,
            jenisKelamin: store.jenisKelamin,
            namaAyah: store.namaAyah,
            namaIbu: store.namaIbu,
            tanggalLahir: store.tanggalLahir,
            tanggalPelaksanaan: store.tanggalPelaksanaan,
            alamat: store.alamat,
            nomorWa: store.nomorWa,
            ucapan: store.ucapan,
            doa: store.doa,
            namaKeluarga: store.namaKeluarga,
          },
          fotoAnakDataUrl: store.fotoAnakDataUrl,
          logoDataUrl: store.logoDataUrl,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Gagal membuat undangan");
      }

      const blob = await response.blob();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      setResultBlob(blob);
      setResultUrl(url);
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal membuat undangan"
      );
      setStatus("error");
    }
  }, [template, store]);

  // Generate otomatis begitu halaman dibuka (mengikuti tombol "Lanjut ke
  // Generate" dari Preview), tapi hanya sekali.
  useEffect(() => {
    if (hasHydrated && isDataComplete && status === "idle") {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isDataComplete]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleShare() {
    if (!resultBlob || !template) return;
    const file = new File([resultBlob], `undangan-${slugify(store.namaAnak)}.jpg`, {
      type: "image/jpeg",
    });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Undangan Digital",
          text: `Undangan ${template.category} untuk ${store.namaAnak}`,
        });
      } catch {
        // Dibatalkan user — tidak perlu ditampilkan sebagai error.
      }
      return;
    }

    setShareNotice(
      "Share langsung ke WhatsApp belum didukung browser ini. Silakan download JPEG lalu kirim manual lewat WhatsApp."
    );
  }

  if (!hasHydrated || templateLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-sm text-gray-400">
        Memuat data...
      </main>
    );
  }

  if (!isDataComplete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Data undangan belum lengkap
        </h1>
        <p className="max-w-sm text-gray-600">
          Silakan isi form data anak terlebih dahulu sebelum generate undangan.
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
          <p className="text-xs text-gray-400">Undangan Selesai</p>
          <p className="font-semibold text-gray-900">{template.name}</p>
        </div>
        <Link
          href={`/form?template=${template.id}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Edit Data
        </Link>
      </div>

      {status === "generating" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-100 py-16">
          <div className="h-2 w-2/3 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-brand-600" />
          </div>
          <p className="text-sm text-gray-500">
            Sedang membuat undangan JPEG...
          </p>
          <style>{`
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={generate}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {status === "success" && resultUrl && (
        <>
          {/* Data URL/blob hasil generate — bukan asset statis, next/image tidak relevan. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="Hasil undangan"
            className="w-full rounded-2xl shadow-md"
          />

          {shareNotice && (
            <p className="mt-3 text-center text-xs text-amber-600">
              {shareNotice}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={resultUrl}
              download={`undangan-${slugify(store.namaAnak)}.jpg`}
              className="rounded-full bg-brand-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
            >
              Download JPEG
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full border border-green-600 py-3 text-sm font-semibold text-green-600 hover:bg-green-50"
            >
              Share ke WhatsApp
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={generate}
                className="flex-1 rounded-full border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Generate Ulang
              </button>
              <Link
                href={`/form?template=${template.id}`}
                className="flex-1 rounded-full border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Edit Data
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
