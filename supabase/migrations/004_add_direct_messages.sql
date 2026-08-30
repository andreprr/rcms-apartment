-- 1. Hapus policy lama terlebih dahulu jika sudah ada (mencegah error 42710)
DROP POLICY IF EXISTS "direct_messages_select_own" ON direct_messages;

-- 2. Buat ulang policy dengan aman
CREATE POLICY "direct_messages_select_own" 
ON direct_messages 
FOR SELECT 
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 3. Kolom foto terkategori (Before / Proses / After) pada tiket,
--    diisi saat teknisi submit "Klaim Finish" (lihat actions/tickets.ts & work-action route).
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS before_photo_paths TEXT[];
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS process_photo_paths TEXT[];
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS after_photo_paths TEXT[];

-- 4. Alur Rework / Komplain Client:
--    - Status baru REWORK_REQ (Pengajuan perbaikan ulang dari client).
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'REWORK_REQ';

-- 5. Kolom untuk rework & feedback client pada tiket.
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS finish_notes TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rework_reason TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rework_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_rework BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_feedback TEXT;