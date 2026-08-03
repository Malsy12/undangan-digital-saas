import FormClient from "@/components/form/FormClient";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates/queries";

// Server component: resolve tema dari query "template" langsung dari
// Supabase di sini, supaya FormClient (client component) tidak perlu query
// browser-side terpisah. Interaktivitas form (RHF, cropper, localStorage)
// tetap di client karena butuh browser API.
export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: templateId } = await searchParams;

  const supabase = await createClient();
  const template = templateId
    ? await getTemplateById(supabase, templateId)
    : null;

  return <FormClient template={template} />;
}
