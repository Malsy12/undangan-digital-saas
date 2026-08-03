import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { rowToTemplate, templateInputToRow } from "./mappers";
import type { Template, TemplateFormInput } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, any, any>;

/** Landing page — hanya tema yang dipublish admin. */
export async function getActiveTemplates(client: Client): Promise<Template[]> {
  const { data, error } = await client
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(rowToTemplate);
}

/**
 * Form/preview/generate — cari berdasarkan id apa adanya (termasuk tema yang
 * sudah di-nonaktifkan admin), supaya customer yang sedang di tengah alur
 * tidak tiba-tiba mentok gara-gara tema baru saja disembunyikan dari landing.
 */
export async function getTemplateById(
  client: Client,
  id: string
): Promise<Template | null> {
  const { data, error } = await client
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTemplate(data) : null;
}

/** Admin — semua tema termasuk yang nonaktif. */
export async function getAllTemplatesAdmin(
  client: Client
): Promise<Template[]> {
  const { data, error } = await client
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(rowToTemplate);
}

export async function createTemplate(
  client: Client,
  input: TemplateFormInput
): Promise<Template> {
  const { data, error } = await client
    .from("templates")
    .insert(templateInputToRow(input))
    .select("*")
    .single();

  if (error) throw error;
  return rowToTemplate(data);
}

export async function updateTemplate(
  client: Client,
  id: string,
  input: TemplateFormInput
): Promise<Template> {
  const { data, error } = await client
    .from("templates")
    .update(templateInputToRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToTemplate(data);
}

export async function deleteTemplate(client: Client, id: string): Promise<void> {
  const { error } = await client.from("templates").delete().eq("id", id);
  if (error) throw error;
}
