import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates/queries";

// Dipakai PreviewClient & ResultClient (client component, tidak bisa query
// Supabase server-side langsung). Pakai client anon biasa — tunduk RLS yang
// sama seperti customer lain, jadi tema yang di-nonaktifkan admin otomatis
// tidak bisa diakses lagi lewat endpoint ini juga.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const template = await getTemplateById(supabase, id);
    if (!template) {
      return NextResponse.json({ error: "Tema tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (err) {
    console.error("Gagal memuat tema:", err);
    return NextResponse.json(
      { error: "Gagal memuat tema" },
      { status: 500 }
    );
  }
}
