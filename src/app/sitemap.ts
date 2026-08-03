import type { MetadataRoute } from "next";

// NEXT_PUBLIC_SITE_URL diisi ke domain produksi asli setelah deploy (lihat
// DEPLOYMENT.md) — selama belum diisi, fallback ke localhost untuk dev.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
