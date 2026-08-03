import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Dipakai di Server Component, Server Action, atau Route Handler.
// Mengikuti session admin lewat cookie (dipakai untuk halaman /admin yang
// dilindungi Supabase Auth). Tetap tunduk pada RLS sesuai role pengguna.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component murni (tanpa Server
            // Action/Route Handler) -> tidak bisa set cookie, aman diabaikan
            // selama session di-refresh oleh middleware.
          }
        },
      },
    }
  );
}
