import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-brand-600">
          Undangan Digital
        </Link>
        <Link
          href="#tema"
          className="rounded-full border border-brand-600 px-4 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
        >
          Pilih Tema
        </Link>
      </div>
    </header>
  );
}
