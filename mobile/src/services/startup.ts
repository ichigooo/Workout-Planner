import { apiService } from "./api";
import { setCurrentUserId } from "../state/session";

export async function initApp(): Promise<void> {
    try {
        console.log("[startup] initApp starting");
        // Establish a session user as early as possible (temporary until real auth)
        const TEST_CURRENT_USER_ID = "48a1fd02-b5d4-4942-9356-439ecfbf13f8";
        setCurrentUserId(TEST_CURRENT_USER_ID);
        const plans = await apiService.getWorkoutPlans();
        if (plans && plans.length > 0) {
            const planId = plans[0].id;
            await apiService.fetchAndCachePlanItems(planId);
            console.log("[startup] Preloaded plan items for", planId);
        } else {
            console.log("[startup] no plans to preload");
        }
    } catch (e) {
        console.warn("[startup] preload failed", e);
    }
}

export default initApp;
