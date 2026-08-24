-- Migration 002: Tickets and History Schema

-- 1. ENUMS (Status & Stage Tiket)
CREATE TYPE ticket_status AS ENUM ('NEW', 'ASSIGNED', 'ON_PROGRESS', 'WAITING_CONFIRMATION', 'COMPLETED', 'REWORK', 'ON_HOLD', 'CANCELLED');
CREATE TYPE ticket_stage AS ENUM ('INSPECTION', 'DIAGNOSIS', 'REPAIR', 'FINISHING');

-- 2. TABEL TICKETS
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    ticket_date DATE NOT NULL,
    daily_sequence INTEGER NOT NULL,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES complaint_categories(id) ON DELETE RESTRICT,
    problem TEXT NOT NULL,
    description TEXT,
    status ticket_status DEFAULT 'NEW',
    current_stage ticket_stage,
    created_by UUID NOT NULL REFERENCES users(id),
    current_assignee_id UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL TICKET HISTORY (Audit Trail)
CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. FUNGSI ATOMIK UNTUK BUAT TIKET (Concurrency Safe)
CREATE OR REPLACE FUNCTION create_ticket_transaction(
    p_unit_id UUID,
    p_category_id UUID,
    p_problem TEXT,
    p_description TEXT,
    p_created_by UUID
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_today DATE;
    v_seq INT;
    v_unit_code TEXT;
    v_ticket_num TEXT;
    v_ticket_id UUID;
BEGIN
    -- Ambil tanggal hari ini berdasarkan zona waktu Jakarta
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE;

    -- Ambil kode unit
    SELECT unit_code INTO v_unit_code FROM units WHERE id = p_unit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unit tidak ditemukan';
    END IF;

    -- Kunci tabel (Exclusive) sesaat agar tidak ada yang bentrok saat ambil sequence
    LOCK TABLE tickets IN EXCLUSIVE MODE; 
    
    -- Hitung sequence hari ini
    SELECT COALESCE(MAX(daily_sequence), 0) + 1 INTO v_seq 
    FROM tickets 
    WHERE ticket_date = v_today;

    -- Format nomor tiket: TKT_{UNIT_CODE}_{SEQUENCE} (contoh: TKT_SA.2-10_0001)
    v_ticket_num := 'TKT_' || v_unit_code || '_' || LPAD(v_seq::text, 4, '0');

    -- Insert ke tabel tiket
    INSERT INTO tickets (
        ticket_number, ticket_date, daily_sequence, unit_id, category_id, 
        problem, description, created_by, status
    ) VALUES (
        v_ticket_num, v_today, v_seq, p_unit_id, p_category_id, 
        p_problem, p_description, p_created_by, 'NEW'
    ) RETURNING id INTO v_ticket_id;

    -- Insert ke tabel history
    INSERT INTO ticket_history (ticket_id, user_id, action, description)
    VALUES (v_ticket_id, p_created_by, 'CREATE_TICKET', 'Tiket baru dibuat');

    -- Kembalikan respons JSON
    RETURN jsonb_build_object('id', v_ticket_id, 'ticket_number', v_ticket_num);
END;
$$;