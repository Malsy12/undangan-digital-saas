import "server-only";

// Rate limiter in-memory sederhana per proses server — cukup untuk mencegah
// abuse kasar (klik berulang/script sederhana) pada trafik kecil-menengah.
//
// KETERBATASAN yang perlu diketahui: state ini TIDAK dibagi antar beberapa
// serverless instance (tiap cold start di Vercel mulai dari nol, dan region
// berbeda punya memori terpisah). Untuk skala produksi yang lebih besar,
// ganti dengan penyimpanan bersama seperti Upstash Redis (@upstash/ratelimit)
// — lihat DEPLOYMENT.md.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;

// Buang bucket yang sudah lama tidak aktif supaya Map ini tidak membesar
// tanpa batas kalau banyak IP unik yang cuma mampir sekali.
function pruneIfNeeded(windowMs: number) {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

/** Sliding window: maksimal "limit" request per "windowMs" milidetik untuk satu key. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  pruneIfNeeded(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  const limited = bucket.timestamps.length >= limit;
  if (!limited) {
    bucket.timestamps.push(now);
  }
  buckets.set(key, bucket);

  const resetAt =
    bucket.timestamps.length > 0 ? bucket.timestamps[0] + windowMs : now + windowMs;

  return {
    limited,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    resetAt,
  };
}

/** Ambil IP client dari header proxy (Vercel selalu set x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
