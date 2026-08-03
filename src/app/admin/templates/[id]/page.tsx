import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates/queries";
import TemplateForm from "@/components/admin/TemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const template = await getTemplateById(supabase, id);

  if (!template) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Edit Tema — {template.name}
      </h1>
      <TemplateForm initialTemplate={template} />
    </div>
  );
}
