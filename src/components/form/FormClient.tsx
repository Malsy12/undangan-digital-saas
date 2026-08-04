"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  invitationFormSchema,
  type InvitationFormValues,
} from "@/lib/validation/invitation-schema";
import { useInvitationStore } from "@/lib/store/useInvitationStore";
import { getPhotoAspectRatio, type Template } from "@/lib/templates/types";
import FieldWrapper from "./FieldWrapper";
import PhotoUploadField from "./PhotoUploadField";
import LogoUploadField from "./LogoUploadField";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default function FormClient({
  template,
}: {
  template: Template | null;
}) {
  const router = useRouter();
  const hasHydrated = useInvitationStore((s) => s.hasHydrated);

  // Snapshot awal (bisa saja masih kosong kalau localStorage belum selesai
  // di-hydrate) — nilai final di-set ulang lewat reset() di useEffect bawah.
  const initialSnapshot = useInvitationStore.getState();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      templateId: template?.id ?? "",
      namaAnak: initialSnapshot.namaAnak,
      jenisKelamin: initialSnapshot.jenisKelamin || undefined,
      namaAyah: initialSnapshot.namaAyah,
      namaIbu: initialSnapshot.namaIbu,
      tanggalLahir: initialSnapshot.tanggalLahir,
      tanggalPelaksanaan: initialSnapshot.tanggalPelaksanaan,
      alamat: initialSnapshot.alamat,
      nomorWa: initialSnapshot.nomorWa,
      ucapan: initialSnapshot.ucapan,
      doa: initialSnapshot.doa,
      namaKeluarga: initialSnapshot.namaKeluarga,
    },
  });

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Prefill form dari data tersimpan (alur "Edit Data" di Tahap 5) setelah
  // localStorage selesai di-hydrate oleh zustand persist.
  useEffect(() => {
    if (!hasHydrated || !template) return;
    const saved = useInvitationStore.getState();

    reset({
      templateId: template.id,
      namaAnak: saved.namaAnak,
      jenisKelamin: saved.jenisKelamin || undefined,
      namaAyah: saved.namaAyah,
      namaIbu: saved.namaIbu,
      tanggalLahir: saved.tanggalLahir,
      tanggalPelaksanaan: saved.tanggalPelaksanaan,
      alamat: saved.alamat,
      nomorWa: saved.nomorWa,
      ucapan: saved.ucapan,
      doa: saved.doa,
      namaKeluarga: saved.namaKeluarga,
    });

    // Foto/logo lama hanya dipakai ulang kalau temanya sama — rasio crop
    // antar tema bisa berbeda sehingga foto lama belum tentu pas.
    if (saved.templateId === template.id) {
      setPhotoDataUrl(saved.fotoAnakDataUrl);
      setLogoDataUrl(saved.logoDataUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, template?.id]);

  if (!template) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Tema tidak ditemukan
        </h1>
        <p className="max-w-sm text-gray-600">
          Silakan pilih tema terlebih dahulu dari halaman utama.
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

  function onSubmit(values: InvitationFormValues) {
    if (!photoDataUrl) {
      setPhotoError("Foto anak wajib diunggah");
      return;
    }

    useInvitationStore.getState().setFields({
      ...values,
      templateId: template!.id,
      fotoAnakDataUrl: photoDataUrl,
      logoDataUrl,
    });

    router.push("/preview");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: template.dominantColor }}
          />
          <div>
            <p className="text-xs text-gray-400">Tema terpilih</p>
            <p className="font-semibold text-gray-900">{template.name}</p>
          </div>
        </div>
        <Link
          href="/#tema"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Ganti Tema
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Data Anak</h2>

          <FieldWrapper label="Nama Anak" error={errors.namaAnak?.message}>
            <input
              {...register("namaAnak")}
              className={inputClass}
              placeholder="Mis. Muhammad Fatih"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Jenis Kelamin"
            error={errors.jenisKelamin?.message}
          >
            <div className="flex gap-3">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                <input
                  type="radio"
                  value="Laki-laki"
                  {...register("jenisKelamin")}
                  className="accent-brand-600"
                />
                Laki-laki
              </label>
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                <input
                  type="radio"
                  value="Perempuan"
                  {...register("jenisKelamin")}
                  className="accent-brand-600"
                />
                Perempuan
              </label>
            </div>
          </FieldWrapper>

          <PhotoUploadField
            label="Foto Anak"
            aspect={getPhotoAspectRatio(template)}
            value={photoDataUrl}
            onChange={(dataUrl) => {
              setPhotoDataUrl(dataUrl);
              if (dataUrl) setPhotoError(null);
            }}
            error={photoError ?? undefined}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Data Orang Tua
          </h2>

          <FieldWrapper label="Nama Ayah" error={errors.namaAyah?.message}>
            <input {...register("namaAyah")} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper label="Nama Ibu" error={errors.namaIbu?.message}>
            <input {...register("namaIbu")} className={inputClass} />
          </FieldWrapper>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Jadwal Acara</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrapper
              label="Tanggal Lahir"
              error={errors.tanggalLahir?.message}
            >
              <input
                type="date"
                {...register("tanggalLahir")}
                className={inputClass}
              />
            </FieldWrapper>

            <FieldWrapper
              label="Tanggal Pelaksanaan"
              error={errors.tanggalPelaksanaan?.message}
            >
              <input
                type="date"
                {...register("tanggalPelaksanaan")}
                className={inputClass}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Alamat Acara" error={errors.alamat?.message}>
            <textarea
              {...register("alamat")}
              rows={3}
              className={inputClass}
              placeholder="Jl. Merdeka No. 1, Jakarta"
            />
          </FieldWrapper>

          <FieldWrapper label="Nomor WhatsApp" error={errors.nomorWa?.message}>
            <input
              {...register("nomorWa")}
              className={inputClass}
              placeholder="081234567890"
            />
          </FieldWrapper>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Ucapan & Doa
          </h2>

          <FieldWrapper label="Ucapan" error={errors.ucapan?.message}>
            <textarea
              {...register("ucapan")}
              rows={3}
              className={inputClass}
              placeholder="Dengan memohon rahmat & ridho Allah SWT, kami mengundang..."
            />
          </FieldWrapper>

          <FieldWrapper label="Doa" error={errors.doa?.message}>
            <textarea
              {...register("doa")}
              rows={3}
              className={inputClass}
              placeholder="Semoga tumbuh menjadi anak yang sholeh/sholehah..."
            />
          </FieldWrapper>

          <LogoUploadField value={logoDataUrl} onChange={setLogoDataUrl} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Kami yang Berbahagia
          </h2>

          <FieldWrapper
            label="Nama Keluarga / Pengundang (opsional)"
            error={errors.namaKeluarga?.message}
          >
            <input
              {...register("namaKeluarga")}
              className={inputClass}
              placeholder="Mis. Keluarga Besar Bapak Suto"
            />
          </FieldWrapper>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-50"
        >
          Lanjut ke Preview
        </button>
      </form>
    </main>
  );
}
