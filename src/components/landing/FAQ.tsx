"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  {
    question: "Hasil akhirnya berupa apa?",
    answer:
      "Satu file JPEG resolusi tinggi (1080x1920px, 300 DPI) yang siap dibagikan langsung ke WhatsApp maupun Instagram Story.",
  },
  {
    question: "Apakah saya bisa edit data setelah generate?",
    answer:
      'Bisa. Di halaman download tersedia tombol "Edit Data" untuk kembali ke form tanpa kehilangan isian sebelumnya, lalu generate ulang.',
  },
  {
    question: "Berapa lama proses pembuatannya?",
    answer:
      "Hanya beberapa detik — begitu tombol Generate ditekan, server langsung merender gambar secara otomatis.",
  },
  {
    question: "Apakah foto anak wajib diunggah?",
    answer:
      "Ya, foto anak wajib diunggah agar sesuai dengan bentuk & posisi frame pada template yang dipilih.",
  },
  {
    question: "Apakah ada biaya untuk membuat undangan?",
    answer:
      "Detail harga akan ditampilkan sebelum proses download. Saat ini aplikasi masih dalam tahap pengembangan.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
        Pertanyaan yang Sering Diajukan
      </h2>

      <div className="mt-10 divide-y divide-gray-200 rounded-2xl border border-gray-100">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="px-5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium text-gray-900"
              >
                {faq.question}
                <span
                  aria-hidden
                  className={`shrink-0 text-lg text-brand-600 transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-sm text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
