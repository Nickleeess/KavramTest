/*
# Create map_pins table for interactive Turkey map module

1. New Tables
- `map_pins`
  - `id` (uuid, primary key)
  - `title` (text, not null) — the concept/name for this pin (e.g. "Krom Madeni", "Van Gölü")
  - `facts` (jsonb, not null, default '[]') — flexible array of detail strings about this pin
  - `x` (double precision, not null) — x coordinate on the SVG map (percentage 0-100)
  - `y` (double precision, not null) — y coordinate on the SVG map (percentage 0-100)
  - `province_id` (text, nullable) — optional province identifier if pin is on a province
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `map_pins`.
- Allow anon + authenticated CRUD (single-tenant, no-auth app, data is intentionally shared).
*/ 

CREATE TABLE IF NOT EXISTS map_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  x double precision NOT NULL,
  y double precision NOT NULL,
  province_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_map_pins" ON map_pins;
CREATE POLICY "anon_select_map_pins" ON map_pins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_map_pins" ON map_pins;
CREATE POLICY "anon_insert_map_pins" ON map_pins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_map_pins" ON map_pins;
CREATE POLICY "anon_update_map_pins" ON map_pins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_map_pins" ON map_pins;
CREATE POLICY "anon_delete_map_pins" ON map_pins FOR DELETE
  TO anon, authenticated USING (true);
