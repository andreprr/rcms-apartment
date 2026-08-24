-- =====================================================
-- RCMS SEED DATA - Test Data for Development
-- =====================================================

-- 1. CREATE TEST USERS (Using service role key for admin operations)
-- Note: These users need to be created in Supabase Auth first
-- The auth_user_id will be populated after creating auth users

-- Insert test users (without auth_user_id first)
INSERT INTO users (id, auth_user_id, full_name, username, email, role, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Admin Sistem', 'admin', 'admin@rcms.test', 'ADMIN', true),
  ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Rizky Residence', 'rr001', 'rr@rcms.test', 'RR', true),
  ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'Ahmad Engineering', 'engadmin001', 'engadmin@rcms.test', 'ENGINEERING_ADMIN', true),
  ('77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'Budi Teknisi', 'tech001', 'tech1@rcms.test', 'ENGINEERING', true),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'Charlie Teknisi', 'tech002', 'tech2@rcms.test', 'ENGINEERING', true),
  ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'Diana Manager', 'mgmt001', 'mgmt@rcms.test', 'MANAGEMENT', true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 2. CREATE BUILDINGS
INSERT INTO buildings (id, code, name, description, is_active)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'SA', 'Tower A Selatan', 'Tower A located on South side - Low to Mid floors', true),
  ('b2222222-2222-2222-2222-222222222222', 'SB', 'Tower B Selatan', 'Tower B located on South side - Low to Mid floors', true),
  ('b3333333-3333-3333-3333-333333333333', 'SC', 'Tower C Selatan', 'Tower C located on South side - High floors', true),
  ('b4444444-4444-4444-4444-444444444444', 'EA', 'Tower A Timur', 'Tower A located on East side - Low to Mid floors', true),
  ('b5555555-5555-5555-5555-555555555555', 'EB', 'Tower B Timur', 'Tower B located on East side - Low to Mid floors', true),
  ('b6666666-6666-6666-6666-666666666666', 'EC', 'Tower C Timur', 'Tower C located on East side - High floors', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. CREATE UNITS
-- Generate units for each building (10 units per building for demo)
-- Format: {BUILDING_CODE}.{FLOOR}-{UNIT_NUMBER}

-- Building SA units (floors 1-10, units 01-02 per floor)
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b1111111-1111-1111-1111-111111111111'::uuid,
  'SA.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 10) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- Building SB units
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b2222222-2222-2222-2222-222222222222'::uuid,
  'SB.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 10) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- Building SC units (floors 1-15)
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b3333333-3333-3333-3333-333333333333'::uuid,
  'SC.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 15) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- Building EA units
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b4444444-4444-4444-4444-444444444444'::uuid,
  'EA.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 10) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- Building EB units
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b5555555-5555-5555-5555-555555555555'::uuid,
  'EB.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 10) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- Building EC units (floors 1-15)
INSERT INTO units (id, building_id, unit_code, floor, unit_number, is_active)
SELECT
  gen_random_uuid(),
  'b6666666-6666-6666-6666-666666666666'::uuid,
  'EC.' || f.floor || '-' || LPAD(f.unit::text, 2, '0') AS unit_code,
  f.floor,
  LPAD(f.unit::text, 2, '0') AS unit_number,
  true
FROM
  (SELECT generate_series(1, 15) AS floor) AS floor
  CROSS JOIN
  (SELECT generate_series(1, 2) AS unit) AS unit
ON CONFLICT (unit_code) DO NOTHING;

-- 4. CREATE COMPLAINT CATEGORIES
INSERT INTO complaint_categories (id, name, code, description, is_active)
VALUES
  (gen_random_uuid(), 'Kebocoran', 'LEAK', 'Masalah kebocoran pada pipa, atap, atau dinding', true),
  (gen_random_uuid(), 'Plumbing', 'PLUMB', 'Permasalahan pada sistem perpipaan air dan drainase', true),
  (gen_random_uuid(), 'Kelistrikan', 'ELEC', 'Masalah kelistrikan, stop kontak, saklar, lampu', true),
  (gen_random_uuid(), 'AC / Pendingin', 'AC', 'Permasalahan AC, pendingin ruangan, atau ventilasi', true),
  (gen_random_uuid(), 'Sipil / Cat', 'CIVIL', 'Kerusakan struktur, cat dinding, lantai, atau plafon', true),
  (gen_random_uuid(), 'Furniture', 'FURN', 'Masalah pada furniture, pintu, jendela, atau handle', true),
  (gen_random_uuid(), 'Keamanan', 'SEC', 'Masalah keamanan, kunci, CCTV, atau interkom', true),
  (gen_random_uuid(), 'Lainnya', 'OTHER', 'Keluhan yang tidak termasuk dalam kategori di atas', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 5. CREATE SAMPLE TICKETS (for testing)
-- Get first unit and category IDs
DO $$
DECLARE
  v_unit_id UUID;
  v_cat_id UUID;
  v_user_id UUID := '33333333-3333-3333-3333-333333333333'::uuid; -- RR user
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get first unit
  SELECT id INTO v_unit_id FROM units WHERE unit_code = 'SA.1-01' LIMIT 1;

  -- Get first category
  SELECT id INTO v_cat_id FROM complaint_categories WHERE code = 'LEAK' LIMIT 1;

  -- Create sample tickets if they don't exist
  IF NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_number = 'TKT_SA.1-01_0001') THEN
    INSERT INTO tickets (
      ticket_number, ticket_date, daily_sequence, unit_id, category_id,
      problem, description, status, created_by
    ) VALUES (
      'TKT_SA.1-01_0001', v_today, 1, v_unit_id, v_cat_id,
      'Pipa wastafel kamar mandi utama bocor',
      'Air terus menetes dari sambungan pipa wastafel di kamar mandi utama. Sudah mencoba menyumbat dengan lakban tapi masih bocor.',
      'NEW',
      v_user_id
    );

    -- Add history
    INSERT INTO ticket_history (ticket_id, user_id, action, description)
    SELECT id, v_user_id, 'CREATE_TICKET', 'Tiket baru dibuat'
    FROM tickets WHERE ticket_number = 'TKT_SA.1-01_0001';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check data counts
SELECT 'Buildings' as table_name, COUNT(*) as count FROM buildings
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Categories', COUNT(*) FROM complaint_categories
UNION ALL
SELECT 'Users', COUNT(*) FROM users;

-- List all unit codes
-- SELECT unit_code, building_id FROM units ORDER BY unit_code LIMIT 20;
