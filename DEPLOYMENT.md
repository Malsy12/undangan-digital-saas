# Panduan Deploy ke Vercel

## Prasyarat

- Project sudah punya repo Git (GitHub/GitLab/Bitbucket)
- Project Supabase sudah aktif — migration (`supabase/migrations/*.sql`) dan
  `supabase/seed.sql` sudah dijalankan, Storage bucket untuk asset tema sudah dibuat
- Punya akun [vercel.com](https://vercel.com) (bisa daftar pakai akun GitHub)

## 1. Push ke GitHub

Kalau belum ada remote:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## 2. Import project di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Pilih repo ini → "Import"
3. Framework Preset otomatis terdeteksi **Next.js** — tidak perlu ubah build command/output directory

## 3. Isi Environment Variables

Di halaman konfigurasi sebelum deploy pertama (atau nanti lewat **Project Settings → Environment Variables**), isi persis seperti di `.env.local`:

| Key | Nilai | Catatan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **Rahasia** — jangan tempel di tempat lain |
| `NEXT_PUBLIC_SITE_URL` | `https://nama-project-anda.vercel.app` | Update lagi kalau nanti pakai custom domain |

Set untuk environment **Production**, **Preview**, dan **Development** sekalian (klik ketiga checkbox saat menambah variable) supaya preview deployment juga jalan dengan benar.

## 4. Deploy

Klik **Deploy**. Build pertama biasanya 1-3 menit. Setelah selesai, Vercel kasih URL `https://nama-project-anda.vercel.app`.

## 5. Setelah deploy — hal yang WAJIB dicek

### a) Update Supabase Auth Site URL
Supabase perlu tahu domain produksi Anda supaya redirect login admin bekerja benar:
1. Dashboard Supabase → **Authentication → URL Configuration**
2. **Site URL**: isi `https://nama-project-anda.vercel.app`
3. **Redirect URLs**: tambahkan `https://nama-project-anda.vercel.app/**`

### b) Update NEXT_PUBLIC_SITE_URL kalau pakai custom domain
Kalau nanti hubungkan domain sendiri (Project Settings → Domains di Vercel), jangan lupa update env var `NEXT_PUBLIC_SITE_URL` ke domain baru itu, lalu redeploy (supaya sitemap.xml, robots.txt, dan OG meta tags konsisten) — dan ulangi langkah 5a dengan domain baru.

### c) Checklist fungsional
- [ ] Landing page (`/`) menampilkan tema-tema aktif dari Supabase
- [ ] Login admin (`/admin/login`) berhasil, redirect ke `/admin/templates`
- [ ] Buat/edit tema di admin panel tersimpan & tampil di landing page
- [ ] Alur customer penuh: pilih tema → isi form → preview → generate → download JPEG
- [ ] `/sitemap.xml` dan `/robots.txt` bisa diakses
- [ ] `/opengraph-image` menghasilkan gambar (cek dengan share link di WhatsApp/Twitter, atau tool seperti [opengraph.xyz](https://www.opengraph.xyz))

## Catatan keterbatasan

- **Rate limiting** di `/api/generate` bersifat in-memory per instance server (lihat komentar di `src/lib/rate-limit.ts`). Ini cukup untuk trafik kecil-menengah, tapi TIDAK dibagi antar cold start/region Vercel. Kalau traffic sudah besar dan butuh rate limit yang benar-benar konsisten, ganti ke penyimpanan bersama seperti [Upstash Redis](https://upstash.com) (`@upstash/ratelimit`) — gratis untuk trafik kecil.
- **Durasi function**: proses generate (Sharp + fetch background/overlay) biasanya di bawah 5 detik, tapi paket Hobby Vercel membatasi function timeout 10 detik. Kalau nanti background/overlay template berukuran sangat besar dan sering timeout, pertimbangkan upgrade paket Vercel atau kompres asset templat terlebih dahulu.
- Jangan pernah commit file `.env.local` ke git (sudah ada di `.gitignore` sejak Tahap 1).
