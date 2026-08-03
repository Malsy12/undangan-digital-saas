import Link from "next/link";
import type { Template } from "@/lib/templates/types";

export default function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div
        className="flex aspect-[9/16] items-center justify-center"
        style={{ backgroundColor: template.dominantColor }}
      >
        {template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700">
            {template.category}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: template.dominantColor }}
          />
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
        </div>

        <Link
          href={`/form?template=${template.id}`}
          className="mt-4 block w-full rounded-full bg-brand-600 py-2 text-center text-sm font-semibold text-white transition group-hover:bg-brand-700"
        >
          Pilih Tema
        </Link>
      </div>
    </div>
  );
}
