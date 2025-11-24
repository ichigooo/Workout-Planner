import { apiService } from "./api";
import { setCurrentUserId, setCurrentPlanId, loadStoredUserId } from "../state/session";
import { planItemsCache } from "./planItemsCache";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export function initApp(): Promise<void> {
    if (isInitialized) {
        // Already fully done
        return Promise.resolve();
    }

    if (initPromise) {
        // Someone else already started, just wait for them
        console.log("[startup] initApp already in progress, reusing promise");
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log("[startup] initApp starting");

            // Step 1: Check for stored user ID
            const userId = await loadStoredUserId();

            if (!userId) {
                throw new Error("No user ID available. User must be logged in.");
            }

            // Set user session
            await setCurrentUserId(userId);
            console.log("[startup] User session established");

            // Step 2: Get/create planId and set it in session (CRITICAL - everything depends on this)
            const planId = await apiService.getWorkoutPlanId(userId);
            setCurrentPlanId(planId);
            console.log("[startup] Plan ID set in session:", planId);

            // Step 3: Initialize cache system (depends on planId being set)
            planItemsCache.initialize(planId);
            console.log("[startup] Cache system initialized");

            // Step 4: Warm up plan items & workouts in parallel
            console.log("[startup] Preloading common app data...");
            await Promise.all([
                planItemsCache.getCachedItems(), // Prefetch calendar/routine data
                planItemsCache.getWorkouts(), // Prefetch workout library
            ]);
            console.log("[startup] Cache preloaded successfully");

            // All initialization complete - app is ready
            console.log("[startup] ✅ App initialization complete - all data preloaded and ready");
            isInitialized = true;
        } catch (e) {
            console.warn("[startup] initApp failed", e);
            // Allow future retries by not setting isInitialized = true
            throw e;
        } finally {
            // Only clear the in-flight promise once the chain settles
            initPromise = null;
        }
    })();

    return initPromise;
}

export default initApp;
