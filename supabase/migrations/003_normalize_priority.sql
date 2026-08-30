-- =========================================================================
-- MIGRATION: Normalize ticket_priority 'BIASA' -> 'NORMAL'
-- Pastikan nilai enum prioritas hanya 'NORMAL' dan 'URGENT' yang valid.
-- Berlaku untuk database yang sudah memiliki enum ('BIASA','URGENT').
-- =========================================================================

-- 1. Tambahkan 'NORMAL' ke enum jika belum ada
DO $$ BEGIN
  ALTER TYPE ticket_priority ADD VALUE IF NOT EXISTS 'NORMAL';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Ganti nilai lama 'BIASA' menjadi 'NORMAL'
UPDATE tickets SET priority = 'NORMAL' WHERE priority = 'BIASA';

-- 3. Ubah default kolom menjadi 'NORMAL'
ALTER TABLE tickets ALTER COLUMN priority SET DEFAULT 'NORMAL';

-- 4. Hapus 'BIASA' dari enum (setelah tidak ada lagi data yang menggunakannya)
DO $$ BEGIN
  ALTER TYPE ticket_priority DROP VALUE IF EXISTS 'BIASA';
EXCEPTION
  WHEN invalid_parameter_value THEN null;
END $$;
