-- =========================================================================
-- MIGRATION: Add Phase 1/2 Workflow Fields to Tickets
-- =========================================================================

-- 1. Add WAITING_ANALYSIS status
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'WAITING_ANALYSIS';

-- 2. Create ticket_priority enum
DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('NORMAL', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add INSPECTION_BEFORE to photo_type
ALTER TYPE photo_type ADD VALUE IF NOT EXISTS 'INSPECTION_BEFORE';

-- 4. Add new columns to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority ticket_priority NOT NULL DEFAULT 'NORMAL';

-- 4b. Sanitization: ganti nilai 'BIASA' lama menjadi 'NORMAL'
--     (untuk database yang sudah menerapkan enum 'BIASA' sebelumnya)
UPDATE tickets SET priority = 'NORMAL' WHERE priority = 'BIASA';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS initial_inspection_notes TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS inspection_completed_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS inspection_approved_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS inspection_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. Add description column to ticket_attachments
ALTER TABLE ticket_attachments ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_scheduled_at ON tickets(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_inspection_status ON tickets(status, inspection_completed_at) WHERE status = 'WAITING_ANALYSIS';
