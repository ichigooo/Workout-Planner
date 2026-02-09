# Common Tasks

> Quick reference for frequent development tasks in Trainichi.

---

## Quick Commands

```bash
# Start development
cd mobile && npm start          # Expo dev server
cd backend && npm run dev       # Backend server

# Run on devices
npm run ios                     # iOS simulator
npm run android                 # Android emulator

# Testing
cd mobile && npm test           # Mobile tests
cd backend && npm test          # Backend tests

# Database
cd backend && npx prisma studio # Visual DB browser
npx prisma migrate dev          # Run migrations
```

---

## Switch Between Dev and Production

### Running Against Local Dev Database

**Setup:**

1. **Update backend environment** (`backend/.env`):
   - Point `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` to your dev Supabase database

2. **Update mobile environment** (`mobile/.env`):
   ```env
   EXPO_PUBLIC_USE_CLOUD="false"
   EXPO_PUBLIC_SUPABASE_URL="https://YOUR-DEV-PROJECT.supabase.co"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your-dev-anon-key"
   ```

3. **Update local IP** (`mobile/src/utils/getlocalIP.ts`):
   ```bash
   # Get your current IP
   ipconfig getifaddr en0

   # Update CURRENT_IP in getlocalIP.ts to match
   ```

**Start:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Mobile
cd mobile
npx expo start --dev-client --host tunnel
```

### Running Against Production Database

**Setup:**

1. **Backend environment** (`backend/.env`):
   - Point to prod Supabase database

2. **Mobile environment** (`mobile/.env`):
   ```env
   EXPO_PUBLIC_USE_CLOUD="true"
   EXPO_PUBLIC_API_BASE_URL="https://workoutplannerservice-fhg2t5u6w-nanas-projects-294a362f.vercel.app/api"
   EXPO_PUBLIC_SUPABASE_URL="https://fhihhkkcauotipxqqpii.supabase.co"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your-prod-anon-key"
   ```

**Start:**
```bash
# Only need mobile - uses deployed backend
cd mobile
npx expo start --dev-client --host tunnel
```

**Quick Reference:**

| Mode | `EXPO_PUBLIC_USE_CLOUD` | Backend | Database |
|------|------------------------|---------|----------|
| **Local Dev** | `"false"` | Local (`npm run dev`) | Dev Supabase |
| **Prod** | `"true"` | Vercel (deployed) | Prod Supabase |

**Note:** Restart Expo dev server after changing `.env` values.

---

## Add a New Screen

1. **Create the file** in `app/`:
   ```
   mobile/app/my-screen.tsx
   ```

2. **Basic template**:
   ```typescript
   import { View, Text, StyleSheet } from "react-native";
   import { SafeAreaView } from "react-native-safe-area-context";
   import { useRouter } from "expo-router";
   import { getTheme, spacing, typography } from "@/src/theme";

   export default function MyScreen() {
       const router = useRouter();
       const theme = getTheme("light");

       return (
           <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
               <Text style={{ color: theme.colors.text }}>My Screen</Text>
           </SafeAreaView>
       );
   }

   const styles = StyleSheet.create({
       container: { flex: 1 },
   });
   ```

3. **Add to Stack** (optional, for custom options):
   ```typescript
   // app/_layout.tsx
   <Stack.Screen name="my-screen" options={{ headerShown: false }} />
   ```

---

## Add a New API Endpoint

1. **Add route** in `backend/server.js`:
   ```javascript
   // GET endpoint
   app.get("/api/my-endpoint", async (req, res) => {
       try {
           const { data, error } = await supabase
               .from("my_table")
               .select("*");
           if (error) throw error;
           res.json(data);
       } catch (err) {
           res.status(500).json({ error: err.message });
       }
   });

   // POST endpoint
   app.post("/api/my-endpoint", async (req, res) => {
       try {
           const { field1, field2 } = req.body;
           const { data, error } = await supabase
               .from("my_table")
               .insert({ field1, field2 })
               .select()
               .single();
           if (error) throw error;
           res.status(201).json(data);
       } catch (err) {
           res.status(500).json({ error: err.message });
       }
   });
   ```

2. **Add mobile API method** in `mobile/src/services/api.ts`:
   ```typescript
   async getMyData(): Promise<MyType[]> {
       return this.request<MyType[]>("/my-endpoint");
   }

   async createMyData(data: CreateMyType): Promise<MyType> {
       return this.request<MyType>("/my-endpoint", {
           method: "POST",
           body: JSON.stringify(data),
       });
   }
   ```

3. **Add types** in `mobile/src/types/index.ts`:
   ```typescript
   export interface MyType {
       id: string;
       field1: string;
       field2: number;
   }
   ```

---

## Add a New Database Table

1. **Update Prisma schema**:
   ```prisma
   // backend/prisma/schema.prisma
   model MyTable {
       id        String   @id @default(uuid())
       field1    String
       field2    Int?
       createdAt DateTime @default(now())
       updatedAt DateTime @updatedAt
   }
   ```

2. **Run migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_my_table
   ```

3. **Deploy to production**:
   ```bash
   npx prisma migrate deploy
   ```

---

## Add a New Component

1. **Create file** in `src/components/`:
   ```
   mobile/src/components/MyComponent.tsx
   ```

2. **Component template**:
   ```typescript
   import React from "react";
   import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
   import { getTheme, spacing, radii, typography } from "@/src/theme";

   interface MyComponentProps {
       title: string;
       onPress: () => void;
   }

   export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
       const theme = getTheme("light");

       return (
           <TouchableOpacity
               style={[styles.container, { backgroundColor: theme.colors.surface }]}
               onPress={onPress}
               activeOpacity={0.85}
           >
               <Text style={[styles.title, { color: theme.colors.text }]}>
                   {title}
               </Text>
           </TouchableOpacity>
       );
   };

   const styles = StyleSheet.create({
       container: {
           padding: spacing.md,
           borderRadius: radii.lg,
       },
       title: {
           fontFamily: typography.fonts.bodyMedium,
           fontSize: typography.sizes.md,
       },
   });
   ```

---

## Fetch Data with Loading States

```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);
        const result = await apiService.getData();
        setData(result);
    } catch (err) {
        setError("Failed to load data");
        console.error(err);
    } finally {
        setLoading(false);
    }
}, []);

useEffect(() => {
    loadData();
}, [loadData]);

// Render
if (loading) return <ActivityIndicator />;
if (error) return <Text>{error}</Text>;
return <DataList data={data} />;
```

---

## Add Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await loadData();
    } finally {
        setRefreshing(false);
    }
}, [loadData]);

<FlatList
    data={items}
    renderItem={renderItem}
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.accent]}
        />
    }
/>
```

---

## Navigate Between Screens

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

// Push (with back button)
router.push("/my-screen");

// With params
router.push(`/workout-detail?id=${workout.id}`);

// Replace (no back)
router.replace("/(tabs)");

// Go back
router.back();

// Dynamic route
router.push({
    pathname: "/plan/[id]",
    params: { id: plan.id },
});
```

---

## Get Route Parameters

```typescript
import { useLocalSearchParams } from "expo-router";

const { id, data } = useLocalSearchParams<{
    id: string;
    data?: string;
}>();

// Parse JSON data
const parsedData = data ? JSON.parse(decodeURIComponent(data)) : null;
```

---

## Use Theme Colors

```typescript
import { getTheme, spacing, radii, typography } from "@/src/theme";

const theme = getTheme("light");

// In styles
<View style={{ backgroundColor: theme.colors.bg }}>
    <Text style={{ color: theme.colors.text }}>Hello</Text>
</View>

// Common colors
theme.colors.bg        // Background
theme.colors.surface   // Cards
theme.colors.text      // Primary text
theme.colors.subtext   // Secondary text
theme.colors.accent    // Buttons, links
theme.colors.border    // Borders
theme.colors.danger    // Errors
```

---

## Add a Modal

```typescript
const [showModal, setShowModal] = useState(false);

<Modal
    visible={showModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowModal(false)}
>
    <View style={styles.overlay}>
        <View style={styles.modalContent}>
            <Text>Modal Content</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text>Close</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>
```

---

## Show an Alert

```typescript
import { Alert } from "react-native";

// Simple alert
Alert.alert("Title", "Message");

// With actions
Alert.alert(
    "Confirm Delete",
    "Are you sure?",
    [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
    ]
);
```

---

## Get Current User

```typescript
import { useAuth } from "@/src/state/AuthContext";
import { getCurrentUserId, getCurrentPlanId } from "@/src/state/session";

// From context
const { user, session, loading } = useAuth();

// From session (synchronous)
const userId = getCurrentUserId();
const planId = getCurrentPlanId();
```

---

## Invalidate Cache After Mutations

```typescript
import { planItemsCache } from "@/src/services/planItemsCache";

// After creating/updating plan items
await apiService.addWorkoutToPlan(...);
planItemsCache.invalidate();

// After creating/updating workouts
await apiService.createWorkout(...);
planItemsCache.invalidateWorkouts();
```

---

## Common Supabase Queries

```javascript
// Select all
const { data } = await supabase.from("workouts").select("*");

// Select with filter
const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("category", "Legs");

// Select single
const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .single();

// Insert
const { data } = await supabase
    .from("workouts")
    .insert({ title, category })
    .select()
    .single();

// Update
const { data } = await supabase
    .from("workouts")
    .update({ title: "New Title" })
    .eq("id", workoutId)
    .select()
    .single();

// Delete
await supabase.from("workouts").delete().eq("id", workoutId);

// With relations
const { data } = await supabase
    .from("plan_items")
    .select("*, workout:workouts(*)");
```

---

## Debug Tips

```typescript
// Log API responses
console.log("API Response:", JSON.stringify(data, null, 2));

// Check network requests
// In Expo, shake device → "Debug JS Remotely"

// View Supabase data
cd backend && npx prisma studio

// Check current route
import { usePathname } from "expo-router";
const pathname = usePathname();
console.log("Current route:", pathname);
```

---

## File Locations Quick Reference

| Task | Location |
|------|----------|
| New screen | `mobile/app/` |
| New component | `mobile/src/components/` |
| New API method | `mobile/src/services/api.ts` |
| New type | `mobile/src/types/index.ts` |
| New endpoint | `backend/server.js` |
| Theme changes | `mobile/src/theme.ts` |
| DB schema | `backend/prisma/schema.prisma` |

---

## Related Documentation

- [04-adding-server-request.md](./04-adding-server-request.md) - Full API guide
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Full feature guide
- [08-database-patterns.md](./08-database-patterns.md) - Database queries
