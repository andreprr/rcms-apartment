-- =========================================================================
-- REWORK SCHEMA SUPABASE - RESIDENT COMPLAINT SYSTEM (V3.2 - FIXED & VERIFIED)
-- =========================================================================

-- 1. DROPPING OLD SCHEMAS & TABLES (REWORK TOTAL)
DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.tickets;
DROP TRIGGER IF EXISTS trg_log_ticket_creation ON public.tickets;
DROP FUNCTION IF EXISTS generate_ticket_number();
DROP FUNCTION IF EXISTS log_ticket_creation();

DROP TABLE IF EXISTS public.ticket_confirmations CASCADE;
DROP TABLE IF EXISTS public.ticket_attachments CASCADE;
DROP TABLE IF EXISTS public.ticket_daily_logs CASCADE;
DROP TABLE IF EXISTS public.ticket_assignments CASCADE;
DROP TABLE IF EXISTS public.ticket_history CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_counters CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.buildings CASCADE;
DROP TABLE IF EXISTS public.complaint_categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_stage CASCADE;
DROP TYPE IF EXISTS photo_type CASCADE;

-- 2. SETUP EXTENSION & ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'RR',
  'ENGINEERING_ADMIN',
  'ENGINEERING',
  'PENGURUS'
);

CREATE TYPE ticket_status AS ENUM (
  'NEW',
  'ASSIGNED',
  'ON_PROGRESS',
  'WAITING_CONFIRMATION',
  'COMPLETED',
  'REWORK',
  'ON_HOLD',
  'CANCELLED'
);

CREATE TYPE ticket_stage AS ENUM (
  'INSPECTION',
  'DIAGNOSIS',
  'REPAIR',
  'FINISHING'
);

CREATE TYPE photo_type AS ENUM (
  'BEFORE',
  'PROGRESS',
  'AFTER',
  'OTHER'
);

-- 3. TABEL USERS (Profil Karyawan Internal - Nama, Divisi, Foto Profile)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,         -- Nama Lengkap
  division TEXT NOT NULL,          -- Divisi
  avatar_url TEXT,                 -- Foto Profile
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'RR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL DAILY TICKETS COUNTER (Reset Harian Concurrency-Safe)
CREATE TABLE public.ticket_counters (
  ticket_date DATE PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

-- 5. TABEL TICKETS (Input Manual Unit, Nama & No. Telp Warga by RR)
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  ticket_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_sequence INTEGER NOT NULL,
  
  -- Manual Input RR
  unit_code TEXT NOT NULL,         -- Contoh: 'SA.2-12'
  resident_name TEXT NOT NULL,     -- Contoh: 'Ridwan'
  phone_number TEXT NOT NULL,      -- Tersimpan di DB (Untuk WA Notif, Tidak Muncul di Cetakan Tiket)
  problem TEXT NOT NULL,           -- Keluhan Singkat
  description TEXT,                -- Detail Keluhan

  status ticket_status NOT NULL DEFAULT 'NEW',
  current_stage ticket_stage,
  
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  current_assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Role ENGINEERING
  
  started_at TIMESTAMPTZ,          -- Waktu Teknisi Klik Mulai Bekerja
  submitted_at TIMESTAMPTZ,        -- Waktu Teknisi Klik Submit Finish
  completed_at TIMESTAMPTZ,        -- Waktu Warga / Auto-Finish 3 Hari Konfirmasi
  
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL MULTI-DAY PROGRESS LOG (Catatan Lapangan Harian Teknisi)
CREATE TABLE public.ticket_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  engineering_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  day_number INTEGER NOT NULL DEFAULT 1,
  work_description TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('EXTEND', 'SUBMIT_FINISH')),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL ATTACHMENTS (Foto Before/Progress/After)
CREATE TABLE public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  daily_log_id UUID REFERENCES public.ticket_daily_logs(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  photo_type photo_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABEL TICKET ASSIGNMENTS (Histori Penugasan & Re-assign Teknisi)
CREATE TABLE public.ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  engineering_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,
  reason TEXT
);

-- 9. TABEL CONFIRMATIONS & RATING (Penilaian Warga + Moderasi Admin)
CREATE TABLE public.ticket_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true, -- Moderasi Admin (Hapus/Sembunyikan Sarkas)
  confirmed_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL TICKET HISTORY (Audit Trail System Fully Detailed)
CREATE TABLE public.ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 11. FUNCTION & TRIGGER: AUTO GENERATE TICKET NUMBER (TKT_UNIT_NAMA_0001)
-- =========================================================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  current_seq INT;
  formatted_seq TEXT;
  clean_name TEXT;
  clean_unit TEXT;
BEGIN
  PERFORM set_config('timezone', 'Asia/Jakarta', true);
  
  -- Atomic Increment Counter Harian (Concurrency Safe)
  INSERT INTO public.ticket_counters (ticket_date, last_sequence)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (ticket_date)
  DO UPDATE SET last_sequence = public.ticket_counters.last_sequence + 1
  RETURNING last_sequence INTO current_seq;

  formatted_seq := LPAD(current_seq::TEXT, 4, '0');
  
  -- Format Uppercase & Hapus Spasi Berlebih
  clean_unit := UPPER(REGEXP_REPLACE(NEW.unit_code, '\s+', '', 'g'));
  clean_name := UPPER(REGEXP_REPLACE(NEW.resident_name, '\s+', '', 'g'));

  NEW.daily_sequence := current_seq;
  NEW.ticket_date := CURRENT_DATE;
  NEW.ticket_number := 'TKT_' || clean_unit || '_' || clean_name || '_' || formatted_seq;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- =========================================================================
-- 12. FUNCTION & TRIGGER: LOG AUDIT SINKRONISASI PEMBUATAN TIKET (FIXED TO AFTER INSERT)
-- =========================================================================
CREATE OR REPLACE FUNCTION log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ticket_history (ticket_id, user_id, action, new_value, description)
  VALUES (
    NEW.id,
    NEW.created_by,
    'CREATE_TICKET',
    jsonb_build_object(
      'ticket_number', NEW.ticket_number,
      'unit_code', NEW.unit_code,
      'resident_name', NEW.resident_name,
      'problem', NEW.problem
    ),
    'Tiket ' || NEW.ticket_number || ' berhasil dibuat oleh RR.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- WAJIB AFTER INSERT AGAR NEW.ticket_number TIDAK NULL
CREATE TRIGGER trg_log_ticket_creation
AFTER INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_creation();

-- =========================================================================
-- 13. INDEXES PERFORMA QUERY
-- =========================================================================
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_date ON public.tickets(ticket_date);
CREATE INDEX idx_tickets_assignee ON public.tickets(current_assignee_id);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_history_ticket_id ON public.ticket_history(ticket_id);

-- =========================================================================
-- 14. RLS POLICIES (PERMISSIONS DIBUKA AGAR SUPABASE CLIENT TIDAK STUCK/LOADING)
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

-- Allow Authenticated Users Full Read Access
CREATE POLICY "Allow authenticated read users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read tickets" ON public.tickets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read logs" ON public.ticket_daily_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read attachments" ON public.ticket_attachments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read assignments" ON public.ticket_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read confirmations" ON public.ticket_confirmations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read history" ON public.ticket_history FOR ALL TO authenticated USING (true);