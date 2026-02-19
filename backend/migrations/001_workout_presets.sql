-- Workout Presets Migration
-- Run steps 1-4 first, verify with step 6, then drop columns in step 5.

-- Step 0: Delete all cardio workouts
DELETE FROM workouts WHERE "workoutType" = 'cardio';

-- Step 1: Add movementType column to workouts
ALTER TABLE workouts ADD COLUMN "movementType" text;

-- Step 2: Create workout_presets table
CREATE TABLE workout_presets (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workoutId" text NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  preset text NOT NULL,
  sets integer,
  reps integer,
  "intensityPct" integer,
  "intensityLabel" text,
  "restSeconds" integer,
  "durationPerSet" integer,
  "isDefault" boolean DEFAULT false,
  "inputType" text DEFAULT 'sets_reps',
  UNIQUE("workoutId", preset)
);

-- Step 3: Migrate existing data into workout_presets
INSERT INTO workout_presets ("workoutId", preset, sets, reps, "intensityPct", "intensityLabel", "durationPerSet", "isDefault", "inputType")
SELECT
  id,
  COALESCE("defaultPreset", 'default'),
  sets,
  reps,
  CASE WHEN "intensityModel" = 'percentage_1rm' THEN 80 ELSE NULL END,
  CASE WHEN "intensityModel" != 'percentage_1rm' THEN intensity ELSE NULL END,
  "durationPerSet",
  true,
  CASE "intensityModel"
    WHEN 'percentage_1rm' THEN 'percentage_1rm'
    WHEN 'sets_time' THEN 'sets_time'
    ELSE 'sets_reps'
  END
FROM workouts;

-- Step 4: Backfill movementType on workouts

-- Compounds (barbell/heavy lifts)
UPDATE workouts SET "movementType" = 'compound' WHERE id IN (
  '902177fa-6f67-44b1-8f91-934b2861abd8', -- Back Squat
  '60936189-0d60-4388-a1c0-830010057674', -- Romanian Deadlift
  'baa54dba-8c0a-4e30-a1b1-83c49146f08d', -- Bulgarian Split Squat BB
  '51cc545b-c511-489f-ba57-8855d140f314', -- Bench Press BB
  'c84686c2-1d1e-4dca-9506-5ac82f154ad1', -- Bench Press DB
  '86f8b31c-3989-462c-a508-e4c5e4f2a7d0', -- OHP DB
  'e43f5333-4e5a-43ba-8d34-0ed72fa4a4a8', -- Bulgarian Split Squat DB
  'da268eaa-75ec-4706-aa66-f3a6a26e3cc5', -- RDL Single Leg DB
  '4261b5cb-913d-4b41-8a4c-425e26617eac'  -- Glute bridges
);

-- Accessories
UPDATE workouts SET "movementType" = 'accessory' WHERE id IN (
  '9a017557-8f83-4921-8fa7-83a9321d528e', -- Ring Row
  'c4932f83-e9e7-4ae7-a629-dc1d4bf442d1', -- Pronated Row
  '6b565d90-304e-4f23-b57b-548e660a9c68', -- Face Pull
  '9587b3dc-e9b8-4f42-b48c-b0dd0e35355d', -- Reverse Ring Fly
  'c0f1d6e4-eef2-47d7-be99-5f55b4db53ef', -- TRX front raise
  '53464ad4-b5c8-4e9a-967b-67ed65159359', -- Chest fly
  '92baf419-8bea-49c4-b572-c05d2719f775', -- Single Leg Glute Bridge
  'dc10b789-3a07-4b68-bcb3-5df4161651b5'  -- KB Swing
);

-- Isolation
UPDATE workouts SET "movementType" = 'isolation' WHERE id IN (
  'e8b68612-c10a-420f-a262-a4eb540387a2', -- Lateral Raises
  'e0dca867-3c93-4411-972e-ec65507b0244', -- Tricep Pushdown
  'c8425240-2db4-4375-87b0-27c74897427c'  -- Push-ups
);

-- Core
UPDATE workouts SET "movementType" = 'isolation' WHERE id IN (
  'ccfdc967-d1c5-411e-ab4e-839bb6ed7350', -- Toe to Bar
  '6e235802-743f-4a07-8f63-59da45c956a1', -- Hanging Leg Raises
  '43979fd8-b479-4463-a70a-7656498aa21f'  -- Side Plank
);

-- Plyometric
UPDATE workouts SET "movementType" = 'plyometric' WHERE id IN (
  '048118b1-9f89-4190-8a7a-046e9cbd3e3a', -- Box Jump
  '49059b85-0e9d-4818-a9c8-d18fe7bfd0d6'  -- Explosive Pull-ups
);

-- Technique/Warmup (by category)
UPDATE workouts SET "movementType" = 'technique' WHERE category = 'Climbing - Warm Up';

-- Climbing power
UPDATE workouts SET "movementType" = 'compound' WHERE category = 'Climbing - Power';

-- Mobility
UPDATE workouts SET "movementType" = 'warmup' WHERE category = 'Mobility';

-- Step 5: Drop old columns from workouts (ONLY after verifying step 6)
-- ⚠️ Uncomment after verification
-- ALTER TABLE workouts
--   DROP COLUMN sets,
--   DROP COLUMN reps,
--   DROP COLUMN duration,
--   DROP COLUMN intensity,
--   DROP COLUMN "defaultPreset",
--   DROP COLUMN "durationPerSet",
--   DROP COLUMN "intensityModel";

-- Step 6: Verify
-- All workouts should have a movementType
SELECT id, title FROM workouts WHERE "movementType" IS NULL;

-- All workouts should have at least one preset
SELECT w.id, w.title
FROM workouts w
LEFT JOIN workout_presets wp ON w.id = wp."workoutId"
WHERE wp.id IS NULL;
