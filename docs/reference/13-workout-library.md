# Workout Library

> Documentation for the Workout Library feature, including global workouts and imported workouts.

## Overview

The Workout Library is the central hub for browsing, managing, and importing workouts. It combines two sources of workouts:

1. **Global Workouts**: Pre-built workouts stored in the `workouts` table, available to all users
2. **Imported Workouts**: User-imported workouts from external sources (YouTube, Instagram) stored in `workout_imports` table

## Data Sources

### Global Workouts (`workouts` table)

Standard workouts created by admins that appear for all users.

**Schema** ([backend/prisma/schema.prisma:30-52](../../backend/prisma/schema.prisma)):

```prisma
model Workout {
  id          String   @id @default(cuid())
  title       String
  category    String
  description String?
  workoutType String
  sets        Int?
  reps        Int?
  duration    Int?
  intensity   String
  imageUrl    String?
  imageUrl2   String?
  isGlobal    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Imported Workouts (`workout_imports` table)

Workouts imported from external sources like YouTube or Instagram.

**Schema** ([backend/prisma/schema.prisma:117-136](../../backend/prisma/schema.prisma)):

```prisma
model WorkoutImport {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id         String
  source_url      String
  source_platform String?
  title           String?
  category        String?
  description     String?
  thumbnail_url   String?
  metadata        Json?
  is_global       Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @default(now())
  html            String?
}
```

**Key Fields**:
- `user_id`: Owner of the import (the user who imported it, or admin for public imports)
- `source_platform`: Platform type ("youtube", "instagram")
- `is_global`: If `true`, visible to all users; if `false`, only visible to owner
- `metadata`: JSON containing oEmbed response data (author, duration, etc.)

## Import Types

### Personal Imports (`is_global = false`)

- Created by regular users importing workouts for themselves
- Only visible to the user who imported them
- Appear in both their assigned category tab AND the "Custom" tab
- Display a pink "IMPORTED" badge
- User can delete their own personal imports

### Public Imports (`is_global = true`)

- Created by admin users with the "Make Public" toggle enabled
- Visible to ALL users in the app
- Appear only in their assigned category tab (NOT in "Custom" tab)
- No "IMPORTED" badge (appear like regular workouts)
- Only the admin owner can delete them

## UI Components

### Workout Library Screen

**File**: [mobile/app/workout.tsx](../../mobile/app/workout.tsx)

The main screen for browsing all workouts with category filtering.

**Category Tabs**:
- **All**: Shows all global workouts + all imports (personal and public)
- **Custom**: Shows only the user's personal imports (not public imports)
- **Category tabs** (e.g., "Cardio", "Strength"): Shows global workouts + matching imports filtered by category

**Data Loading**:

```typescript
// Load global workouts
const data = await apiService.getWorkouts();

// Load imports (personal + public)
const imports = await apiService.getWorkoutImports(currentUserId);
```

**Filtering Logic**:

```typescript
// Separate personal from public imports
const personalImports = customWorkouts.filter(
    (w) => !w.isGlobal && w.userId === currentUserId
);

// "Custom" tab shows only personal imports
// Category tabs show workouts + matching imports (both personal and public)
const listData = showingCustom
    ? personalImports
    : [...filteredRegularWorkouts, ...filteredCustomWorkouts];
```

### Import Workflow

**File**: [mobile/app/import-workout.tsx](../../mobile/app/import-workout.tsx)

Multi-step flow for importing workouts from external platforms.

**Supported Platforms**:
- YouTube (fully implemented)
- Instagram (implemented but may require API keys)
- TikTok (coming soon)

**Import Flow**:
1. User selects platform (YouTube/Instagram/TikTok)
2. User pastes URL
3. App validates URL format
4. Backend fetches metadata via oEmbed API
5. Preview modal shows extracted data
6. User selects category
7. (Admin only) User can toggle "Make Public"
8. On confirm, workout is saved to `workout_imports`

### Import Preview Modal

**File**: [mobile/src/components/WorkoutImportPreview.tsx](../../mobile/src/components/WorkoutImportPreview.tsx)

Modal shown after URL validation, displaying extracted metadata.

**Props**:

```typescript
interface WorkoutImportPreviewProps {
    visible: boolean;
    workout: WorkoutImport | null;
    onConfirm: (category: string, isGlobal: boolean) => void;
    onCancel: () => void;
    isAdmin?: boolean;  // Shows "Make Public" toggle when true
}
```

**Admin Toggle**:

When `isAdmin=true`, shows a "Make Public" switch that sets `is_global=true` on the import.

### Custom Import Detail Screen

**File**: [mobile/app/import-workout/custom.tsx](../../mobile/app/import-workout/custom.tsx)

Full-screen detail view for imported workouts.

**Features**:
- Large thumbnail with play overlay
- Platform badge (YouTube/Instagram icon)
- "IMPORTED" badge (only for personal imports)
- Title, author, and metadata
- "Open in [Platform]" button
- "Add to Plan" button
- Delete option (for owners only)

## API Endpoints

### GET `/api/workouts`

Fetches all global workouts.

**Response**: `Workout[]`

### GET `/api/users/:userId/workout-imports`

Fetches user's personal imports AND all public imports.

**Backend** ([server.js:1692-1711](../../backend/server.js)):

```javascript
const { data, error } = await supabase
    .from("workout_imports")
    .select("*")
    .or(`user_id.eq.${userId},is_global.eq.true`)
    .order("created_at", { ascending: false });
```

**Response**: `WorkoutImport[]` (includes both personal and public)

### POST `/api/workout-imports/youtube`

Import a workout from YouTube.

**Request**:
```json
{
    "userId": "user-id",
    "url": "https://youtube.com/watch?v=...",
    "category": "Cardio",
    "isGlobal": false
}
```

**Admin Check**: If `isGlobal=true`, backend verifies user has `isAdmin=true`.

**Response**: `WorkoutImport`

### POST `/api/workout-imports/instagram`

Import a workout from Instagram.

**Request**:
```json
{
    "userId": "user-id",
    "url": "https://instagram.com/reel/...",
    "category": "Strength",
    "isGlobal": false
}
```

**Response**: `WorkoutImport`

### DELETE `/api/workout-imports/:id`

Delete an imported workout.

**Request**: `?userId=user-id`

**Permission Checks**:
- Personal imports: Only owner can delete
- Public imports: Only owner AND must be admin

**Response**: `204 No Content`

## Mobile API Service

**File**: [mobile/src/services/api.ts](../../mobile/src/services/api.ts)

```typescript
// Import from YouTube
async importWorkoutFromYouTube(payload: {
    userId: string;
    url: string;
    category?: string | null;
    isGlobal?: boolean;
}): Promise<WorkoutImport>

// Import from Instagram
async importWorkoutFromInstagram(payload: {
    userId: string;
    url: string;
    category?: string | null;
    isGlobal?: boolean;
}): Promise<WorkoutImport>

// Get all imports (personal + public)
async getWorkoutImports(userId: string): Promise<WorkoutImport[]>

// Delete an import
async deleteWorkoutImport(id: string, userId: string): Promise<void>
```

## Type Definitions

**File**: [mobile/src/types/index.ts](../../mobile/src/types/index.ts)

```typescript
export interface WorkoutImport {
    id: string;
    userId: string;
    sourceUrl: string;
    sourcePlatform?: string | null;
    title?: string | null;
    category?: string | null;
    description?: string | null;
    thumbnailUrl?: string | null;
    html?: string | null;
    metadata?: Record<string, any> | null;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
}
```

## Permission Model

| Action | Personal Import | Public Import |
|--------|-----------------|---------------|
| View | Owner only | All users |
| Delete | Owner | Owner + Admin |
| Create | Any user | Admin only |
| Edit | Owner | Owner + Admin |

## Display Rules

| Tab | Shows |
|-----|-------|
| All | Global workouts + all imports |
| Custom | Personal imports only |
| Category | Global workouts + matching imports (personal + public) |

| Import Type | "IMPORTED" Badge | "CUSTOM" Tag | Appears in Custom Tab |
|-------------|------------------|--------------|----------------------|
| Personal | Yes | Yes | Yes |
| Public | No | No | No |

## Testing Checklist

### Import Flow

- [ ] YouTube URL validation works
- [ ] Preview modal shows correct metadata
- [ ] Category selection persists
- [ ] (Admin) "Make Public" toggle appears
- [ ] (Admin) Public import visible to other users
- [ ] Success alert appears after import

### Workout Library Display

- [ ] Global workouts load correctly
- [ ] Personal imports show in "Custom" tab
- [ ] Personal imports show in category tabs
- [ ] Public imports show in category tabs
- [ ] Public imports do NOT show in "Custom" tab
- [ ] Personal imports have "IMPORTED" badge
- [ ] Public imports do NOT have "IMPORTED" badge

### Delete Permissions

- [ ] Owner can delete personal import
- [ ] Non-owner cannot delete personal import
- [ ] Admin owner can delete public import
- [ ] Non-admin cannot delete public import
- [ ] Non-owner admin cannot delete public import

## Related Documentation

- [04-adding-server-request.md](04-adding-server-request.md) - API endpoint patterns
- [08-database-patterns.md](08-database-patterns.md) - Database schema patterns
- [12-admin-features.md](12-admin-features.md) - Admin privileges and management
