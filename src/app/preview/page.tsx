import PreviewClient from "@/components/preview/PreviewClient";

// Data diambil dari zustand store (localStorage), bukan dari URL, karena
// preview selalu mengikuti isian form terakhir milik customer di browser ini.
export default function PreviewPage() {
  return <PreviewClient />;
}
