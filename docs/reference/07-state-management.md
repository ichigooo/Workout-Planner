# State Management

> How state is managed in the Trainichi mobile app.

---

## Overview

Trainichi uses a **lightweight state management approach**:
- **React Context** for global auth state
- **Local component state** with `useState`
- **Custom service classes** for caching
- **AsyncStorage** for persistence

---

## 1. Authentication Context

The primary global state is authentication, managed via React Context.

```typescript
// File: mobile/src/state/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
```

### Usage

```typescript
import { useAuth } from "@/src/state/AuthContext";

const MyComponent = () => {
    const { user, session, loading } = useAuth();

    if (loading) return <ActivityIndicator />;

    if (!user) {
        return <LoginPrompt />;
    }

    return <Text>Welcome, {user.email}</Text>;
};
```

---

## 2. Session Persistence

User ID is persisted to AsyncStorage for quick access:

```typescript
// File: mobile/src/state/session.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "@trainichi:userId";
const PLAN_ID_KEY = "@trainichi:planId";
const USER_KEY = "@trainichi:user";

let cachedUserId: string | null = null;
let cachedPlanId: string | null = null;
let cachedUser: User | null = null;

// User ID
export async function loadStoredUserId(): Promise<string | null> {
    if (cachedUserId) return cachedUserId;
    cachedUserId = await AsyncStorage.getItem(USER_ID_KEY);
    return cachedUserId;
}

export async function saveUserId(userId: string): Promise<void> {
    cachedUserId = userId;
    await AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearStoredUserId(): Promise<void> {
    cachedUserId = null;
    await AsyncStorage.removeItem(USER_ID_KEY);
}

// Synchronous getter (returns cached value)
export function getCurrentUserId(): string | null {
    return cachedUserId;
}

// Plan ID
export function getCurrentPlanId(): string | null {
    return cachedPlanId;
}

export async function savePlanId(planId: string): Promise<void> {
    cachedPlanId = planId;
    await AsyncStorage.setItem(PLAN_ID_KEY, planId);
}

// User object
export async function getCurrentUser(): Promise<User | null> {
    return cachedUser;
}

export async function saveUser(user: User): Promise<void> {
    cachedUser = user;
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}
```

### Usage

```typescript
import {
    getCurrentUserId,
    getCurrentPlanId,
    saveUserId,
} from "@/src/state/session";

// Synchronous (uses cache)
const userId = getCurrentUserId();
const planId = getCurrentPlanId();

// Async (loads from storage)
const userId = await loadStoredUserId();

// Save
await saveUserId(newUserId);
```

---

## 3. Local Component State

Most screens use local state with hooks:

```typescript
// File: mobile/src/screens/Home.tsx
const Home = () => {
    // Data state
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(todayISO);

    // Modal state
    const [showWarmUpModal, setShowWarmUpModal] = useState(false);

    // User state
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Reload on focus
    useFocusEffect(
        useCallback(() => {
            refreshData();
        }, [])
    );
};
```

---

## 4. Caching Layer

The `PlanItemsCache` service manages data caching:

```typescript
// File: mobile/src/services/planItemsCache.ts
class PlanItemsCache {
    private cache: CacheEntry | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private planId: string | null = null;
    private workoutsCache: Workout[] = [];
    private workoutsCacheTime: number = 0;

    async getCachedItems(): Promise<PlanItem[]> {
        // Check if cache is valid
        if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
            return this.cache.items;
        }

        // Fetch fresh data
        const items = await this.fetchPlanItems();
        this.cache = { items, timestamp: Date.now() };
        return items;
    }

    invalidate(): void {
        this.cache = null;
    }

    async getWorkouts(): Promise<Workout[]> {
        if (
            this.workoutsCache.length > 0 &&
            Date.now() - this.workoutsCacheTime < this.CACHE_TTL
        ) {
            return this.workoutsCache;
        }

        const workouts = await apiService.getWorkouts();
        this.workoutsCache = workouts;
        this.workoutsCacheTime = Date.now();
        return workouts;
    }

    invalidateWorkouts(): void {
        this.workoutsCache = [];
        this.workoutsCacheTime = 0;
    }
}

export const planItemsCache = new PlanItemsCache();
```

### Usage

```typescript
import { planItemsCache } from "@/src/services/planItemsCache";

// Get cached data
const items = await planItemsCache.getCachedItems();
const workouts = await planItemsCache.getWorkouts();

// Invalidate after mutations
await apiService.addWorkoutToPlan(...);
planItemsCache.invalidate();

await apiService.createWorkout(...);
planItemsCache.invalidateWorkouts();
```

---

## 5. State Patterns

### Loading/Error/Data Pattern

```typescript
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
    try {
        setLoading(true);
        setError(null);
        const result = await apiService.fetchData();
        setData(result);
    } catch (err) {
        setError("Failed to load data");
        console.error(err);
    } finally {
        setLoading(false);
    }
};

// In render
if (loading) return <LoadingView />;
if (error) return <ErrorView error={error} />;
if (!data) return <EmptyView />;
return <DataView data={data} />;
```

### Refresh Pattern

```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        planItemsCache.invalidate();
        await loadData();
    } finally {
        setRefreshing(false);
    }
}, []);

<FlatList
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
        />
    }
/>
```

### Focus Refresh Pattern

```typescript
import { useFocusEffect } from "@react-navigation/native";

useFocusEffect(
    useCallback(() => {
        // Runs when screen comes into focus
        refreshData();
    }, [])
);
```

### Modal State Pattern

```typescript
const [showModal, setShowModal] = useState(false);
const [modalData, setModalData] = useState<ModalDataType | null>(null);

const openModal = (data: ModalDataType) => {
    setModalData(data);
    setShowModal(true);
};

const closeModal = () => {
    setShowModal(false);
    setModalData(null);
};

<Modal visible={showModal} onClose={closeModal}>
    {modalData && <ModalContent data={modalData} />}
</Modal>
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      App Launch                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AuthProvider                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Supabase Auth State (user, session, loading)   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   AsyncStorage                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   userId    │ │   planId    │ │    user     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  PlanItemsCache                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  planItems (5min TTL)  |  workouts (5min TTL)   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Component State                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   loading   │ │    data     │ │    error    │       │
│  │  refreshing │ │  selected   │ │  showModal  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## DO's and DON'Ts

### DO

```typescript
// Initialize loading as true for data fetches
const [loading, setLoading] = useState(true);

// Use finally for cleanup
try {
    await fetchData();
} finally {
    setLoading(false);
}

// Invalidate cache after mutations
await apiService.createWorkout(workout);
planItemsCache.invalidateWorkouts();

// Use useFocusEffect for screen refresh
useFocusEffect(useCallback(() => { refresh(); }, []));

// Clean up subscriptions
useEffect(() => {
    const sub = subscribe();
    return () => sub.unsubscribe();
}, []);
```

### DON'T

```typescript
// DON'T mutate state directly
items.push(newItem);  // Bad
setItems([...items, newItem]);  // Good

// DON'T forget error handling
const data = await fetch();  // No try/catch - Bad

// DON'T store derived state
const [filteredItems, setFilteredItems] = useState([]);  // Bad
const filteredItems = useMemo(() => items.filter(...), [items]);  // Good

// DON'T use stale closures
const handleClick = () => {
    // `count` might be stale
    setCount(count + 1);  // Bad
    setCount(c => c + 1);  // Good
};
```

---

## When to Use What

| Scenario | Solution |
|----------|----------|
| User authentication | `AuthContext` |
| Persist user ID | `session.ts` (AsyncStorage) |
| Cache API responses | `PlanItemsCache` |
| Screen-specific data | Local `useState` |
| Form state | Local `useState` |
| Modal visibility | Local `useState` |
| Derived data | `useMemo` |

---

## Related Documentation

- [03-component-patterns.md](./03-component-patterns.md) - Component state patterns
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Full feature example
