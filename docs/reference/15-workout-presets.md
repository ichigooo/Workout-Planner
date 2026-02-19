# Workout Presets

> How workouts define their sets, reps, and intensity through the preset system.

---

## Overview

Each workout has one or more **presets** stored in the `workout_presets` table. A preset defines a specific training configuration (sets, reps, intensity) for that exercise. This replaces the old flat fields (`sets`, `reps`, `intensity`, etc.) that were previously on the `workouts` table directly.

**Examples:**
- Back Squat has 3 presets: default (3x8 @ 75%), 5rm (5x5 @ 85%), strength (5x1 @ 95%)
- Plank has 1 preset: default (3 sets x 30s each, sets_time input)
- Lateral Raises has 1 preset: default (3x8 @ 75%, percentage_1rm)

---

## Database Schema

### `workout_presets` table

```prisma
// File: backend/prisma/schema.prisma
model WorkoutPreset {
  id             String  @id @default(dbgenerated("gen_random_uuid()::text"))
  workoutId      String
  preset         String        // Name: "default", "strength", "5rm", etc.
  sets           Int?
  reps           Int?
  intensityPct   Int?          // Percentage of 1RM (e.g., 75, 85, 95)
  intensityLabel String?       // Display label (e.g., "Moderate", "Heavy")
  restSeconds    Int?
  durationPerSet Int?          // For timed exercises (seconds per set)
  isDefault      Boolean @default(false)
  inputType      String  @default("sets_reps")
  workout        Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

  @@unique([workoutId, preset])  // One preset per name per workout
  @@map("workout_presets")
}
```

### `movementType` column on workouts

```
movementType String?  // "compound", "accessory", "isolation", "plyometric", "technique", "warmup"
```

Used for exercise sequencing in workout sessions (compounds first, isolation last).

---

## Input Types

Each preset has an `inputType` that determines how the exercise is configured and displayed:

| inputType | Fields Used | Display | Example |
|-----------|-------------|---------|---------|
| `sets_reps` | `sets`, `reps` | "3 sets x 10 reps" | Bodyweight exercises |
| `sets_time` | `sets`, `durationPerSet` | "3 sets x 30s" | Planks, wall sits |
| `percentage_1rm` | `sets`, `reps`, `intensityPct` | "3 sets x 8 reps @ 75%" | Barbell/dumbbell lifts |

---

## Frontend Types & Helpers

**File:** `mobile/src/types/index.ts`

```typescript
type MovementType = "compound" | "accessory" | "isolation" | "plyometric" | "technique" | "warmup";
type InputType = "sets_reps" | "sets_time" | "percentage_1rm";

interface WorkoutPreset {
    id: string;
    preset: string;          // "default", "strength", "5rm"
    sets?: number;
    reps?: number;
    intensityPct?: number;
    intensityLabel?: string;
    restSeconds?: number;
    durationPerSet?: number;
    isDefault: boolean;
    inputType: InputType;
}
```

### Key helpers

```typescript
// Get the default preset (isDefault=true, or first preset as fallback)
getDefaultPreset(workout: Workout): WorkoutPreset | undefined

// Get a preset by name
getPresetByName(workout: Workout, name: string): WorkoutPreset | undefined
```

### Sequence priority

```typescript
const SEQUENCE_PRIORITY: Record<MovementType, number> = {
    warmup: 0,
    technique: 5,
    compound: 10,
    plyometric: 20,
    accessory: 30,
    isolation: 50,
};
```

---

## API

### GET `/api/workouts`

Returns workouts with presets eagerly loaded:

```javascript
// backend/server.js
const { data } = await supabase
    .from("workouts")
    .select("*, workout_presets(*)")
    .eq("isGlobal", true);
```

Response includes `presets: WorkoutPreset[]` on each workout.

### POST `/api/workouts`

Accepts optional `presets` array. Inserts presets after workout creation:

```json
{
    "title": "Back Squat",
    "category": "Legs",
    "movementType": "compound",
    "presets": [
        { "preset": "default", "sets": 3, "reps": 8, "intensityPct": 75, "isDefault": true, "inputType": "percentage_1rm" }
    ]
}
```

### PUT `/api/workouts/:id`

Accepts optional `presets` array. Deletes existing presets and re-inserts on update.

---

## Component Usage

### Reading presets

All components use `getDefaultPreset(workout)` instead of reading `workout.sets` / `workout.reps` directly:

```typescript
const preset = getDefaultPreset(workout);
if (preset?.sets && preset?.reps) {
    // "3 sets x 8 reps"
}
if (preset?.sets && preset?.durationPerSet) {
    // "3 sets x 30s"
}
```

### PresetSelector

**File:** `mobile/src/components/PresetSelector.tsx`

Slider component for workouts with multiple presets. Accepts `presets: WorkoutPreset[]` prop and renders a track with stops for each preset.

Only rendered when `workout.presets.length > 1`.

### WorkoutForm

**File:** `mobile/src/components/WorkoutForm.tsx`

Builds a `presets[]` array on submit based on the selected `inputType`:
- `percentage_1rm`: Creates 3 presets (default @ 75%, moderate @ 80%, heavy @ 85%)
- `sets_reps` / `sets_time`: Creates 1 default preset

### Workout Session

**File:** `mobile/app/workout-session.tsx`

Uses `getDefaultPreset(workout)` via `getTotalSets()` and `getReps()` to count sets and reps during a session.

### Set Plan (Warm-Up + Working Sets)

**Component:** `mobile/src/components/SetPlanCard.tsx`
**Constants:** `mobile/src/constants/warmupRamp.ts`

For `percentage_1rm` exercises, a set-by-set breakdown is shown in WorkoutDetail between the preset selector and the PR section. It includes warm-up ramp sets followed by working sets.

**Warm-up ramps** vary by preset:

| Preset | Warm-up Sets |
|--------|-------------|
| default (hypertrophy) | 10 @ bar, 5 @ 50%, 3 @ 70% |
| 5rm | 10 @ bar, 5 @ 50%, 3 @ 70% |
| strength | 10 @ bar, 5 @ 50%, 3 @ 70%, 1 @ 85% |

**Working set rest defaults** (when preset has no `restSeconds`):

| Preset | Rest |
|--------|------|
| hypertrophy | 120s |
| 5rm | 180s |
| strength | 240s |

**Weight display:** When the user has a 1RM logged (via PR system), actual weights are computed (`Math.round(oneRepMax * pct / 100)`). Without a 1RM, percentages are shown with a banner prompting the user to log their 1RM.

**Key constants** in `warmupRamp.ts`:
- `WARMUP_RAMP` — ramp definitions per preset key
- `WORKING_REST` — default rest seconds per preset key
- `PRESET_TO_RAMP` — maps preset name to ramp key (`"default"` → `"hypertrophy"`)
- `BAR_WEIGHT` — 45 lbs

### Personal Records

**File:** `mobile/src/components/personal-records/PRSection.tsx`

PR tracking is tied to presets — only rep counts that exist in the workout's presets are tracked. For example, a workout with presets at 1, 5, and 8 reps shows 1RM, 5RM, and 8RM cards.

```typescript
const presetRepCounts = [...new Set(
    workout.presets
        ?.filter((p) => p.reps != null)
        .map((p) => p.reps!) ?? []
)].sort((a, b) => a - b);
```

---

## Current Preset Data

### percentage_1rm exercises (14 exercises)

Each has 3 presets:

| Preset | Sets x Reps | % 1RM | isDefault |
|--------|-------------|-------|-----------|
| default | 3 x 8 | 75% | true |
| 5rm | 5 x 5 | 85% | false |
| strength | 5 x 1 | 95% | false |

### sets_reps / sets_time exercises

Each has 1 default preset with the exercise's standard configuration.

---

## Migration Notes

The old flat fields (`sets`, `reps`, `duration`, `intensity`, `intensityModel`, `defaultPreset`, `durationPerSet`) still exist on the `workouts` table but are no longer read by the frontend or returned by the API. They will be dropped in a future migration after full verification.

The SQL migration file is at `backend/migrations/001_workout_presets.sql`.

---

## Related Documentation

- [08-database-patterns.md](./08-database-patterns.md) - Database query patterns
- [13-workout-library.md](./13-workout-library.md) - Workout library overview
- [03-component-patterns.md](./03-component-patterns.md) - Component patterns
