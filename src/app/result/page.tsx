import ResultClient from "@/components/result/ResultClient";

// Sama seperti /preview, data diambil dari zustand store (localStorage) —
// begitu halaman ini dibuka, generate ke /api/generate langsung dipicu otomatis.
export default function ResultPage() {
  return <ResultClient />;
}
