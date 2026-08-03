"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Variant dipakai bersama supaya tiap elemen fade-in berurutan (staggered)
// tanpa menulis ulang initial/animate di tiap elemen.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay },
  }),
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white px-6 pb-16 pt-24 text-center sm:pt-32">
      {/* Blob dekoratif, murni CSS, tidak butuh asset gambar */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center">
        <div className="h-72 w-72 rounded-full bg-brand-200 opacity-40 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <motion.h1
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-gray-900 sm:text-5xl"
      >
        Buat Undangan Aqiqah & Kelahiran{" "}
        <span className="text-brand-600">dalam Hitungan Menit</span>
      </motion.h1>

      <motion.p
        initial="hidden"
        animate="visible"
        custom={0.1}
        variants={fadeUp}
        className="mx-auto mt-4 max-w-lg text-base text-gray-600 sm:text-lg"
      >
        Tanpa Photoshop, tanpa Canva. Pilih tema, isi data, upload foto — hasil
        JPEG resolusi tinggi siap dibagikan ke WhatsApp & Instagram Story.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="visible"
        custom={0.2}
        variants={fadeUp}
        className="mt-8 flex justify-center"
      >
        <Link
          href="#tema"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 sm:text-base"
        >
          Buat Undangan Sekarang
        </Link>
      </motion.div>
    </section>
  );
}
