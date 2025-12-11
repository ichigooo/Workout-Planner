import { apiService } from "./api";
import {
    setCurrentUserId,
    setCurrentPlanId,
    loadStoredUserId,
    clearCurrentUserId,
} from "../state/session";
import { planItemsCache } from "./planItemsCache";
import { supabase } from "../lib/supabase";

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

            // Step 1: Check for stored user ID and active Supabase session
            const storedUserId = await loadStoredUserId();
            const { data: authData, error: authError } = await supabase.auth.getUser();
            const authUser = authError ? null : (authData?.user ?? null);

            if (!authUser) {
                // No authenticated session; ensure local storage is clear and bail quietly.
                if (storedUserId) {
                    console.log(
                        "[startup] Stored user found but Supabase session missing. Clearing stored id.",
                    );
                    await clearCurrentUserId();
                } else {
                    console.log("[startup] No logged-in user; skipping initialization.");
                }
                return;
            }

            const userId = storedUserId || authUser.id;
            if (!storedUserId || storedUserId !== authUser.id) {
                // Keep storage in sync with Supabase session
                await setCurrentUserId(authUser.id);
            }
            console.log("[startup] User session established for", userId);

            // Ensure backend profile exists; fixes cases where sign-up never hit our POST /users
            await ensureBackendUserProfile(authUser);

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

async function ensureBackendUserProfile(
    authUser: { id: string; email?: string | null; user_metadata?: Record<string, any> } | null,
) {
    if (!authUser || !authUser.email) {
        console.warn("[startup] Cannot ensure backend profile without auth user/email");
        return;
    }
    try {
        await apiService.createUserIfNeeded({
            id: authUser.id,
            email: authUser.email,
            name:
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                authUser.user_metadata?.display_name ||
                null,
        });
    } catch (err) {
        console.warn("[startup] Failed to ensure backend user profile:", err);
    }
}
