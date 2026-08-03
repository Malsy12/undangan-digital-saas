export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
      <p>
        &copy; {new Date().getFullYear()} Undangan Digital. Semua hak cipta
        dilindungi.
      </p>
      <p className="mt-1">
        Butuh bantuan? Hubungi kami lewat{" "}
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-600 hover:underline"
        >
          WhatsApp
        </a>
      </p>
    </footer>
  );
}
