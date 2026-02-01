# Adding a Server Request (API Endpoint)

> Step-by-step guide to adding a new API endpoint to the Trainichi backend.

---

## Overview

The backend is a single Express.js server at `backend/server.js`. All routes, controllers, and business logic live in this file.

---

## Step 1: Define the Route

Add your route in `backend/server.js` following the existing pattern:

```javascript
// File: backend/server.js

// GET endpoint
app.get("/api/workouts/:id/stats", async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await getWorkoutStats(id);
        res.json(stats);
    } catch (error) {
        console.error("Error fetching workout stats:", error);
        res.status(500).json({ error: "Failed to fetch workout stats" });
    }
});

// POST endpoint
app.post("/api/workouts/:id/log", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, sets, reps, weight } = req.body;

        const log = await createWorkoutLog({ workoutId: id, userId, sets, reps, weight });
        res.status(201).json(log);
    } catch (error) {
        console.error("Error creating workout log:", error);
        res.status(500).json({ error: "Failed to create workout log" });
    }
});

// PUT endpoint
app.put("/api/workouts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const workout = await updateWorkout(id, updates);
        res.json(workout);
    } catch (error) {
        console.error("Error updating workout:", error);
        res.status(500).json({ error: "Failed to update workout" });
    }
});

// DELETE endpoint
app.delete("/api/workouts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await deleteWorkout(id);
        res.status(204).send();  // No content
    } catch (error) {
        console.error("Error deleting workout:", error);
        res.status(500).json({ error: "Failed to delete workout" });
    }
});
```

---

## Step 2: Implement Business Logic

Add your business logic function above the routes:

```javascript
// File: backend/server.js

// Helper function for business logic
async function getWorkoutStats(workoutId) {
    // Query the database using Supabase client
    const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("workoutId", workoutId);

    if (error) throw error;

    // Process and return stats
    const totalSets = data.reduce((sum, log) => sum + (log.sets || 0), 0);
    const totalReps = data.reduce((sum, log) => sum + (log.reps || 0), 0);

    return {
        totalLogs: data.length,
        totalSets,
        totalReps,
        averageSets: data.length ? totalSets / data.length : 0,
    };
}
```

---

## Step 3: Add Mobile API Method

Add the corresponding method in `mobile/src/services/api.ts`:

```typescript
// File: mobile/src/services/api.ts

interface WorkoutStats {
    totalLogs: number;
    totalSets: number;
    totalReps: number;
    averageSets: number;
}

class ApiService {
    // ... existing methods ...

    async getWorkoutStats(workoutId: string): Promise<WorkoutStats> {
        return this.request<WorkoutStats>(
            `/workouts/${encodeURIComponent(workoutId)}/stats`
        );
    }

    async logWorkout(
        workoutId: string,
        data: { userId: string; sets?: number; reps?: number; weight?: number }
    ): Promise<WorkoutLog> {
        return this.request<WorkoutLog>(
            `/workouts/${encodeURIComponent(workoutId)}/log`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
    }
}
```

---

## Step 4: Add TypeScript Types

Add any new types to `mobile/src/types/index.ts`:

```typescript
// File: mobile/src/types/index.ts

export interface WorkoutStats {
    totalLogs: number;
    totalSets: number;
    totalReps: number;
    averageSets: number;
}

export interface CreateWorkoutLogRequest {
    userId: string;
    sets?: number;
    reps?: number;
    weight?: number;
    duration?: number;
    notes?: string;
}
```

---

## Step 5: Use in Component

Call the API from your React component:

```typescript
// File: mobile/src/components/WorkoutStats.tsx
import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { WorkoutStats } from "../types";

const WorkoutStatsComponent = ({ workoutId }: { workoutId: string }) => {
    const [stats, setStats] = useState<WorkoutStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await apiService.getWorkoutStats(workoutId);
                setStats(data);
            } catch (err) {
                console.error("Failed to load stats:", err);
                setError("Failed to load stats");
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [workoutId]);

    if (loading) return <ActivityIndicator />;
    if (error) return <Text>{error}</Text>;

    return (
        <View>
            <Text>Total Logs: {stats?.totalLogs}</Text>
            <Text>Total Sets: {stats?.totalSets}</Text>
        </View>
    );
};
```

---

## Route Patterns

### URL Structure

```
/api/{resource}                    # Collection
/api/{resource}/:id                # Single item
/api/{resource}/:id/{sub-resource} # Nested resource
/api/users/:userId/{resource}      # User-scoped resource
```

### Examples from Codebase

```javascript
// Workouts
GET    /api/workouts                    // List all
POST   /api/workouts                    // Create
GET    /api/workouts/:id                // Get one
PUT    /api/workouts/:id                // Update
DELETE /api/workouts/:id                // Delete

// User-scoped
GET    /api/users/:userId/workout-plan-id    // Get user's plan ID
GET    /api/users/:userId/workout-imports    // Get user's imports

// Nested resources
GET    /api/workout-plans/:id/plan-items     // Get plan items
POST   /api/workout-plans/:id/plan-items     // Add item to plan

// Actions
POST   /api/workout-imports/youtube          // Import from YouTube
POST   /api/users/:id/default-plan           // Create default plan
```

---

## Response Formats

### Success (200/201)

```javascript
// Single item
res.json({ id: "...", title: "...", ... });

// Collection
res.json([{ id: "..." }, { id: "..." }]);

// Created (201)
res.status(201).json({ id: "...", ... });
```

### No Content (204)

```javascript
// Delete operations
res.status(204).send();
```

### Error (4xx/5xx)

```javascript
// Client error
res.status(400).json({ error: "Invalid request", details: "..." });

// Not found
res.status(404).json({ error: "Workout not found" });

// Conflict
res.status(409).json({ error: "Plan already exists" });

// Server error
res.status(500).json({ error: "Failed to process request", details: error.message });
```

---

## DO's and DON'Ts

### DO

```javascript
// Always wrap in try/catch
app.get("/api/example", async (req, res) => {
    try {
        // ...
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "..." });
    }
});

// Validate required parameters
const { userId } = req.body;
if (!userId) {
    return res.status(400).json({ error: "userId is required" });
}

// Use encodeURIComponent for URL params in mobile
`/workouts/${encodeURIComponent(workoutId)}/stats`

// Return consistent response format
res.json({ data, meta: { count: data.length } });

// Log errors with context
console.error(`Error fetching workout ${id}:`, error);
```

### DON'T

```javascript
// DON'T put business logic directly in routes
app.get("/api/stats", async (req, res) => {
    // 50 lines of complex logic...  // Bad
});

// DON'T forget error handling
app.get("/api/data", async (req, res) => {
    const data = await fetch();  // No try/catch - Bad
    res.json(data);
});

// DON'T expose sensitive error details in production
res.status(500).json({ error: error.stack });  // Bad

// DON'T use synchronous operations
const data = fs.readFileSync(...);  // Bad - blocks event loop
```

---

## Checklist

When adding a new endpoint:

- [ ] Add route in `backend/server.js`
- [ ] Implement business logic function
- [ ] Add error handling with try/catch
- [ ] Validate required parameters
- [ ] Add TypeScript types in `mobile/src/types/index.ts`
- [ ] Add API method in `mobile/src/services/api.ts`
- [ ] Test with curl or Postman
- [ ] Update cache invalidation if needed
- [ ] Write tests (see [09-testing-guidelines.md](./09-testing-guidelines.md))

---

## Testing Locally

```bash
# Start the server
cd backend
npm run dev

# Test with curl
curl http://localhost:3000/api/workouts

# Test POST
curl -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "category": "Legs"}'
```

---

## Related Documentation

- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Using the API in mobile
- [08-database-patterns.md](./08-database-patterns.md) - Database queries
- [09-testing-guidelines.md](./09-testing-guidelines.md) - Testing requirements
