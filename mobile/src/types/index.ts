export interface User {
    id: string;
    email: string;
    name?: string;
    profilePhoto?: string;
    birthday?: string;
    createdAt: string;
    updatedAt: string;
    isAdmin: boolean;
}

export type WorkoutCategory =
    | "Upper Body - Pull"
    | "Upper Body - Push"
    | "Legs"
    | "Core"
    | "Climbing - Power"
    | "Climbing - Endurance"
    | "Climbing - Warm Up"
    | "Mobility";

export type MovementType = "compound" | "accessory" | "isolation" | "plyometric" | "technique" | "warmup";

export type InputType = "sets_reps" | "sets_time" | "percentage_1rm";

export interface WorkoutPreset {
    id: string;
    preset: string;
    sets?: number;
    reps?: number;
    intensityPct?: number;
    intensityLabel?: string;
    restSeconds?: number;
    durationPerSet?: number;
    isDefault: boolean;
    inputType: InputType;
}

export function getDefaultPreset(workout: Workout): WorkoutPreset | undefined {
    return workout.presets?.find((p) => p.isDefault) ?? workout.presets?.[0];
}

export function getPresetByName(workout: Workout, name: string): WorkoutPreset | undefined {
    return workout.presets?.find((p) => p.preset === name);
}

export const SEQUENCE_PRIORITY: Record<MovementType, number> = {
    warmup: 0,
    technique: 5,
    compound: 10,
    plyometric: 20,
    accessory: 30,
    isolation: 50,
};

export interface Workout {
    id: string;
    title: string;
    category: WorkoutCategory;
    description?: string;
    workoutType: string;
    movementType?: MovementType;
    presets: WorkoutPreset[];
    imageUrl?: string;
    imageUrl2?: string;
    isGlobal: boolean;
    createdBy?: string;
    trackRecords?: boolean;
    isUnilateral?: boolean;
    sourceUrl?: string;
    sourcePlatform?: string;
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
    sets?: number;
    reps?: number;
    duration?: number;
    weight?: number;
    rpe?: number;
    pace?: string;
    heartRate?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutPersonalRecord {
    id: string;
    workoutId: string;
    userId: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

// New structured PR tracking types
export interface PersonalRecordEntry {
    id: string;
    userId: string;
    workoutId: string;
    reps: number;
    weight: number;
    dateAchieved: string;
    createdAt: string;
    updatedAt: string;
}

export interface CurrentPR {
    reps: number;
    weight: number;
    dateAchieved: string;
    entryId: string;
}

export interface CreatePREntryRequest {
    userId: string;
    reps: number;
    weight: number;
    dateAchieved?: string;
}

export interface CreatePREntryResponse {
    entry: PersonalRecordEntry;
    isNewRecord: boolean;
    previousBest: { weight: number; dateAchieved: string } | null;
}

export interface UserWorkoutRepConfig {
    id?: string;
    userId?: string;
    workoutId?: string;
    customReps: number[];
    createdAt?: string;
    updatedAt?: string;
}

export interface WorkoutPRSummary {
    workout: Pick<Workout, "id" | "title" | "category" | "imageUrl" | "isUnilateral">;
    currentRecords: CurrentPR[];
    customReps: number[];
}

export interface AllPRsResponse {
    workouts: WorkoutPRSummary[];
}

export interface WorkoutDayTemplate {
    name: string;
    workoutIds: string[];
}

export interface WorkoutPlanTemplate {
    id: string;
    name: string;
    description?: string | null;
    numWeeks: number;
    daysPerWeek: number;
    workoutStructure: WorkoutDayTemplate[][];
    level?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkoutRequest {
    title: string;
    category: WorkoutCategory;
    description?: string;
    movementType?: MovementType;
    presets?: Omit<WorkoutPreset, "id">[];
    imageUrl?: string;
    imageUrl2?: string;
    createdBy?: string;
    trackRecords?: boolean;
    sourceUrl?: string;
    sourcePlatform?: string;
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

export interface UpdateUserProfileRequest {
    name?: string;
    email?: string;
    profilePhoto?: string;
    birthday?: string;
}

export interface WorkoutImport {
    id: string;
    userId: string;
    sourceUrl: string;
    sourcePlatform?: string | null;
    title?: string | null;
    category?: string | null;
    description?: string | null;
    thumbnailUrl?: string | null;
    html?: string | null;
    metadata?: Record<string, any> | null;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutImportPreview {
    sourceUrl: string;
    sourcePlatform: string;
    title: string | null;
    description: string | null;
    thumbnailUrl: string | null;
    html: string | null;
    metadata: Record<string, any> | null;
}
