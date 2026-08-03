import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";

// Middleware (src/middleware.ts) sudah menjamin request sampai ke sini hanya
// kalau ada session admin — layout ini cuma menampilkan nav + email yang login.
export default async function AdminTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-brand-600">Admin Undangan Digital</span>
            <Link
              href="/admin/templates"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Daftar Tema
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
