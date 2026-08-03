"use client";

import { motion } from "framer-motion";
import type { Template } from "@/lib/templates/types";
import TemplateCard from "./TemplateCard";

export default function TemplateGrid({ templates }: { templates: Template[] }) {
  return (
    <section id="tema" className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Pilih Tema Favorit
        </h2>
        <p className="mt-3 text-gray-600">
          Semua tema bisa langsung dipakai — tinggal isi data anak & upload
          foto.
        </p>
      </div>

      {templates.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">
          Belum ada tema yang tersedia saat ini.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
            >
              <TemplateCard template={template} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
