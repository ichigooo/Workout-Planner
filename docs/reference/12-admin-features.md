# Admin Features

> Documentation for admin-only features in the Trainichi app

## Overview

The app includes a simple admin system for managing the global workout library. Admin privileges are manually assigned via the database and enable users to create, edit, and delete workouts that are shared across all users.

## Admin Privileges

### What Admins Can Do

- **Create workouts**: Add new workouts to the global library
- **Edit workouts**: Modify existing workouts (title, category, description, sets, reps, etc.)
- **Delete workouts**: Remove workouts from the global library

### What Regular Users Can Do

- **View workouts**: Browse and view all workouts in the global library
- **Use workouts**: Add workouts to their personal training plans
- **Log workouts**: Track their workout sessions

## Implementation Details

### Database Schema

The admin flag is stored in the `users` table:

```sql
CREATE TABLE users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  "profilePhoto" text,
  birthday timestamp,
  "isAdmin" boolean NOT NULL DEFAULT false,  -- Admin flag
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL
);
```

**Prisma Schema** ([backend/prisma/schema.prisma:11-28](../backend/prisma/schema.prisma)):

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  profilePhoto String?
  birthday     DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  isAdmin      Boolean   @default(false)
  // ... relations
}
```

### Frontend Implementation

#### Type Definition

[mobile/src/types/index.ts:1-10](../mobile/src/types/index.ts):

```typescript
export interface User {
    id: string;
    email: string;
    name?: string;
    profilePhoto?: string;
    birthday?: string;
    createdAt: string;
    updatedAt: string;
    isAdmin: boolean;
}
```

#### UI Behavior

**Workout Library Screen** ([mobile/app/workout.tsx](../mobile/app/workout.tsx)):

- Admins see an "Add" button in the top-right to create new workouts
- Regular users don't see this button

**Workout Detail Screen** ([mobile/src/components/WorkoutDetail.tsx](../mobile/src/components/WorkoutDetail.tsx)):

- Admins see a three-dot menu (⋯) in the top-right with "Edit" and "Delete" options
- Regular users don't see this menu
- Edit opens a modal with the workout form pre-filled
- Delete shows a confirmation dialog

#### Admin Check Logic

```typescript
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
    let mounted = true;
    (async () => {
        try {
            const current = await getCurrentUser();
            if (!mounted) return;
            if (current) {
                setIsAdmin(Boolean(current.isAdmin));
                return;
            }
            const userId = getCurrentUserId();
            if (userId) {
                const u = await apiService.getUserProfile(userId);
                if (!mounted) return;
                setIsAdmin(Boolean(u?.isAdmin));
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
        }
    })();
}, []);
```

### Backend Implementation

#### API Endpoints

**Update Workout** - [backend/server.js:863](../backend/server.js#L863):

```javascript
app.put("/api/workouts/:id", requireAdmin, async (req, res) => {
    // Update workout logic...
});
```

**Delete Workout** - [backend/server.js:932](../backend/server.js#L932):

```javascript
app.delete("/api/workouts/:id", requireAdmin, async (req, res) => {
    // Delete workout logic...
});
```

#### Admin Middleware

[backend/server.js:165-205](../backend/server.js#L165-L205):

```javascript
/**
 * requireAdmin
 * Simple admin check middleware for personal use.
 * Checks if the userId in the request has isAdmin=true in the database.
 */
async function requireAdmin(req, res, next) {
    try {
        // Get userId from body or query params
        const userId = req.body?.userId || req.query?.userId;

        if (!userId) {
            return res.status(400).json({
                error: "userId is required"
            });
        }

        // Check if user is admin
        const { data, error } = await supabase
            .from("users")
            .select("isAdmin")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error checking admin status:", error);
            return res.status(500).json({ error: "Failed to verify admin status" });
        }

        if (!data?.isAdmin) {
            return res.status(403).json({
                error: "Admin privileges required"
            });
        }

        next();
    } catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({ error: "Failed to verify admin status" });
    }
}
```

#### Mobile API Service

[mobile/src/services/api.ts:121-153](../mobile/src/services/api.ts):

```typescript
async updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout> {
    // Import session to get current userId for admin check
    const { getCurrentUserId } = await import("../state/session");
    const userId = getCurrentUserId();

    const result = await this.request<Workout>(`/workouts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...workout,
            userId, // Add userId for admin check
        }),
    });
    const { planItemsCache } = await import("./planItemsCache");
    planItemsCache.invalidateWorkouts();
    return result;
}

async deleteWorkout(id: string): Promise<void> {
    const { getCurrentUserId } = await import("../state/session");
    const userId = getCurrentUserId();

    await this.request<void>(`/workouts/${id}?userId=${userId}`, {
        method: "DELETE",
    });
    const { planItemsCache } = await import("./planItemsCache");
    planItemsCache.invalidateWorkouts();
}
```

## Setting Admin Status

### Option 1: Using Prisma Studio (Recommended)

1. Open Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

2. Navigate to the `users` table
3. Find your user by email
4. Click on the `isAdmin` field and change it to `true`
5. Click the green checkmark to save

### Option 2: Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Check current admin status
SELECT email, "isAdmin" FROM users WHERE email = 'your-email@example.com';

-- Set user as admin
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';

-- Verify the change
SELECT email, "isAdmin" FROM users WHERE email = 'your-email@example.com';
```

### Option 3: Using psql

If you have direct database access:

```bash
psql $DATABASE_URL
```

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

## Security Notes

### Current Implementation

- **Simple userId-based authentication**: The mobile app sends the current user's ID with update/delete requests
- **Backend validation**: The server checks if the userId has `isAdmin = true` in the database
- **Suitable for personal use**: This approach works well when you manually control admin access

### Limitations

⚠️ **Not production-ready for real multi-user apps** because:

- No proper authentication token verification
- Relies on the client sending their own userId
- Assumes trust in the client application

### Production Considerations

For a production app with real users, you would want to:

1. **Use Supabase Auth tokens**: Verify JWT tokens in the backend middleware
2. **Server-side user identification**: Extract userId from verified auth token, not request body
3. **Row-level security (RLS)**: Implement Supabase RLS policies
4. **Audit logging**: Track who made changes and when
5. **Admin role management**: Build an admin panel to manage roles

Example production middleware:

```javascript
async function requireAdmin(req, res, next) {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.replace('Bearer ', '');

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from("users")
            .select("isAdmin")
            .eq("id", user.id)
            .single();

        if (!userData?.isAdmin) {
            return res.status(403).json({ error: "Admin privileges required" });
        }

        req.userId = user.id;
        next();
    } catch (error) {
        res.status(500).json({ error: "Failed to verify admin status" });
    }
}
```

## Testing Admin Features

### Manual Testing Checklist

#### As Admin User (isAdmin = true)

1. **Workout Library Screen**
   - [ ] "Add" button visible in top-right
   - [ ] Clicking "Add" opens workout creation form
   - [ ] Can create a new workout successfully

2. **Workout Detail Screen**
   - [ ] Three-dot menu (⋯) visible in top-right
   - [ ] Menu shows "Edit" and "Delete" options
   - [ ] "Edit" opens pre-filled form
   - [ ] Can save edits successfully
   - [ ] "Delete" shows confirmation dialog
   - [ ] Can delete workout successfully

#### As Regular User (isAdmin = false)

1. **Workout Library Screen**
   - [ ] "Add" button NOT visible
   - [ ] Can still browse all workouts

2. **Workout Detail Screen**
   - [ ] Three-dot menu NOT visible
   - [ ] Can still view workout details
   - [ ] Can still add to personal plan
   - [ ] Can still log workout

### API Testing

Test backend admin enforcement:

```bash
# Get a workout ID
curl http://localhost:3001/api/workouts | jq '.[0].id'

# Test with non-admin userId (should fail with 403)
curl -X PUT http://localhost:3001/api/workouts/WORKOUT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hacked",
    "userId": "NON_ADMIN_USER_ID"
  }'
# Expected: {"error":"Admin privileges required"}

# Test with admin userId (should succeed)
curl -X PUT http://localhost:3001/api/workouts/WORKOUT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "category": "Upper Body - Push",
    "intensity": "weight",
    "userId": "ADMIN_USER_ID"
  }'
# Expected: 200 OK with updated workout data

# Test delete with non-admin (should fail with 403)
curl -X DELETE "http://localhost:3001/api/workouts/WORKOUT_ID?userId=NON_ADMIN_USER_ID"
# Expected: {"error":"Admin privileges required"}
```

## Troubleshooting

### Admin UI not showing

**Problem**: Three-dot menu or "Add" button not visible even though `isAdmin = true`

**Solutions**:

1. **Clear app cache and restart**:
   ```bash
   cd mobile
   # Clear Metro bundler cache
   npx expo start -c
   ```

2. **Verify admin status in database**:
   ```bash
   cd backend
   npx prisma studio
   # Check that isAdmin = true for your user
   ```

3. **Check console logs**:
   - Open React Native debugger
   - Look for errors in `getCurrentUser()` or `getUserProfile()`
   - Verify the user object includes `isAdmin: true`

4. **Restart backend server**:
   ```bash
   cd backend
   npm run dev
   ```

### Backend returns 403 Forbidden

**Problem**: Admin user gets "Admin privileges required" error

**Solutions**:

1. **Check userId is being sent**:
   - Verify mobile app is sending `userId` in request body/query
   - Check network tab in debugger

2. **Verify database value**:
   ```sql
   SELECT id, email, "isAdmin" FROM users WHERE id = 'YOUR_USER_ID';
   ```

3. **Check middleware is receiving userId**:
   - Add console.log in `requireAdmin` middleware
   - Verify `req.body?.userId` or `req.query?.userId` is populated

### Schema sync issues

**Problem**: Prisma client doesn't recognize `isAdmin` field

**Solutions**:

1. **Pull and regenerate**:
   ```bash
   cd backend
   npx prisma db pull
   npx prisma generate
   ```

2. **Restart backend server**:
   ```bash
   npm run dev
   ```

## Session & User ID Management

The admin features depend on proper session management to identify the current user. Here's how the session system works:

### Session Architecture

**Location**: [mobile/src/state/session.ts](../mobile/src/state/session.ts)

The session module manages user identity using two layers:
1. **In-memory cache** (`currentUserIdMemory`) - Fast synchronous access
2. **AsyncStorage** - Persistent storage across app restarts

```typescript
// Synchronous - returns cached value (may be null if not loaded)
getCurrentUserId(): string | null

// Async - ensures userId is loaded from storage if memory is empty
ensureCurrentUserId(): Promise<string | null>

// Async - gets full user profile with isAdmin flag
getCurrentUser(): Promise<User | null>
```

### When to Use Each Function

| Function | Use Case |
|----------|----------|
| `getCurrentUserId()` | Quick checks where null is acceptable (UI hints) |
| `ensureCurrentUserId()` | API calls that require userId (admin operations) |
| `getCurrentUser()` | When you need the full user object including `isAdmin` |

### Session Initialization

The session is initialized in [mobile/src/services/startup.ts](../mobile/src/services/startup.ts):

1. `initApp()` is called on app launch
2. Loads stored userId from AsyncStorage
3. Validates against Supabase auth session
4. Sets both memory and storage in sync

### Common Issues

**Problem**: `getCurrentUserId()` returns null even when logged in

**Cause**: The in-memory cache wasn't populated (race condition or app restart)

**Solution**: Use `ensureCurrentUserId()` for any operation that requires the userId:

```typescript
// Bad - may return null
const userId = getCurrentUserId();

// Good - always loads from storage if needed
const userId = await ensureCurrentUserId();
```

### API Calls Requiring Admin

Admin operations (`updateWorkout`, `deleteWorkout`) must include userId:

```typescript
async deleteWorkout(id: string): Promise<void> {
    const { ensureCurrentUserId } = await import("../state/session");
    const userId = await ensureCurrentUserId();

    if (!userId) {
        throw new Error("User not logged in");
    }

    await this.request<void>(`/workouts/${id}?userId=${userId}`, {
        method: "DELETE",
    });
}
```

## Related Documentation

- [02-design-system.md](02-design-system.md) - UI components and patterns
- [03-component-patterns.md](03-component-patterns.md) - React Native patterns used
- [04-adding-server-request.md](04-adding-server-request.md) - API endpoint patterns
- [08-database-patterns.md](08-database-patterns.md) - Database schema patterns
