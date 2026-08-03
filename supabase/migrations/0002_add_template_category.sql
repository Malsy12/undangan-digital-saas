-- ============================================================================
-- Migration: 0002_add_template_category
-- Deskripsi : Tambah kolom "category" pada templates — tidak ada di migration
--             0001 tapi dibutuhkan landing page (badge tema) & label kategori
--             di gambar undangan hasil generate.
-- ============================================================================

alter table public.templates
  add column if not exists category text not null default 'Aqiqah';

alter table public.templates
  drop constraint if exists templates_category_check;

alter table public.templates
  add constraint templates_category_check check (category in ('Aqiqah', 'Kelahiran'));
