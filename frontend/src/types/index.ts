export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Workout {
    id: string;
    title: string;
    category: string;
    description?: string;
    sets: number;
    reps: number;
    intensity: string;
    imageUrl?: string;
    imageUrl2?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutPlan {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    planItems?: PlanItem[];
}

export interface PlanItem {
    id: string;
    workoutId: string;
    workoutPlanId: string;
    frequency: string;
    intensity?: string;
    createdAt: string;
    updatedAt: string;
    workout?: Workout;
}

export interface WorkoutLog {
    id: string;
    workoutId: string;
    userId: string;
    date: string;
    sets: number;
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkoutRequest {
    title: string;
    category: string;
    description?: string;
    sets: number;
    reps: number;
    intensity: string;
    imageUrl?: string;
    userId: string;
}

export interface CreateWorkoutPlanRequest {
    name: string;
    startDate: string;
    endDate: string;
    userId: string;
}

export interface CreatePlanItemRequest {
    workoutId: string;
    frequency: string;
    intensity?: string;
}
