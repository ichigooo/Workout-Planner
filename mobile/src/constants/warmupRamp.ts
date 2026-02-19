export interface WarmupSet {
    label: string;
    reps: number;
    pct: number; // 0 = bar weight only
    rest: number; // seconds
}

export type WarmupRampKey = "hypertrophy" | "strength" | "5rm";

export const WARMUP_RAMP: Record<WarmupRampKey, WarmupSet[]> = {
    hypertrophy: [
        { label: "Warm-up", reps: 10, pct: 0, rest: 60 },
        { label: "Warm-up", reps: 5, pct: 50, rest: 60 },
        { label: "Warm-up", reps: 3, pct: 70, rest: 90 },
    ],
    strength: [
        { label: "Warm-up", reps: 10, pct: 0, rest: 60 },
        { label: "Warm-up", reps: 5, pct: 50, rest: 60 },
        { label: "Warm-up", reps: 3, pct: 70, rest: 90 },
        { label: "Warm-up", reps: 1, pct: 85, rest: 120 },
    ],
    "5rm": [
        { label: "Warm-up", reps: 10, pct: 0, rest: 60 },
        { label: "Warm-up", reps: 5, pct: 50, rest: 60 },
        { label: "Warm-up", reps: 3, pct: 70, rest: 90 },
    ],
};

export const BAR_WEIGHT = 45; // lbs

/** Default rest between working sets (seconds) when preset has no restSeconds */
export const WORKING_REST: Record<WarmupRampKey, number> = {
    hypertrophy: 120,
    "5rm": 180,
    strength: 240,
};

export const PRESET_TO_RAMP: Record<string, WarmupRampKey> = {
    default: "hypertrophy",
    "5rm": "5rm",
    strength: "strength",
};
