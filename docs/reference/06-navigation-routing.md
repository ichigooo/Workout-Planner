# Navigation & Routing

> How navigation works in Trainichi using Expo Router.

---

## Overview

Trainichi uses **Expo Router v4** for file-based routing. The file structure in `app/` directly maps to URL routes.

---

## Route Structure

```
app/
├── _layout.tsx              # Root layout (wraps everything)
├── index.tsx                # "/" - Landing screen
├── (tabs)/                  # Tab navigation group
│   ├── _layout.tsx          # Tab bar configuration
│   ├── index.tsx            # "/tabs" → Home tab
│   ├── library.tsx          # "/tabs/library" → Library tab
│   ├── calendar.tsx         # "/tabs/calendar" → Calendar (hidden)
│   └── plan.tsx             # "/tabs/plan" → Plan tab
├── (auth)/                  # Auth group
│   ├── sign-in.tsx          # "/auth/sign-in"
│   ├── sign-up.tsx          # "/auth/sign-up"
│   └── forgot-password.tsx  # "/auth/forgot-password"
├── workout.tsx              # "/workout" - Workout library
├── workout-detail.tsx       # "/workout-detail?id=xxx"
├── profile.tsx              # "/profile"
├── import-workout.tsx       # "/import-workout"
├── import-workout/
│   └── custom.tsx           # "/import-workout/custom"
├── plan/
│   └── [id].tsx             # "/plan/xxx" - Dynamic route
├── workout-session.tsx      # "/workout-session?workoutIds=xxx"
├── workout-summary.tsx      # "/workout-summary"
├── modal.tsx                # "/modal" - Modal presentation
└── +not-found.tsx           # 404 page
```

---

## File Naming Conventions

| Pattern | Example | URL |
|---------|---------|-----|
| Regular file | `profile.tsx` | `/profile` |
| Index file | `index.tsx` | `/` (root of folder) |
| Dynamic route | `[id].tsx` | `/plan/123` |
| Grouped routes | `(tabs)/` | Groups without URL segment |
| Layout file | `_layout.tsx` | Wraps children |

---

## Root Layout

The root `_layout.tsx` sets up:
- Authentication context
- Theme provider
- Font loading
- Global stack navigation

```typescript
// File: mobile/app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "@/src/state/AuthContext";

export default function RootLayout() {
    const [loaded] = useFonts({
        DMSans_400Regular,
        Fraunces_600SemiBold,
        // ...
    });

    if (!loaded) return null;

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

function RootLayoutNav() {
    return (
        <ThemeProvider value={CustomDefaultTheme}>
            <Stack
                screenOptions={{
                    gestureEnabled: true,
                    animation: "slide_from_right",
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="workout" options={{ headerShown: false }} />
                <Stack.Screen name="workout-detail" options={{ headerShown: false }} />
                {/* ... more screens */}
            </Stack>
        </ThemeProvider>
    );
}
```

---

## Tab Navigation

The tabs layout configures the bottom tab bar:

```typescript
// File: mobile/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getTheme } from "@/src/theme";

export default function TabLayout() {
    const theme = getTheme("light");

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.accent,
                tabBarInactiveTintColor: theme.colors.subtext,
                tabBarStyle: {
                    backgroundColor: theme.colors.bg,
                    borderTopColor: theme.colors.border,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "Routine",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: "Plan",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="barbell-outline" size={size} color={color} />
                    ),
                }}
            />
            {/* Hidden tab - accessible via router.push() */}
            <Tabs.Screen
                name="calendar"
                options={{
                    href: null,  // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
```

---

## Navigation Methods

### Using `useRouter`

```typescript
import { useRouter } from "expo-router";

const MyComponent = () => {
    const router = useRouter();

    // Navigate forward
    router.push("/workout");

    // Navigate with params
    router.push(`/workout-detail?id=${workoutId}`);

    // Navigate with object
    router.push({
        pathname: "/plan/[id]",
        params: { id: planId, data: JSON.stringify(planData) },
    });

    // Replace current screen (no back)
    router.replace("/(tabs)");

    // Go back
    router.back();

    // Navigate to specific tab
    router.push("/(tabs)/library");
};
```

### Using `Link` Component

```typescript
import { Link } from "expo-router";

<Link href="/profile">
    <Text>Go to Profile</Text>
</Link>

<Link href={`/workout-detail?id=${workout.id}`} asChild>
    <TouchableOpacity>
        <Text>{workout.title}</Text>
    </TouchableOpacity>
</Link>
```

---

## Dynamic Routes

Dynamic routes use brackets `[param]`:

```typescript
// File: mobile/app/plan/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function PlanDetailScreen() {
    const { id, data } = useLocalSearchParams<{
        id: string;
        data?: string;
    }>();

    // id = "123" from /plan/123
    // data = optional JSON string

    const template = data ? JSON.parse(decodeURIComponent(data)) : null;

    return <View>...</View>;
}
```

### Navigating to Dynamic Routes

```typescript
// Simple ID
router.push(`/plan/${planId}`);

// With additional data
router.push({
    pathname: "/plan/[id]",
    params: {
        id: plan.id,
        data: encodeURIComponent(JSON.stringify(plan)),
    },
});
```

---

## Screen Options

### Per-Screen Options

```typescript
// In _layout.tsx
<Stack.Screen
    name="workout-detail"
    options={{
        headerShown: false,       // Hide header
        gestureEnabled: true,     // Enable swipe back
        animation: "slide_from_bottom",  // Custom animation
        presentation: "modal",    // Modal presentation
    }}
/>
```

### Export from Screen

```typescript
// File: mobile/app/workout-detail.tsx
export const options = {
    headerShown: false,
    gestureEnabled: true,
};

export default function WorkoutDetailScreen() {
    // ...
}
```

---

## Common Patterns

### Check Auth Before Navigation

```typescript
import { useAuth } from "@/src/state/AuthContext";

const MyComponent = () => {
    const { user } = useAuth();
    const router = useRouter();

    const handleProtectedAction = () => {
        if (!user) {
            router.push("/(auth)/sign-in");
            return;
        }
        router.push("/profile");
    };
};
```

### Navigate After Action

```typescript
const handleSave = async () => {
    try {
        await apiService.saveData(data);
        router.back();  // Go back after success
        // OR
        router.replace("/(tabs)");  // Replace to prevent back
    } catch (error) {
        Alert.alert("Error", "Failed to save");
    }
};
```

### Navigate with Callback

```typescript
// From PlanSetupModal.tsx
const handlePlanCreated = () => {
    setShowSetup(false);
    router.push("/calendar");  // Navigate to calendar after plan created
};
```

---

## Route Groups

Groups with `()` don't add URL segments:

```
(tabs)/index.tsx    → /(tabs)    (but displays as Home tab)
(auth)/sign-in.tsx  → /(auth)/sign-in
```

Use groups to:
- Organize related screens
- Apply shared layouts
- Separate authentication flows

---

## DO's and DON'Ts

### DO

```typescript
// Use encodeURIComponent for dynamic params
router.push(`/workout-detail?id=${encodeURIComponent(workout.id)}`);

// Use router.replace() when you don't want back navigation
router.replace("/(tabs)");

// Type your params
const { id } = useLocalSearchParams<{ id: string }>();

// Handle missing params gracefully
if (!params.id) {
    router.back();
    return;
}
```

### DON'T

```typescript
// DON'T use raw IDs without encoding
router.push(`/workout-detail?id=${workout.id}`);  // May break with special chars

// DON'T forget to handle navigation errors
router.push("/nonexistent-route");  // Will show 404

// DON'T use push when you should replace
// After login, use replace so user can't go "back" to login
router.push("/(tabs)");  // Bad - can go back to login
router.replace("/(tabs)");  // Good - replaces login screen
```

---

## Navigation Flow

```
Landing (index.tsx)
    │
    ├── "Begin" → /(tabs) [replace]
    │
    └── Not logged in → /(auth)/sign-in
                            │
                            └── After login → /(tabs) [replace]

/(tabs)
    ├── Home → /workout-detail?id=xxx [push]
    │              └── Back → Home
    │
    ├── Library → /workout?category=xxx [push]
    │              └── Back → Library
    │
    ├── Plan → /plan/[id] [push]
    │              └── Back → Plan
    │
    └── Home → /workout-session?workoutIds=... [push]
                    │
                    ├── Warmup → Exercise slides → Rest timers
                    │
                    └── All done → /workout-summary [replace]
                                        └── "Done" → /(tabs) [replace]
```

### Workout Session Screen Options

```typescript
// Slides up from bottom, no swipe-back gesture
<Stack.Screen
    name="workout-session"
    options={{
        headerShown: false,
        gestureEnabled: false,       // Prevent accidental swipe-back
        animation: "slide_from_bottom",
    }}
/>

// Summary fades in, also no swipe-back
<Stack.Screen
    name="workout-summary"
    options={{
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
    }}
/>
```

---

## Related Documentation

- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Creating new screens
- [10-page-inventory.md](./10-page-inventory.md) - All screens listed
