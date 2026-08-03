-- ============================================================================
-- Migration: 0001_init_schema
-- Deskripsi : Schema awal untuk Undangan Digital (templates, generated_images,
--             orders) beserta Row Level Security (RLS) dasar.
-- Cara pakai: supabase db push   (atau jalankan lewat SQL Editor di dashboard)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: trigger generik untuk auto-update kolom updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Table: templates
-- Menyimpan konfigurasi visual tiap tema undangan: background, overlay,
-- layer tambahan, posisi teks & foto, serta styling font. Semua posisi/ukuran
-- disimpan sebagai jsonb supaya fleksibel diedit lewat admin panel (Tahap 6)
-- tanpa perlu migration baru tiap ada tema baru.
-- ----------------------------------------------------------------------------
create table if not exists public.templates (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  thumbnail_url      text,
  background_url     text,
  overlay_url        text,
  -- layers: array layer PNG tambahan & urutan render, mis:
  --   [{ "name": "bunga", "url": "...", "z_index": 2 }]
  layers             jsonb not null default '[]'::jsonb,
  -- text_positions: posisi & style tiap field teks di atas canvas, mis:
  --   { "nama_anak": { "x": 100, "y": 200, "font_size": 40, "align": "center" } }
  text_positions     jsonb not null default '{}'::jsonb,
  -- photo_placeholder: posisi, ukuran, & bentuk frame foto anak, mis:
  --   { "x": 340, "y": 480, "width": 400, "height": 400, "shape": "circle" }
  photo_placeholder  jsonb not null default '{}'::jsonb,
  font_name          text not null default 'Poppins',
  font_size          integer not null default 32,
  font_color         text not null default '#000000',
  dominant_color     text not null default '#000000',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists templates_is_active_idx on public.templates (is_active);

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Table: generated_images
-- Satu baris = satu hasil generate undangan oleh customer. form_data
-- menyimpan seluruh isian form (nama anak, ortu, tanggal, dst) apa adanya
-- supaya customer bisa "Edit Data" tanpa kehilangan input sebelumnya.
-- ----------------------------------------------------------------------------
create table if not exists public.generated_images (
  id                 uuid primary key default gen_random_uuid(),
  template_id        uuid not null references public.templates (id) on delete restrict,
  form_data          jsonb not null default '{}'::jsonb,
  photo_url          text,
  result_image_url   text,
  status             text not null default 'pending'
                       check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at         timestamptz not null default now()
);

create index if not exists generated_images_template_id_idx on public.generated_images (template_id);
create index if not exists generated_images_status_idx on public.generated_images (status);

-- ----------------------------------------------------------------------------
-- Table: orders
-- Skeleton dulu (belum ada payment gateway). Berguna untuk melacak follow-up
-- customer via WhatsApp terhadap satu hasil generate.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  generated_image_id    uuid not null references public.generated_images (id) on delete cascade,
  customer_wa           text not null,
  status                text not null default 'pending'
                          check (status in ('pending', 'confirmed', 'cancelled')),
  created_at            timestamptz not null default now()
);

create index if not exists orders_generated_image_id_idx on public.orders (generated_image_id);

-- ============================================================================
-- Row Level Security
-- Catatan: tabel "users" tidak dibuat terpisah — admin panel memakai
-- auth.users bawaan Supabase Auth. Siapa pun yang berhasil login (authenticated)
-- dianggap admin, karena aplikasi ini single-tenant/single-admin untuk saat ini.
-- ============================================================================

alter table public.templates enable row level security;
alter table public.generated_images enable row level security;
alter table public.orders enable row level security;

-- templates: publik hanya boleh baca tema yang aktif (landing page & form).
create policy "public can read active templates"
  on public.templates for select
  to anon, authenticated
  using (is_active = true);

-- templates: hanya admin (authenticated) yang boleh create/update/delete,
-- termasuk melihat tema non-aktif di admin panel.
create policy "admin full access to templates"
  on public.templates for all
  to authenticated
  using (true)
  with check (true);

-- generated_images: customer (anon) boleh membuat hasil generate sendiri,
-- dan membaca kembali hasilnya (link /result bersifat "tahu id = boleh akses").
create policy "anon can create generated_images"
  on public.generated_images for insert
  to anon
  with check (true);

create policy "anon can read generated_images"
  on public.generated_images for select
  to anon
  using (true);

-- generated_images: admin punya akses penuh (mis. update status, moderasi).
create policy "admin full access to generated_images"
  on public.generated_images for all
  to authenticated
  using (true)
  with check (true);

-- orders: customer boleh membuat order dari hasil generate miliknya.
create policy "anon can create orders"
  on public.orders for insert
  to anon
  with check (true);

-- orders: hanya admin yang boleh melihat & mengubah status order.
create policy "admin full access to orders"
  on public.orders for all
  to authenticated
  using (true)
  with check (true);
