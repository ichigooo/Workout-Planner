# Training Plan Import

> Documentation for importing pre-built training plan templates into a user's workout schedule.

## Overview

The Training Plan Import feature allows users to browse pre-built training plan templates and import them into their personal workout calendar. Templates define structured multi-week programs with specific workouts scheduled on configurable training days.

**Key Flow**:
1. User browses available training plan templates
2. User selects a template and clicks "Use this plan"
3. 3-step modal guides them through configuration:
   - Step 1: Choose start date
   - Step 2: Select training days of the week
   - Step 3: Preview scheduled workouts and confirm
4. Plan items are created in the user's workout calendar

## Data Model

### Workout Plan Template (`workout_plan_templates` table)

Templates define the structure of a training program.

**Schema** ([backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)):

```prisma
model WorkoutPlanTemplate {
  id               String   @id @default(cuid())
  name             String
  description      String?
  numWeeks         Int      @map("num_weeks")
  daysPerWeek      Int      @map("days_per_week")
  workoutStructure Json     @map("workout_structure")
  level            String?
  createdBy        String?  @map("created_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @default(now()) @map("updated_at")
}
```

**Key Fields**:
- `numWeeks`: Total weeks in the program
- `daysPerWeek`: Expected training sessions per week
- `workoutStructure`: JSON array defining workouts for each day of each week

**workoutStructure Format**:

```typescript
type WorkoutDayTemplate = {
    name: string;           // Day name, e.g., "Upper Body A"
    workoutIds: string[];   // Array of workout IDs to schedule
};

// workoutStructure is WorkoutDayTemplate[][]
// Outer array: weeks, Inner array: days within that week
[
    // Week 1
    [
        { name: "Day 1 Week 1", workoutIds: ["workout-id-1"] },
        { name: "Day 2 Week 1", workoutIds: ["workout-id-2", "workout-id-3"] },
    ],
    // Week 2
    [
        { name: "Day 1 Week 2", workoutIds: ["workout-id-4"] },
        { name: "Day 2 Week 2", workoutIds: ["workout-id-5"] },
    ],
]
```

### Plan Items (`plan_items` table)

Created when a user imports a template into their schedule.

**Schema**:

```prisma
model PlanItem {
  id             String      @id @default(cuid())
  workoutPlanId  String      @map("workoutPlanId")
  workoutId      String
  scheduledDate  DateTime    @map("scheduled_date")
  intensity      String?
  workout        Workout     @relation(fields: [workoutId], references: [id])
  workoutPlan    WorkoutPlan @relation(fields: [workoutPlanId], references: [id])
}
```

## Core Components

### Training Plans Screen

**File**: [mobile/app/(tabs)/plan.tsx](../../mobile/app/(tabs)/plan.tsx)

Main screen for browsing training plan templates.

**Features**:
- Grid view of available templates
- Template cards showing name, duration, level
- Tap to view template details

### Template Detail Screen

**File**: [mobile/app/training-plan/[id].tsx](../../mobile/app/training-plan/[id].tsx)

Detail view for a specific template.

**Features**:
- Template overview (name, description, weeks, days/week)
- Week-by-week breakdown of workouts
- "Use this plan" button to start import flow

### Plan Setup Modal

**File**: [mobile/src/components/plan/PlanSetupModal.tsx](../../mobile/src/components/plan/PlanSetupModal.tsx)

3-step modal for configuring and importing a template.

**Props**:

```typescript
type PlanSetupModalProps = {
    visible: boolean;
    templateId?: string;
    template?: WorkoutPlanTemplate;
    weeklyDays?: number;          // Default training days to pre-select
    onClose: () => void;
    onPlanCreated?: () => void;   // Called on successful import
};
```

**Step 1 - Start Date**:
- Date picker to choose when the plan begins
- Default: tomorrow

**Step 2 - Training Days**:
- Day-of-week chips (M T W T F S S)
- Pre-selected based on template's `daysPerWeek`
- "Clear existing plan" checkbox option

**Step 3 - Preview**:
- Shows first 10 scheduled workouts with dates
- Displays "+X more workouts" for additional items
- "Clear existing plan" toggle
- "Confirm and create" button

### Scheduling Logic

**File**: [mobile/src/components/plan/planScheduling.ts](../../mobile/src/components/plan/planScheduling.ts)

#### `generatePlanItemsFromTemplate()`

Generates plan items by mapping template workouts to actual dates.

```typescript
type GeneratePlanItemsArgs = {
    template: WorkoutPlanTemplate;
    startDate: Date;
    workoutDays: string[];  // e.g., ["mon", "wed", "fri"]
};

export const generatePlanItemsFromTemplate = (
    args: GeneratePlanItemsArgs
): GeneratedPlanItem[]
```

**Scheduling Algorithm**:
1. Normalize selected days to day-of-week indices (0=Sun, 6=Sat)
2. Find the first selected day on or after the start date
3. For each week in the template:
   - Distribute workouts across selected days
   - If more workouts than selected days, continue sequentially
4. Return array of `{ workoutId, scheduledDate }` items

**Example**:
- Start date: Tuesday, Dec 9
- Selected days: Mon, Wed, Fri
- First workout lands on Wed, Dec 10 (next available day)
- Subsequent workouts on Fri, Mon, Wed, etc.

#### `createUserPlanFromTemplate()`

Creates plan items in the database.

```typescript
type CreatePlanArgs = {
    template?: WorkoutPlanTemplate;
    templateId?: string;
    startDate: Date;
    workoutDays: string[];
    clearExistingPlan: boolean;
};

export const createUserPlanFromTemplate = async (
    args: CreatePlanArgs
): Promise<CreatePlanResult>
```

**Flow**:
1. Validate template exists
2. Get userId and planId from session
3. Generate plan items from template
4. If `clearExistingPlan`, call bulk delete endpoint
5. Group items by workoutId for efficient bulk insert
6. Make parallel API calls with `Promise.allSettled()`
7. Handle partial failures gracefully
8. Invalidate plan items cache

**Error Handling**:
- Returns `{ success: false, error: "..." }` for failures
- Partial success: `{ success: true, itemsCreated: N, error: "Added X of Y" }`

## API Endpoints

### GET `/api/workout-plan-templates`

Fetch all available templates.

**Response**: `WorkoutPlanTemplate[]`

### GET `/api/workout-plan-templates/:id`

Fetch a specific template.

**Response**: `WorkoutPlanTemplate`

### POST `/api/workout-plans/:id/plan-items`

Add workouts to a plan (bulk insert).

**Request**:
```json
{
    "workoutId": "workout-uuid",
    "dates": ["2025-01-06", "2025-01-08", "2025-01-10"]
}
```

**Response**: `PlanItem[]`

### DELETE `/api/workout-plans/:id/plan-items`

Bulk delete all plan items for a workout plan.

**File**: [backend/server.js](../../backend/server.js) (line ~1767)

```javascript
app.delete("/api/workout-plans/:id/plan-items", async (req, res) => {
    const planId = req.params.id;

    // Verify plan exists
    const { data: plan } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("id", planId)
        .maybeSingle();

    if (!plan) {
        return res.status(404).json({ error: "Workout plan not found" });
    }

    // Delete all items
    await supabase.from("plan_items").delete().eq("workoutPlanId", planId);
    res.status(204).send();
});
```

**Response**: `204 No Content`

## Mobile API Service

**File**: [mobile/src/services/api.ts](../../mobile/src/services/api.ts)

```typescript
// Get all templates
async getWorkoutPlanTemplates(): Promise<WorkoutPlanTemplate[]>

// Get specific template
async getWorkoutPlanTemplate(id: string): Promise<WorkoutPlanTemplate>

// Bulk add workouts to plan
async addWorkoutToPlanOnDates(
    planId: string,
    payload: { workoutId: string; dates: string[] }
): Promise<PlanItem[]>

// Bulk delete all plan items
async clearPlanItems(planId: string): Promise<void>
```

## Type Definitions

**File**: [mobile/src/types/index.ts](../../mobile/src/types/index.ts)

```typescript
export interface WorkoutPlanTemplate {
    id: string;
    name: string;
    description?: string | null;
    numWeeks: number;
    daysPerWeek: number;
    workoutStructure: WorkoutDayTemplate[][];
    level?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutDayTemplate {
    name: string;
    workoutIds: string[];
}
```

## Unit Tests

**File**: [mobile/src/components/plan/__tests__/planScheduling.test.ts](../../mobile/src/components/plan/__tests__/planScheduling.test.ts)

### `generatePlanItemsFromTemplate` Tests

- Aligns workouts to next available selected day
- Keeps start date when user selects that weekday
- Falls back to sequential scheduling when no days selected

### `createUserPlanFromTemplate` Tests

- Returns error when no template provided
- Returns error when user not logged in
- Returns error when plan ID not found
- Successfully creates plan items without clearing
- Clears existing plan when requested
- Handles partial API failures gracefully
- Returns failure when all API calls fail

## Error Handling

### User-Facing Errors

Displayed in the modal's error container:

| Error | Cause |
|-------|-------|
| "No template provided" | Template undefined (shouldn't happen) |
| "User not logged in" | Session expired |
| "Could not find workout plan" | Plan ID missing |
| "Template generated no plan items" | Empty template |
| "Failed to add workouts to plan" | All API calls failed |
| "Added X of Y workout groups" | Partial failure |

### Foreign Key Constraint Errors

If a template references a non-existent workout ID:

```
Key (workoutId)=(uuid) is not present in table "workouts"
```

**Solution**: Remove invalid workout IDs from the template's `workoutStructure` JSON.

## Caching

The `planItemsCache` is invalidated after:
- Successfully creating plan items
- Clearing existing plan items
- Partial success (some items created)

**File**: [mobile/src/services/planItemsCache.ts](../../mobile/src/services/planItemsCache.ts)

## Testing Checklist

### Import Flow

- [ ] Template list loads correctly
- [ ] Template detail shows all weeks/days
- [ ] "Use this plan" opens modal
- [ ] Date picker works on iOS and Android
- [ ] Day chips toggle correctly
- [ ] Preview shows correct workout titles
- [ ] Preview shows correct dates
- [ ] "Clear existing plan" works

### Edge Cases

- [ ] Start date on a non-selected day aligns to next selected day
- [ ] More workouts than selected days handled correctly
- [ ] Empty selected days falls back to sequential
- [ ] Template with invalid workout IDs shows partial success

### Error Handling

- [ ] Network error shows retry option
- [ ] Partial failure shows count
- [ ] Modal stays open on error for retry

## Related Documentation

- [04-adding-server-request.md](04-adding-server-request.md) - API endpoint patterns
- [08-database-patterns.md](08-database-patterns.md) - Database schema patterns
- [13-workout-library.md](13-workout-library.md) - Workout library and imports
