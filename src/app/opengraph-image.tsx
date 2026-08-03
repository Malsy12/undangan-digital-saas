import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Undangan Digital — Buat Undangan Aqiqah & Kelahiran Instan";

// Kartu OG dirender langsung lewat JSX (bukan file gambar statis) supaya
// tetap gampang diubah teksnya di kemudian hari tanpa perlu desain ulang asset.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fce7f3 0%, #ec4899 100%)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          Undangan Digital
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#ffffff",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Buat Undangan Aqiqah & Kelahiran dalam Hitungan Menit
        </div>
      </div>
    ),
    { ...size }
  );
}
