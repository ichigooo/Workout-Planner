import {
    Workout,
    WorkoutPlan,
    PlanItem,
    User,
    CreateWorkoutRequest,
    CreateWorkoutPlanRequest,
    CreatePlanItemRequest,
    UpdateUserProfileRequest,
} from "../types";

import { API_BASE_URL } from "../constants";

// Log which API base the app is using (helps confirm local vs cloud)
console.log("[api] API_BASE_URL=", API_BASE_URL);

class ApiService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        // Log each request for debugging (Metro/console)
        console.log(`[REQUEST][api] ${options?.method ?? "GET"} ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        // Handle empty responses (like 204 No Content)
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return undefined as T;
        }

        return response.json();
    }

    // Workout endpoints
    async getWorkouts(): Promise<Workout[]> {
        return this.request<Workout[]>("/workouts");
    }

    async createWorkout(workout: CreateWorkoutRequest): Promise<Workout> {
        return this.request<Workout>("/workouts", {
            method: "POST",
            body: JSON.stringify(workout),
        });
    }

    async getWorkout(id: string): Promise<Workout> {
        return this.request<Workout>(`/workouts/${id}`);
    }

    async updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout> {
        return this.request<Workout>(`/workouts/${id}`, {
            method: "PUT",
            body: JSON.stringify(workout),
        });
    }

    async deleteWorkout(id: string): Promise<void> {
        return this.request<void>(`/workouts/${id}`, {
            method: "DELETE",
        });
    }

    // Workout Plan endpoints
    async getWorkoutPlans(): Promise<WorkoutPlan[]> {
        return this.request<WorkoutPlan[]>("/workout-plans");
    }

    async createWorkoutPlan(plan: CreateWorkoutPlanRequest): Promise<WorkoutPlan> {
        return this.request<WorkoutPlan>("/workout-plans", {
            method: "POST",
            body: JSON.stringify(plan),
        });
    }

    async addWorkoutToPlan(planId: string, planItem: CreatePlanItemRequest): Promise<PlanItem> {
        return this.request<PlanItem>(`/workout-plans/${planId}/plan-items`, {
            method: "POST",
            body: JSON.stringify(planItem),
        });
    }

    /**
     * Add a single dated occurrence of a workout to a plan.
     * payload: { workoutId, date: 'YYYY-MM-DD', intensity? }
     */
    async addWorkoutToPlanOnDate(
        planId: string,
        payload: { workoutId: string; date: string; intensity?: string },
    ): Promise<PlanItem> {
        const res = await this.request<PlanItem>(`/workout-plans/${planId}/plan-items/date`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        // update cache for this plan
        this._planItemsCache[planId] = (this._planItemsCache[planId] || []).concat([res]);
        return res;
    }

    /**
     * Add a workout to a plan for multiple dates in one request.
     * payload: { workoutId, dates: ['YYYY-MM-DD', ...], intensity? }
     */
    async addWorkoutToPlanOnDates(
        planId: string,
        payload: { workoutId: string; dates: string[]; intensity?: string },
    ): Promise<PlanItem[] | PlanItem> {
        const res = await this.request<PlanItem[] | PlanItem>(
            `/workout-plans/${planId}/plan-items`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
        // normalize to array and update cache
        const created = Array.isArray(res) ? res : [res];
        this._planItemsCache[planId] = (this._planItemsCache[planId] || []).concat(created);
        return res;
    }

    /**
     * Get plan items for a specific workout plan sorted by scheduled_date (limit 30)
     */
    async getPlanItemsSorted(planId: string): Promise<PlanItem[]> {
        return this.request<PlanItem[]>(`/workout-plans/${planId}/plan-items-sorted`);
    }

    /**
     * Get plan items for a specific plan filtered by month/year.
     * If year/month omitted, server uses current year/month.
     */
    async getPlanItemsByMonth(
        planId: string,
        year?: number,
        month?: number,
    ): Promise<{ year: number; month: number; items: PlanItem[] }> {
        const qs: string[] = [];
        if (year) qs.push(`year=${year}`);
        if (month) qs.push(`month=${month}`);
        const query = qs.length ? `?${qs.join("&")}` : "";
        return this.request<{ year: number; month: number; items: PlanItem[] }>(
            `/workout-plans/${planId}/plan-items-by-month${query}`,
        );
    }

    // Simple in-memory cache for plan items (keyed by planId)
    private _planItemsCache: { [planId: string]: PlanItem[] } = {};

    /**
     * Fetch plan items for the given plan id and store in local cache
     */
    async fetchAndCachePlanItems(planId: string): Promise<PlanItem[]> {
        const items = await this.getPlanItemsSorted(planId);
        console.log("[api] fetched and cached plan items", items.length);
        this._planItemsCache[planId] = items || [];
        return this._planItemsCache[planId];
    }

    /**
     * Return cached plan items for a plan id (or empty array)
     */
    getCachedPlanItems(planId: string): PlanItem[] {
        return this._planItemsCache[planId] || [];
    }

    clearPlanItemsCache(planId?: string) {
        if (planId) delete this._planItemsCache[planId];
        else this._planItemsCache = {};
    }

    async removeWorkoutFromPlan(planItemId: string): Promise<void> {
        await this.request<void>(`/plan-items/${planItemId}`, {
            method: "DELETE",
        });
        // remove from cache entries
        for (const pid of Object.keys(this._planItemsCache)) {
            const list = this._planItemsCache[pid] || [];
            const filtered = list.filter((item) => item.id !== planItemId);
            if (filtered.length !== list.length) this._planItemsCache[pid] = filtered;
        }
    }

    // User Profile Methods
    async getUserProfile(userId: string): Promise<User> {
        return this.request<User>(`/users/${userId}`);
    }

    async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<User> {
        return this.request<User>(`/users/${userId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }
}

export const apiService = new ApiService();
