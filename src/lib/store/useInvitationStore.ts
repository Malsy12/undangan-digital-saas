"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InvitationFormState {
  templateId: string | null;
  namaAnak: string;
  jenisKelamin: "Laki-laki" | "Perempuan" | "";
  namaAyah: string;
  namaIbu: string;
  tanggalLahir: string;
  tanggalPelaksanaan: string;
  alamat: string;
  nomorWa: string;
  ucapan: string;
  doa: string;
  /** Opsional — nama keluarga besar/pengundang, baris penutup di undangan. */
  namaKeluarga: string;
  /** Data URL (base64) hasil crop foto anak — sudah dipotong sesuai frame template. */
  fotoAnakDataUrl: string | null;
  /** Data URL (base64) logo opsional, tanpa proses crop. */
  logoDataUrl: string | null;
}

const initialState: InvitationFormState = {
  templateId: null,
  namaAnak: "",
  jenisKelamin: "",
  namaAyah: "",
  namaIbu: "",
  tanggalLahir: "",
  tanggalPelaksanaan: "",
  alamat: "",
  nomorWa: "",
  ucapan: "",
  doa: "",
  namaKeluarga: "",
  fotoAnakDataUrl: null,
  logoDataUrl: null,
};

interface InvitationStore extends InvitationFormState {
  hasHydrated: boolean;
  setFields: (fields: Partial<InvitationFormState>) => void;
  reset: () => void;
}

// Disimpan di localStorage supaya customer bisa "Edit Data" (kembali ke form
// dari halaman preview/download tanpa kehilangan isian sebelumnya, lihat Tahap 4-5).
export const useInvitationStore = create<InvitationStore>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setFields: (fields) => set((state) => ({ ...state, ...fields })),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "undangan-digital-form",
      // "hasHydrated" murni status runtime (bukan data form) — sengaja tidak
      // ikut disimpan supaya nilai lama tidak pernah menimpa status hydration yang baru.
      partialize: (state) => ({
        templateId: state.templateId,
        namaAnak: state.namaAnak,
        jenisKelamin: state.jenisKelamin,
        namaAyah: state.namaAyah,
        namaIbu: state.namaIbu,
        tanggalLahir: state.tanggalLahir,
        tanggalPelaksanaan: state.tanggalPelaksanaan,
        alamat: state.alamat,
        nomorWa: state.nomorWa,
        ucapan: state.ucapan,
        doa: state.doa,
        namaKeluarga: state.namaKeluarga,
        fotoAnakDataUrl: state.fotoAnakDataUrl,
        logoDataUrl: state.logoDataUrl,
      }),
    }
  )
);

// Dipasang lewat API resmi persist (bukan opsi "onRehydrateStorage") karena
// callback di opsi tsb dipanggil sebelum konstanta "useInvitationStore" di
// atas selesai di-assign. API ini juga otomatis menangani kasus hydration
// yang sudah selesai duluan sebelum listener sempat didaftarkan.
if (typeof window !== "undefined") {
  if (useInvitationStore.persist.hasHydrated()) {
    useInvitationStore.setState({ hasHydrated: true });
  }
  useInvitationStore.persist.onFinishHydration(() => {
    useInvitationStore.setState({ hasHydrated: true });
  });
}
