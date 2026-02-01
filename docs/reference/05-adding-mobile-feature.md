# Adding a Mobile Feature

> Step-by-step guide to adding a new feature to the Trainichi mobile app.

---

## Overview

This guide walks through adding a complete feature, from screen to API integration.

---

## Example: Adding a "Workout History" Feature

We'll add a feature to view workout history for a user.

---

## Step 1: Add TypeScript Types

First, define any new types:

```typescript
// File: mobile/src/types/index.ts

export interface WorkoutHistoryEntry {
    id: string;
    workoutId: string;
    workout: Workout;
    completedAt: string;
    duration?: number;
    notes?: string;
}
```

---

## Step 2: Add API Method

Add the API call to fetch data:

```typescript
// File: mobile/src/services/api.ts

async getWorkoutHistory(userId: string): Promise<WorkoutHistoryEntry[]> {
    return this.request<WorkoutHistoryEntry[]>(
        `/users/${encodeURIComponent(userId)}/workout-history`
    );
}
```

---

## Step 3: Create the Screen

Create a new screen file:

```typescript
// File: mobile/app/workout-history.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { getCurrentUserId } from "@/src/state/session";
import { WorkoutHistoryEntry } from "@/src/types";

export default function WorkoutHistoryScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                setError("Please sign in to view history");
                return;
            }
            const data = await apiService.getWorkoutHistory(userId);
            setHistory(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load workout history:", err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const renderItem = ({ item }: { item: WorkoutHistoryEntry }) => (
        <TouchableOpacity
            style={[
                styles.historyItem,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                },
            ]}
            onPress={() =>
                router.push(`/workout-detail?id=${encodeURIComponent(item.workoutId)}`)
            }
            activeOpacity={0.85}
        >
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                    {item.workout.title}
                </Text>
                <Text style={[styles.itemDate, { color: theme.colors.subtext }]}>
                    {new Date(item.completedAt).toLocaleDateString()}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.bg }]}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Workout History
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            {error ? (
                <View style={styles.centered}>
                    <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                        {error}
                    </Text>
                    <TouchableOpacity onPress={loadHistory} style={styles.retryButton}>
                        <Text style={[styles.retryText, { color: theme.colors.accent }]}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="fitness" size={48} color={theme.colors.subtext} />
                    <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
                        No workout history yet
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.accent]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    headerTitle: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
    },
    list: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
        marginBottom: spacing.xxs,
    },
    itemDate: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
    },
    emptyText: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.md,
        marginTop: spacing.md,
    },
    errorText: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.md,
    },
    retryButton: {
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    retryText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
    },
});
```

---

## Step 4: Register the Route

Expo Router uses file-based routing, so creating the file at `app/workout-history.tsx` automatically registers the route.

Add to the Stack in `app/_layout.tsx` if you need custom options:

```typescript
// File: mobile/app/_layout.tsx
<Stack.Screen
    name="workout-history"
    options={{ headerShown: false, gestureEnabled: true }}
/>
```

---

## Step 5: Add Navigation Link

Add a way to navigate to the new screen:

```typescript
// In UserProfile.tsx or wherever appropriate
import { useRouter } from "expo-router";

const router = useRouter();

<TouchableOpacity onPress={() => router.push("/workout-history")}>
    <Text>View History</Text>
</TouchableOpacity>
```

---

## Step 6: Add Component (if reusable)

If you need a reusable component, create it in `src/components/`:

```typescript
// File: mobile/src/components/HistoryListItem.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// ... component code
```

---

## Feature Checklist

### Before Starting
- [ ] Understand what data you need
- [ ] Check if backend endpoint exists (or create one - see [04-adding-server-request.md](./04-adding-server-request.md))
- [ ] Design the UI (match existing patterns)

### Implementation
- [ ] Add TypeScript types in `src/types/index.ts`
- [ ] Add API method in `src/services/api.ts`
- [ ] Create screen in `app/`
- [ ] Use theme tokens (no hardcoded colors)
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Handle empty state
- [ ] Add pull-to-refresh (if applicable)
- [ ] Use `SafeAreaView` for edge-to-edge screens

### Polish
- [ ] Add navigation link from other screens
- [ ] Test on iOS and Android
- [ ] Test dark mode (if supported)
- [ ] Write tests (see [09-testing-guidelines.md](./09-testing-guidelines.md))

---

## Common Patterns

### Loading → Data → Error Flow

```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
    try {
        setLoading(true);
        setError(null);
        const result = await apiService.getData();
        setData(result);
    } catch (err) {
        setError("Failed to load data");
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    loadData();
}, []);
```

### Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
};

<FlatList
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.accent]}
        />
    }
/>
```

### Conditional Rendering

```typescript
if (loading) return <LoadingView />;
if (error) return <ErrorView error={error} onRetry={loadData} />;
if (data.length === 0) return <EmptyView />;
return <DataView data={data} />;
```

---

## Decision Tree: Where Does It Go?

```
New feature needs...
│
├── A new screen/page?
│   └── Create file in mobile/app/
│
├── A reusable UI component?
│   └── Create in mobile/src/components/
│
├── A full-page screen container?
│   └── Create in mobile/src/screens/
│
├── New API calls?
│   └── Add to mobile/src/services/api.ts
│
├── New data types?
│   └── Add to mobile/src/types/index.ts
│
├── Backend changes?
│   └── See 04-adding-server-request.md
│
└── Database changes?
    └── See 08-database-patterns.md
```

---

## Related Documentation

- [03-component-patterns.md](./03-component-patterns.md) - Component conventions
- [04-adding-server-request.md](./04-adding-server-request.md) - Backend changes
- [06-navigation-routing.md](./06-navigation-routing.md) - Navigation patterns
- [07-state-management.md](./07-state-management.md) - State patterns
