import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllTemplatesAdmin } from "@/lib/templates/queries";
import DeleteTemplateButton from "@/components/admin/DeleteTemplateButton";

export default async function AdminTemplateListPage() {
  const supabase = await createClient();
  const templates = await getAllTemplatesAdmin(supabase);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Daftar Tema</h1>
        <Link
          href="/admin/templates/new"
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Tambah Tema
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-400">
          Belum ada tema. Klik &quot;Tambah Tema&quot; untuk membuat yang pertama.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div
                className="flex aspect-[9/16] items-center justify-center"
                style={{ backgroundColor: template.dominantColor }}
              >
                {template.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {template.name}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      template.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {template.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {template.category}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteTemplateButton id={template.id} name={template.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
