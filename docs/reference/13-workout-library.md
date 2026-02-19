# Workout Library

> Documentation for the Workout Library feature, including global workouts and imported workouts.

## Overview

The Workout Library is the central hub for browsing, managing, and importing workouts. It combines two sources of workouts:

1. **Global Workouts**: Pre-built workouts stored in the `workouts` table, available to all users
2. **Imported Workouts**: User-imported workouts from external sources (YouTube, Instagram) stored in `workout_imports` table

## Data Sources

### Global Workouts (`workouts` table)

Standard workouts created by admins that appear for all users.

**Schema** ([backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)):

```prisma
model Workout {
  id           String   @id @default(cuid())
  title        String
  category     String
  description  String?
  workoutType  String          // "strength"
  movementType String?         // "compound", "accessory", etc.
  imageUrl     String?
  imageUrl2    String?
  isGlobal     Boolean  @default(true)
  isUnilateral Boolean  @default(false)  // true for single-arm/leg exercises
  createdBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  presets      WorkoutPreset[] // Sets/reps/intensity stored in presets
}
```

Sets, reps, and intensity are stored in the `workout_presets` table. See [15-workout-presets.md](./15-workout-presets.md) for details.

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
- User can delete their own personal imports

### Public Imports (`is_global = true`)

- Created by admin users with the "Make Public" toggle enabled
- Visible to ALL users in the app
- Appear only in their assigned category tab (NOT in "Custom" tab)
- Only the admin owner can delete them

## UI Components

### Workout Library Screen

**File**: [mobile/app/workout.tsx](../../mobile/app/workout.tsx)

The main screen for browsing all workouts with category filtering.

**Category Tabs**:
- **All**: Shows all global workouts + all imports (personal and public)
- **Custom**: Shows only the user's personal imports (not public imports)
- **Category tabs** (e.g., "Cardio", "Mobility"): Shows global workouts + matching imports filtered by category

**Category Tab Generation**:

Category tabs are dynamically generated from BOTH regular workouts AND custom imports:

```typescript
const categoriesWithAll = React.useMemo(() => {
    // Include categories from both regular workouts and custom imports
    const regularCategories = workouts.map((w) => w.category);
    const customCategories = customWorkouts
        .map((w) => w.category)
        .filter((c): c is string => c !== null && c !== undefined);
    const allCategories = Array.from(new Set([...regularCategories, ...customCategories]));
    const base = orderCategoriesWithClimbingAtEnd(allCategories);
    return ["All", "Custom", ...base];
}, [workouts, customWorkouts]);
```

This ensures that if you have public imports with a category like "Mobility" that has no regular workouts, the "Mobility" tab will still appear.

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

Single-screen, URL-first flow for importing workouts from external platforms. The UI is platform-agnostic — identical layout regardless of source, with auto-detected platform badge.

**Supported Platforms**:
- YouTube (fully supported via oEmbed)
- Instagram (fully supported via oEmbed + OG tag scraping fallback)
- TikTok (inline "coming soon" banner when detected)

**Phase-Based State**:

```typescript
type Phase = "input" | "loading" | "preview" | "saving" | "success" | "error";
```

**Two-Phase API Flow**:
1. **Preview**: User pastes URL → taps "Preview Workout" → backend fetches metadata via oEmbed (creates DB record without category) → inline preview card appears
2. **Save**: User optionally picks category → taps "Save to Library" → calls `PUT /api/workout-imports/:id` to update category/isGlobal

**Platform Auto-Detection** (runs on URL change):

```typescript
const detectPlatform = (text: string) => {
    if (/instagram\.com\/(reel|p)\//i.test(text)) return "instagram";
    if (/youtube\.com\/(watch|shorts)|youtu\.be\//i.test(text)) return "youtube";
    if (/tiktok\.com\/@.+\/video\//i.test(text)) return "tiktok";
    return null;
};
```

**UI Elements**:
- **URL input**: Auto-detected platform badge appears inside the input when a valid URL is detected
- **Preview button**: Accent pill button, appears below input when valid URL detected (not auto-fetch)
- **Inline preview card**: Glass card with large video thumbnail, platform badge, title (Fraunces), author, description (DM Sans)
- **Category chips**: Horizontal scroll, pill shape. First chip = "None" (selected by default, for multi-exercise imports). Category is optional — `null` category is valid
- **Admin toggle**: Inline surface card with "Make Public" label + Switch (shown only for admin users)
- **Loading state**: Animated skeleton card (pulsing placeholder rectangles)
- **Success state**: Inline card with checkmark + "Saved to Library" + navigation buttons

**Instagram Metadata Resolution**:

The backend uses a two-tier approach for Instagram metadata:
1. **oEmbed API** (`graph.facebook.com/v22.0/instagram_oembed`): Returns embed HTML but often returns null for thumbnail/author/title
2. **OG tag scraping fallback**: When oEmbed returns incomplete data, the server fetches the Instagram page with a Googlebot user-agent and parses Open Graph meta tags (`og:image`, `og:title`, `og:description`). Extracts username from the description pattern.

### Custom Import Detail Screen

**File**: [mobile/app/import-workout/custom.tsx](../../mobile/app/import-workout/custom.tsx)

Full-screen detail view for imported workouts.

**Features**:
- Large thumbnail with play overlay
- Platform badge (YouTube/Instagram icon)
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
    "url": "https://youtube.com/watch?v=..."
}
```

**Response**: `WorkoutImport` (created without category — category is added via PUT on save)

### POST `/api/workout-imports/instagram`

Import a workout from Instagram. Uses oEmbed API with OG tag scraping fallback for metadata.

**Request**:
```json
{
    "userId": "user-id",
    "url": "https://instagram.com/reel/..."
}
```

**Response**: `WorkoutImport` (created without category — category is added via PUT on save)

### PUT `/api/workout-imports/:id`

Update an imported workout (category, isGlobal, title, description). Used after preview to save user's category selection and admin settings.

**Request**:
```json
{
    "category": "Upper Body - Pull",
    "isGlobal": false
}
```

Only provided fields are updated (sparse update pattern).

**Response**: Updated `WorkoutImport`

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

| Import Type | "CUSTOM" Tag | Appears in Custom Tab |
|-------------|--------------|----------------------|
| Personal | Yes | Yes |
| Public | No | No |

## Testing Checklist

### Import Flow

- [ ] YouTube URL auto-detected, platform badge appears
- [ ] Instagram URL auto-detected, platform badge appears
- [ ] TikTok URL shows "coming soon" banner
- [ ] Preview button fetches metadata and shows inline preview card
- [ ] Category chips work (including "None" default)
- [ ] (Admin) "Make Public" toggle appears
- [ ] (Admin) Public import visible to other users
- [ ] Save button creates/updates import with selected category
- [ ] Success state shows inline with navigation options

### Workout Library Display

- [ ] Global workouts load correctly
- [ ] Personal imports show in "Custom" tab
- [ ] Personal imports show in category tabs
- [ ] Public imports show in category tabs
- [ ] Public imports do NOT show in "Custom" tab
- [ ] Personal imports show in correct category tabs

### Delete Permissions

- [ ] Owner can delete personal import
- [ ] Non-owner cannot delete personal import
- [ ] Admin owner can delete public import
- [ ] Non-admin cannot delete public import
- [ ] Non-owner admin cannot delete public import

## Troubleshooting

### Imports not showing in category tabs

**Symptom**: Public imports exist in the database but don't appear in the app.

**Possible causes**:

1. **Category mismatch**: The import's category doesn't match any existing tab. Check that the category name in `workout_imports.category` matches exactly (case-sensitive).

2. **API not returning global imports**: Verify the backend query uses `.or()` to fetch both user imports and global imports:
   ```javascript
   .or(`user_id.eq.${userId},is_global.eq.true`)
   ```

3. **Frontend filtering issue**: Use debug logging to trace data flow:
   ```typescript
   console.log("customWorkouts count:", customWorkouts.length);
   console.log("filteredCustomWorkouts count:", filteredCustomWorkouts.length);
   console.log("listData count:", listData.length);
   console.log("category:", category);
   ```

### Backend update accidentally clearing fields

**Symptom**: Updating a record clears fields that weren't included in the request.

**Cause**: Using default values for optional fields in the update object.

**Bad pattern**:
```javascript
const update = {
    title: body.title,
    trackRecords: body.trackRecords ?? false,  // Clears to false if not provided!
};
```

**Good pattern**: Only include fields that were explicitly provided:
```javascript
const update = {
    title: body.title,
    // Only update trackRecords if explicitly provided in request
    ...(body.trackRecords !== undefined && { trackRecords: body.trackRecords }),
};
```

## Related Documentation

- [04-adding-server-request.md](04-adding-server-request.md) - API endpoint patterns
- [08-database-patterns.md](08-database-patterns.md) - Database schema patterns
- [12-admin-features.md](12-admin-features.md) - Admin privileges and management
