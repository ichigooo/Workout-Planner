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
     * Get plan items for a specific workout plan sorted by scheduled_date (limit 30),
     * starting from the given start date (YYYY-MM-DD). If startDate is omitted, the server default applies.
     */
    async getPlanItemsSorted(planId: string, startDate?: string): Promise<PlanItem[]> {
        const qs = startDate ? `?start=${encodeURIComponent(startDate)}` : "";
        return this.request<PlanItem[]>(`/workout-plans/${planId}/plan-items-sorted${qs}`);
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
        // Ask the server for items starting from today to avoid fetching the entire history
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = (today.getMonth() + 1).toString().padStart(2, "0");
        const dd = today.getDate().toString().padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const items = await this.getPlanItemsSorted(planId, todayStr);

        console.log("[api] fetched plan items starting from today:", items.length);
        this._planItemsCache[planId] = items || [];
        return this._planItemsCache[planId];
    }

    /**
     * Fetch plan items only for the next `days` days starting today, cache and return them.
     * Uses the month endpoint to avoid fetching the entire history.
     */
    async fetchAndCachePlanItemsNextDays(planId: string, days: number = 5): Promise<PlanItem[]> {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(start);
        end.setDate(start.getDate() + (days - 1));

        const monthsToFetch: Array<{ year: number; month: number }> = [];
        const addMonth = (d: Date) => {
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            if (!monthsToFetch.find((x) => x.year === y && x.month === m)) {
                monthsToFetch.push({ year: y, month: m });
            }
        };
        addMonth(start);
        addMonth(end);

        let collected: PlanItem[] = [];
        for (const m of monthsToFetch) {
            try {
                const resp = await this.getPlanItemsByMonth(planId, m.year, m.month);
                collected = collected.concat(resp.items || []);
            } catch (e) {
                console.warn("[api] getPlanItemsByMonth failed", m, e);
            }
        }

        const toDateStr = (sd: unknown): string | null => {
            if (!sd) return null;
            if (typeof sd === "string") return sd.split("T")[0].split(" ")[0];
            try {
                const d = new Date(sd as any);
                const y = d.getFullYear();
                const mm = (d.getMonth() + 1).toString().padStart(2, "0");
                const dd = d.getDate().toString().padStart(2, "0");
                return `${y}-${mm}-${dd}`;
            } catch {
                return null;
            }
        };

        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
        const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

        const inRange = (ds: string) => ds >= startStr && ds <= endStr;

        const nextDays = (collected || [])
            .map((it) => {
                const sd = (it as any).scheduledDate ?? (it as any).scheduled_date;
                const dateStr = toDateStr(sd);
                return { it, dateStr };
            })
            .filter((row) => row.dateStr && inRange(row.dateStr))
            .sort((a, b) => (a.dateStr! < b.dateStr! ? -1 : a.dateStr! > b.dateStr! ? 1 : 0))
            .map((row) => row.it);

        console.log("[api] cached next-days items:", nextDays.length, "range", startStr, "to", endStr);
        this._planItemsCache[planId] = nextDays;
        return nextDays;
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
