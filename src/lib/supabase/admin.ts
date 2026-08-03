import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// PENTING: pakai SERVICE ROLE KEY -> bypass semua Row Level Security.
// Import "server-only" memastikan file ini gagal di-build kalau tidak
// sengaja diimpor dari client component. Hanya boleh dipakai di:
// - API routes (mis. /api/generate saat menulis hasil render ke storage/DB)
// - Server Action admin yang butuh akses penuh
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
