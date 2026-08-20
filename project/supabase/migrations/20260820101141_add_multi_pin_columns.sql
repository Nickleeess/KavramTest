/*
# Add multi-pin support to map_pins table

1. Modified Tables
- `map_pins`
  - Added `pins` (jsonb, not null, default '[]') — array of {x, y, label} objects for multiple locations per concept
  - Added `show_labels` (boolean, not null, default false) — whether pin labels are visible on the map

2. Important Notes
- The existing `x`, `y`, `province_id` columns remain for backward compatibility but are no longer used by the app.
- Each row in `map_pins` now represents a concept (e.g. "Bakır") with potentially multiple pin locations stored in the `pins` jsonb array.
- No data loss: table currently has 0 rows.
*/

ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS pins jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS show_labels boolean NOT NULL DEFAULT false;
