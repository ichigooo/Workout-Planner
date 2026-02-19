ALTER TABLE workouts ADD COLUMN "isUnilateral" boolean DEFAULT false;

UPDATE workouts SET "isUnilateral" = true WHERE id IN (
  'c84686c2-1d1e-4dca-9506-5ac82f154ad1', -- Bench Press - Dumbbell
  'e43f5333-4e5a-43ba-8d34-0ed72fa4a4a8', -- Bulgarian Split Squat - DB
  'da268eaa-75ec-4706-aa66-f3a6a26e3cc5', -- RDL Single Leg - DB
  '86f8b31c-3989-462c-a508-e4c5e4f2a7d0', -- Overhead Press - DB
  'e8b68612-c10a-420f-a262-a4eb540387a2', -- Lateral Raises
  '92baf419-8bea-49c4-b572-c05d2719f775', -- Single Leg Glute Bridge
  'dc10b789-3a07-4b68-bcb3-5df4161651b5'  -- One-hand KB Swing
);
