/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Default Next.js cuma 1MB — admin panel bisa upload sampai 3 gambar
      // (thumbnail + background + overlay) sekaligus lewat satu Server Action.
      bodySizeLimit: "15mb",
    },
  },

  images: {
    // Domain Supabase Storage diizinkan supaya next/image bisa optimize
    // foto & background template yang di-hosting di Supabase.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Header keamanan dasar, berlaku di semua route. Tidak menambahkan
  // Content-Security-Policy penuh di sini karena butuh tuning hati-hati
  // (inline style Tailwind, canvas Konva, dll) — kandidat perbaikan lanjutan.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
