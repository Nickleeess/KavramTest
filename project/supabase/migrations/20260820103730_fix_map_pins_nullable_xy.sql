/*
# Fix map_pins: make legacy x/y columns nullable

The multi-pin refactor stores coordinates in the `pins` jsonb array.
The legacy `x` and `y` columns are NOT NULL with no default, causing
INSERT failures since addMapPin no longer sends x/y values.
Make them nullable so inserts succeed.
*/

ALTER TABLE map_pins ALTER COLUMN x DROP NOT NULL;
ALTER TABLE map_pins ALTER COLUMN y DROP NOT NULL;
ALTER TABLE map_pins ALTER COLUMN x SET DEFAULT 0;
ALTER TABLE map_pins ALTER COLUMN y SET DEFAULT 0;
