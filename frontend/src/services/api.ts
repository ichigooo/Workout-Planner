import {
    Workout,
    WorkoutPlan,
    PlanItem,
    CreateWorkoutRequest,
    CreateWorkoutPlanRequest,
    CreatePlanItemRequest,
} from "../types";

const API_BASE_URL = "http://localhost:3001/api";

class ApiService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
}

export const apiService = new ApiService();
