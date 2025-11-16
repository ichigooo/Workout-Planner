import { apiService } from "./api";
import { setCurrentUserId, setCurrentPlanId } from "../state/session";
import { planItemsCache } from "./planItemsCache";

let isInitialized = false;

export async function initApp(): Promise<void> {
    if (isInitialized) {
        console.log("[startup] App already initialized, skipping...");
        return;
    }
    try {
        console.log("[startup] initApp starting");
        // Establish a session user as early as possible (temporary until real auth)
        const TEST_CURRENT_USER_ID = "48a1fd02-b5d4-4942-9356-439ecfbf13f8";
        // Step 1: Set user session
        setCurrentUserId(TEST_CURRENT_USER_ID);
        console.log("[startup] User session established");

        // Step 2: Get/create planId and set it in session (CRITICAL - everything depends on this)
        const planId = await apiService.getWorkoutPlanId(TEST_CURRENT_USER_ID);
        setCurrentPlanId(planId);
        console.log("[startup] Plan ID set in session:", planId);

        // Step 3: Initialize cache system (depends on planId being set)
        planItemsCache.initialize(planId);
        console.log("[startup] Cache system initialized");

        // Step 4: Preload cache data
        await planItemsCache.getCachedItems();
        console.log("[startup] Cache preloaded successfully");

        // Step 5: Preload common app data that multiple screens need
        console.log("[startup] Preloading common app data...");

        // Preload workouts (used by Home, WorkoutLibrary, etc.)
        const workouts = await planItemsCache.getWorkouts();
        console.log("[startup] Workouts preloaded:", workouts.length);

        // Note: Workout plan data is accessed via planItemsCache and direct API calls when needed

        // All initialization complete - app is ready
        console.log("[startup] ✅ App initialization complete - all data preloaded and ready");
        isInitialized = true;
    } catch (e) {
        console.warn("[startup] preload failed", e);
        // Don't set isInitialized = true on error, allow retry
    }
}

export default initApp;
