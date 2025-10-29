import { apiService } from "./api";

export async function initApp(): Promise<void> {
    try {
        console.log("[startup] initApp starting");
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
