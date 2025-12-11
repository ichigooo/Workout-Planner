import {
    Workout,
    WorkoutPlan,
    PlanItem,
    User,
    CreateWorkoutRequest,
    CreateWorkoutPlanRequest,
    CreatePlanItemRequest,
    UpdateUserProfileRequest,
    WorkoutPersonalRecord,
    WorkoutPlanTemplate,
    WorkoutDayTemplate,
} from "../types";
import { getLocalIp } from "../utils/getlocalIP";

// Raw env values (may be undefined in some builds)
const RAW_USE_CLOUD = process.env.EXPO_PUBLIC_USE_CLOUD;
const CLOUD_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const USE_CLOUD = (RAW_USE_CLOUD ?? "true").toLowerCase() === "true";

// Only try local IP if we explicitly say "don’t use cloud".
const detectedLocalIp = USE_CLOUD ? null : getLocalIp();
console.log("[api] RAW_USE_CLOUD =", RAW_USE_CLOUD);
console.log("[api] USE_CLOUD =", USE_CLOUD);
console.log("[api] detectedLocalIp", detectedLocalIp);

const LOCAL_BASE_URL = detectedLocalIp ? `http://${detectedLocalIp}:3001/api` : null;

// Pick a base URL without ever throwing at module load.
const API_BASE_URL =  USE_CLOUD ? CLOUD_BASE_URL : LOCAL_BASE_URL || "";

// Log everything so we can see what’s going on.
console.log("[api] CLOUD_BASE_URL =", CLOUD_BASE_URL);
console.log("[api] LOCAL_BASE_URL =", LOCAL_BASE_URL);
console.log("[api] FINAL API_BASE_URL =", API_BASE_URL);

// As a safety net: in dev, loudly error if nothing is set.
// In release, we’ll just log and let requests fail instead of crashing the app.
if (!API_BASE_URL) {
    const msg =
        "API_BASE_URL is empty. Set EXPO_PUBLIC_API_BASE_URL or provide a local IP.";
    if (__DEV__) {
        throw new Error(msg);
    } else {
        console.error("[api]", msg);
    }
}

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
            const method = options?.method ?? "GET";
            const error: any = new Error(
                `API request failed: ${method} ${API_BASE_URL}${endpoint} - ${response.status} ${response.statusText}`,
            );
            error.status = response.status;
            throw error;
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
        const result = await this.request<Workout>("/workouts", {
            method: "POST",
            body: JSON.stringify(workout),
        });
        // Invalidate workouts cache since we added a new workout
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidateWorkouts();
        return result;
    }

    async getWorkout(id: string): Promise<Workout> {
        return this.request<Workout>(`/workouts/${id}`);
    }

    async updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout> {
        const result = await this.request<Workout>(`/workouts/${id}`, {
            method: "PUT",
            body: JSON.stringify(workout),
        });
        // Invalidate workouts cache since we updated a workout
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidateWorkouts();
        return result;
    }

    async deleteWorkout(id: string): Promise<void> {
        await this.request<void>(`/workouts/${id}`, {
            method: "DELETE",
        });
        // Invalidate workouts cache since we deleted a workout
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidateWorkouts();
    }

    async getPersonalRecord(
        workoutId: string,
        userId: string,
    ): Promise<WorkoutPersonalRecord | null> {
        const result = await this.request<WorkoutPersonalRecord | null>(
            `/workouts/${encodeURIComponent(workoutId)}/personal-record?userId=${encodeURIComponent(userId)}`,
        );
        return result;
    }

    async upsertPersonalRecord(
        workoutId: string,
        userId: string,
        value: string,
    ): Promise<WorkoutPersonalRecord> {
        return this.request<WorkoutPersonalRecord>(
            `/workouts/${encodeURIComponent(workoutId)}/personal-record`,
            {
                method: "PUT",
                body: JSON.stringify({ userId, value }),
            },
        );
    }

    async deletePersonalRecord(workoutId: string, userId: string): Promise<void> {
        await this.request<void>(`/workouts/${encodeURIComponent(workoutId)}/personal-record`, {
            method: "DELETE",
            body: JSON.stringify({ userId }),
        });
    }

    // Workout Plan endpoints
    async getWorkoutPlanId(userId: string): Promise<string> {
        const response = await this.request<{ planId: string }>(
            `/users/${encodeURIComponent(userId)}/workout-plan-id`,
        );
        return response.planId;
    }

    async getWorkoutPlan(planId: string): Promise<WorkoutPlan> {
        return this.request<WorkoutPlan>(`/workout-plans/${planId}`);
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
        // Invalidate cache since we added a new item
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidate();
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
        // Invalidate cache since we added new items
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidate();
        return res;
    }

    /**
     * Get plan items for a specific workout plan sorted by scheduled_date,
     * optionally filtered by date range.
     *
     * @param planId The workout plan ID
     * @param startDate Optional start date in YYYY-MM-DD format
     * @param endDate Optional end date in YYYY-MM-DD format
     * @param limit Optional limit for number of items to return (default: 100)
     */
    async getPlanItemsSorted(
        planId: string,
        startDate?: string,
        endDate?: string,
        limit?: number,
    ): Promise<PlanItem[]> {
        const params: string[] = [];
        if (startDate) params.push(`start=${encodeURIComponent(startDate)}`);
        if (endDate) params.push(`end=${encodeURIComponent(endDate)}`);
        if (limit !== undefined) params.push(`limit=${limit}`);

        const qs = params.length > 0 ? `?${params.join("&")}` : "";
        const url = `/workout-plans/${planId}/plan-items-sorted${qs}`;

        return this.request<PlanItem[]>(url);
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

    async removeWorkoutFromPlan(planItemId: string): Promise<void> {
        await this.request<void>(`/plan-items/${planItemId}`, {
            method: "DELETE",
        });
        // Invalidate cache since we removed an item
        const { planItemsCache } = await import("./planItemsCache");
        planItemsCache.invalidate();
    }

    // Workout Plan Template methods
    async getWorkoutPlanTemplates(): Promise<WorkoutPlanTemplate[]> {
        return this.request<WorkoutPlanTemplate[]>("/workout-plan-templates");
    }

    async getWorkoutPlanTemplate(id: string): Promise<WorkoutPlanTemplate> {
        return this.request<WorkoutPlanTemplate>(`/workout-plan-templates/${id}`);
    }

    async upsertWorkoutPlanTemplate(
        templateId: string,
        payload: {
            name: string;
            description?: string | null;
            numWeeks: number;
            daysPerWeek: number;
            workoutStructure: WorkoutDayTemplate[][];
            level?: string | null;
            createdBy?: string | null;
        },
    ): Promise<WorkoutPlanTemplate> {
        return this.request<WorkoutPlanTemplate>(`/workout-plan-templates/${templateId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
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

    async createUserIfNeeded(payload: {
        id: string;
        email: string;
        name?: string | null;
        birthday?: string | null;
    }) {
        try {
            await this.request<User>("/users", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        } catch (err: any) {
            if (err && typeof err === "object" && (err as any).status === 409) {
                // User already exists, safe to ignore.
                return;
            }
            throw err;
        }
    }
}

export const apiService = new ApiService();
