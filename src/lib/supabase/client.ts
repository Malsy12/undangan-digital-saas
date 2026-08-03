import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Dipakai di client component ("use client"), mis. form upload foto,
// cropper, preview Konva. Hanya pakai anon key -> akses dibatasi RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
