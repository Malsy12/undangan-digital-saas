-- ============================================================================
-- Migration: 0003_free_text_category
-- Deskripsi : Kategori tema sebelumnya dibatasi cuma "Aqiqah"/"Kelahiran" lewat
--             check constraint (lihat 0002). Sekarang admin butuh bebas isi
--             kategori apa saja untuk tema baru, jadi constraint itu dilonggarkan
--             jadi cuma "tidak boleh kosong".
-- ============================================================================

alter table public.templates
  drop constraint if exists templates_category_check;

alter table public.templates
  add constraint templates_category_check check (length(trim(category)) > 0);
