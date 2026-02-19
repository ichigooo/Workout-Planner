# Database Patterns

> How to work with the Supabase database in Trainichi.

---

## Overview

Trainichi uses:
- **Supabase** (PostgreSQL) as the database
- **Prisma** for schema definitions and migrations
- **Supabase JS client** for queries in `server.js`

---

## Database Schema

### Core Tables

#### Users
```prisma
// File: backend/prisma/schema.prisma
model User {
    id           String    @id @default(uuid())
    email        String    @unique
    name         String?
    profilePhoto String?
    birthday     DateTime?
    isAdmin      Boolean   @default(false)
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt

    // Relations
    workoutPlans  WorkoutPlan[]
    workoutLogs   WorkoutLog[]
    personalRecords WorkoutPersonalRecord[]
}
```

#### Workouts
```prisma
model Workout {
    id           String   @id @default(cuid())
    title        String
    category     String   // "Upper Body - Pull", "Legs", etc.
    description  String?
    workoutType  String   // "strength"
    movementType String?  // "compound", "accessory", "isolation", etc.
    imageUrl     String?
    imageUrl2    String?
    isGlobal     Boolean  @default(true)
    isUnilateral Boolean  @default(false)  // true for single-arm/leg exercises
    createdBy    String?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    // Relations
    presets         WorkoutPreset[]
    planItems       PlanItem[]
    workoutLogs     WorkoutLog[]
    personalRecords WorkoutPersonalRecord[]
}
```

#### Workout Presets

Sets, reps, and intensity are stored per-preset rather than directly on the workout. See [15-workout-presets.md](./15-workout-presets.md) for full documentation.

```prisma
model WorkoutPreset {
    id             String  @id @default(dbgenerated("gen_random_uuid()::text"))
    workoutId      String
    preset         String        // "default", "strength", "5rm"
    sets           Int?
    reps           Int?
    intensityPct   Int?
    intensityLabel String?
    restSeconds    Int?
    durationPerSet Int?
    isDefault      Boolean @default(false)
    inputType      String  @default("sets_reps")
    workout        Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

    @@unique([workoutId, preset])
    @@map("workout_presets")
}
```

#### Workout Plans
```prisma
model WorkoutPlan {
    id        String   @id @default(uuid())
    name      String
    startDate DateTime
    endDate   DateTime
    userId    String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // Relations
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    planItems PlanItem[]
}
```

#### Plan Items
```prisma
model PlanItem {
    id            String   @id @default(uuid())
    workoutId     String
    workoutPlanId String
    scheduledDate DateTime @map("scheduled_date")
    intensity     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    workout     Workout     @relation(fields: [workoutId], references: [id])
    workoutPlan WorkoutPlan @relation(fields: [workoutPlanId], references: [id], onDelete: Cascade)
}
```

#### Workout Imports
```prisma
model WorkoutImport {
    id             String   @id @default(uuid())
    userId         String
    sourceUrl      String
    sourcePlatform String?  // "Instagram", "YouTube", "TikTok"
    title          String?
    category       String?
    description    String?
    thumbnailUrl   String?
    html           String?  // oEmbed HTML
    metadata       Json?    // Platform-specific data
    isGlobal       Boolean  @default(false)
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
}
```

---

## Query Patterns

### Basic CRUD Operations

```javascript
// File: backend/server.js

// CREATE
const { data, error } = await supabase
    .from("workouts")
    .insert({
        title: "New Workout",
        category: "Legs",
        workoutType: "strength",
    })
    .select()
    .single();

// READ (single)
const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .single();

// READ (list)
const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("isGlobal", true)
    .order("title", { ascending: true });

// UPDATE
const { data, error } = await supabase
    .from("workouts")
    .update({ title: "Updated Title" })
    .eq("id", workoutId)
    .select()
    .single();

// DELETE
const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
```

### Filtering

```javascript
// Multiple conditions
const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("category", "Legs")
    .eq("isGlobal", true);

// IN clause
const { data } = await supabase
    .from("workouts")
    .select("*")
    .in("category", ["Legs", "Core", "Cardio"]);

// Date range
const { data } = await supabase
    .from("plan_items")
    .select("*")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate);

// NULL check
const { data } = await supabase
    .from("users")
    .select("*")
    .is("profilePhoto", null);

// NOT NULL
const { data } = await supabase
    .from("users")
    .select("*")
    .not("profilePhoto", "is", null);
```

### Joins (Relations)

```javascript
// Get plan items with workout data
const { data } = await supabase
    .from("plan_items")
    .select(`
        *,
        workout:workouts(*)
    `)
    .eq("workoutPlanId", planId);

// Nested relations
const { data } = await supabase
    .from("workout_plans")
    .select(`
        *,
        user:users(id, name, email),
        planItems:plan_items(
            *,
            workout:workouts(*)
        )
    `)
    .eq("id", planId)
    .single();
```

### Ordering and Pagination

```javascript
// Order by date
const { data } = await supabase
    .from("plan_items")
    .select("*")
    .order("scheduled_date", { ascending: true });

// Limit results
const { data } = await supabase
    .from("workouts")
    .select("*")
    .limit(10);

// Pagination
const { data } = await supabase
    .from("workouts")
    .select("*")
    .range(0, 9);  // First 10 items (0-indexed)

const { data } = await supabase
    .from("workouts")
    .select("*")
    .range(10, 19);  // Next 10 items
```

### Upsert (Insert or Update)

```javascript
// Upsert by unique constraint
const { data, error } = await supabase
    .from("workout_personal_records")
    .upsert(
        {
            workoutId,
            userId,
            value: newValue,
        },
        {
            onConflict: "workoutId,userId",  // Unique constraint columns
        }
    )
    .select()
    .single();
```

---

## Common Queries in Trainichi

### Get User's Workout Plan

```javascript
// Get user's active plan ID
const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

const { data: plan } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();
```

### Get Plan Items by Date Range

```javascript
const { data } = await supabase
    .from("plan_items")
    .select(`
        *,
        workout:workouts(
            *, workout_presets(*)
        )
    `)
    .eq("workoutPlanId", planId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true });
```

### Get Workouts by Category

```javascript
const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("category", category)
    .eq("isGlobal", true)
    .order("title", { ascending: true });
```

### Check if Record Exists

```javascript
const { data, error } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("userId", userId)
    .single();

const exists = !error && data !== null;
```

---

## Image Upload to Storage

```javascript
// Upload image to Supabase Storage
async function uploadImage(base64Data, bucket, path) {
    // Decode base64
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Determine content type
    const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // Upload
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
            contentType,
            upsert: true,
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return urlData.publicUrl;
}
```

---

## Error Handling

```javascript
// Always check for errors
const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .single();

if (error) {
    if (error.code === "PGRST116") {
        // Not found
        return res.status(404).json({ error: "Workout not found" });
    }
    console.error("Database error:", error);
    return res.status(500).json({ error: "Database error", details: error.message });
}

// Handle empty results
if (!data) {
    return res.status(404).json({ error: "Not found" });
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `PGRST116` | No rows returned (for `.single()`) |
| `23505` | Unique constraint violation |
| `23503` | Foreign key constraint violation |
| `42P01` | Table doesn't exist |

---

## DO's and DON'Ts

### DO

```javascript
// Always use .select() after insert/update to get the result
const { data } = await supabase
    .from("workouts")
    .insert({ title: "New" })
    .select()  // Important!
    .single();

// Use .single() when expecting one row
const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

// Handle errors explicitly
if (error) {
    console.error("Error:", error);
    throw error;
}

// Use parameterized queries (Supabase does this automatically)
.eq("id", userProvidedId)  // Safe
```

### DON'T

```javascript
// DON'T forget error handling
const { data } = await supabase.from("workouts").select("*");
// What if it fails? Always check error!

// DON'T use string interpolation for values
.eq("id", `${userId}`)  // Unnecessary
.eq("id", userId)       // Correct

// DON'T forget cascading deletes
// Plan items should be deleted when plan is deleted
// (handled by Prisma schema with onDelete: Cascade)

// DON'T select * when you only need specific fields
.select("*")                    // Gets everything
.select("id, title, category")  // Better - only what you need
```

---

## Schema Changes

### Adding a New Column

1. Update Prisma schema:
```prisma
// backend/prisma/schema.prisma
model Workout {
    // ... existing fields
    newField String?  // Add new field
}
```

2. Generate migration:
```bash
cd backend
npx prisma migrate dev --name add_new_field
```

3. Push to production:
```bash
npx prisma migrate deploy
```

### Adding a New Table

1. Add model to schema:
```prisma
model NewTable {
    id        String   @id @default(uuid())
    name      String
    createdAt DateTime @default(now())
}
```

2. Generate and run migration:
```bash
npx prisma migrate dev --name add_new_table
```

---

## CRITICAL: Prisma Schema vs Supabase Client

This project uses a **hybrid approach**:
- **Prisma** for schema definition and migrations (creates/modifies tables)
- **Supabase JS client** for runtime queries in `server.js`

This creates important gotchas you MUST understand.

---

### Column Naming: camelCase in Prisma = camelCase in Database

When Prisma creates tables, it uses the **exact field names** from the schema:

```prisma
model PersonalRecordEntry {
    id           String   @id @default(cuid())
    userId       String      // Creates column named "userId" (camelCase)
    workoutId    String      // Creates column named "workoutId" (camelCase)
    dateAchieved DateTime    // Creates column named "dateAchieved" (camelCase)
}
```

When querying with Supabase client, use the **same camelCase names**:

```javascript
// CORRECT - matches Prisma schema field names
const { data } = await supabase
    .from("personal_record_entries")
    .select("*")
    .eq("userId", userId)      // camelCase
    .eq("workoutId", workoutId); // camelCase

// WRONG - snake_case won't match
.eq("user_id", userId)   // Won't find the column!
```

### Exception: `@map` Directive

If Prisma uses `@map`, use the mapped name in Supabase queries:

```prisma
model PlanItem {
    scheduledDate DateTime @map("scheduled_date")  // Column is "scheduled_date"
}
```

```javascript
// Use the @map name, not the field name
.gte("scheduled_date", startDate)  // CORRECT
.gte("scheduledDate", startDate)   // WRONG
```

---

### ID Generation: Prisma Defaults Don't Work with Supabase Client

Prisma's `@default(cuid())` only works when using **Prisma Client**. When inserting via Supabase client directly, you must generate IDs manually.

**Problem:**
```prisma
model PersonalRecordEntry {
    id String @id @default(cuid())  // Prisma would auto-generate
}
```

```javascript
// This FAILS with Supabase client - id will be null
const { data, error } = await supabase
    .from("personal_record_entries")
    .insert([{ userId, workoutId, reps, weight }])  // No id!
    .select();
// Error: null value in column "id" violates not-null constraint
```

**Solution: Generate ID manually**

1. Install cuid2:
```bash
npm install @paralleldrive/cuid2
```

2. Import and use:
```javascript
const { createId } = require("@paralleldrive/cuid2");

const { data, error } = await supabase
    .from("personal_record_entries")
    .insert([{
        id: createId(),  // Generate ID manually!
        userId,
        workoutId,
        reps,
        weight,
    }])
    .select();
```

---

### Timestamp Fields: Also Must Be Set Manually

Same issue applies to `@default(now())` and `@updatedAt`:

```prisma
model PersonalRecordEntry {
    createdAt DateTime @default(now())   // Prisma would auto-set
    updatedAt DateTime @updatedAt        // Prisma would auto-update
}
```

**Solution: Set timestamps manually**

```javascript
const now = new Date().toISOString();

const { data, error } = await supabase
    .from("personal_record_entries")
    .insert([{
        id: createId(),
        userId,
        workoutId,
        reps,
        weight,
        dateAchieved: now,
        createdAt: now,   // Set manually!
        updatedAt: now,   // Set manually!
    }])
    .select();
```

---

### Complete Example: New Table with Supabase Client

**1. Prisma Schema:**
```prisma
model PersonalRecordEntry {
    id           String   @id @default(cuid())
    userId       String
    workoutId    String
    reps         Int
    weight       Float
    dateAchieved DateTime @default(now())
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

    @@index([userId, workoutId, reps])
    @@map("personal_record_entries")  // Table name in DB
}
```

**2. Server.js Insert:**
```javascript
const { createId } = require("@paralleldrive/cuid2");

app.post("/api/workouts/:workoutId/pr-entries", async (req, res) => {
    const { workoutId } = req.params;
    const { userId, reps, weight, dateAchieved } = req.body;

    const now = new Date().toISOString();

    const { data: entry, error } = await supabase
        .from("personal_record_entries")
        .insert([{
            id: createId(),                    // Generate ID
            userId,                            // camelCase matches schema
            workoutId,                         // camelCase matches schema
            reps,
            weight,
            dateAchieved: dateAchieved || now,
            createdAt: now,                    // Set timestamp
            updatedAt: now,                    // Set timestamp
        }])
        .select()
        .single();

    if (error) throw error;
    res.status(201).json(entry);
});
```

**3. Server.js Query:**
```javascript
const { data } = await supabase
    .from("personal_record_entries")
    .select("*")
    .eq("userId", userId)       // camelCase
    .eq("workoutId", workoutId) // camelCase
    .order("weight", { ascending: false });
```

---

### Quick Reference: What to Check

| Prisma Feature | Works with Supabase Client? | Solution |
|----------------|----------------------------|----------|
| `@id @default(cuid())` | NO | Use `createId()` from `@paralleldrive/cuid2` |
| `@id @default(uuid())` | NO | Use `crypto.randomUUID()` or `uuid` package |
| `@default(now())` | NO | Use `new Date().toISOString()` |
| `@updatedAt` | NO | Set manually on insert/update |
| `@@map("table_name")` | YES | Use mapped table name in `.from()` |
| `@map("column_name")` | YES | Use mapped column name in `.eq()`, `.select()` |
| Field names (no @map) | YES | Use exact camelCase field names |
| `@relation` | Partial | Use Supabase join syntax, not Prisma includes |

---

### Debugging Tips

**Error: "null value in column X violates not-null constraint"**
- You forgot to provide a required field that Prisma would auto-generate
- Check: `id`, `createdAt`, `updatedAt`

**Error: "column X does not exist"**
- Column name mismatch (snake_case vs camelCase)
- Check the Prisma schema for `@map` directives
- Run `npx prisma db push` if table/column is new

**Query returns empty but data exists:**
- Wrong column name in `.eq()` filter
- Check: Are you using camelCase consistently?

**To inspect actual column names:**
```bash
# In Prisma Studio
cd backend && npx prisma studio

# Or query information_schema
SELECT column_name FROM information_schema.columns
WHERE table_name = 'personal_record_entries';
```

---

## Related Documentation

- [04-adding-server-request.md](./04-adding-server-request.md) - Using database in API routes
- [00-overview.md](./00-overview.md) - Tech stack overview
