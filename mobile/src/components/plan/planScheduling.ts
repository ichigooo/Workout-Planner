import type { WorkoutPlanTemplate } from "@/src/types";
import { apiService } from "@/src/services/api";
import { ensureCurrentUserId, getCurrentPlanId } from "@/src/state/session";
import { planItemsCache } from "@/src/services/planItemsCache";

export type GeneratedPlanItem = {
    workoutId: string;
    scheduledDate: string;
};

type GeneratePlanItemsArgs = {
    template: WorkoutPlanTemplate;
    startDate: Date;
    workoutDays: string[];
};

type CreatePlanArgs = Omit<GeneratePlanItemsArgs, "template"> & {
    template?: WorkoutPlanTemplate;
    templateId?: string;
    clearExistingPlan: boolean;
};

export type CreatePlanResult = {
    success: boolean;
    itemsCreated: number;
    error?: string;
};

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const generatePlanItemsFromTemplate = ({
    template,
    startDate,
    workoutDays,
}: GeneratePlanItemsArgs): GeneratedPlanItem[] => {
    const startBaseDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
    );

    const normalizedDays = workoutDays
        .map((d) => d.toLowerCase())
        .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    const rawDayIndexes =
        normalizedDays.length > 0
            ? normalizedDays.map((day) => DAY_ORDER.indexOf(day)).filter((idx) => idx >= 0)
            : [];

    const startDayIndex = startBaseDate.getDay();
    const baseOffsets: number[] = [];

    if (rawDayIndexes.length > 0) {
        const diffs = rawDayIndexes
            .map((idx) => (idx - startDayIndex + 7) % 7)
            .sort((a, b) => a - b);

        const hasStartDay = diffs.includes(0);
        const firstOffset = hasStartDay ? 0 : (diffs.find((diff) => diff > 0) ?? diffs[0] ?? 0);
        baseOffsets.push(firstOffset);

        diffs.filter((diff) => diff > firstOffset).forEach((diff) => baseOffsets.push(diff));
        diffs
            .filter((diff) => diff > 0 && diff < firstOffset)
            .forEach((diff) => baseOffsets.push(diff + 7));
    } else {
        baseOffsets.push(0);
    }

    const getOffsetForDayIdx = (dayIdx: number) => {
        if (dayIdx < baseOffsets.length) {
            return baseOffsets[dayIdx];
        }
        const extra = dayIdx - (baseOffsets.length - 1);
        return baseOffsets[baseOffsets.length - 1] + extra;
    };

    const planItems: GeneratedPlanItem[] = [];

    template.workoutStructure.forEach((weekStructure, weekIdx) => {
        const weekStart = new Date(startBaseDate);
        weekStart.setDate(startBaseDate.getDate() + weekIdx * 7);

        weekStructure.forEach((dayStructure, dayIdx) => {
            const offsetDays = getOffsetForDayIdx(dayIdx);
            const referenceDate = new Date(weekStart);
            referenceDate.setDate(weekStart.getDate() + offsetDays);

            dayStructure.workoutIds.forEach((workoutId) => {
                if (!workoutId) return;
                planItems.push({
                    workoutId,
                    scheduledDate: formatDate(referenceDate),
                });
            });
        });
    });

    return planItems;
};

export const createUserPlanFromTemplate = async ({
    template,
    templateId,
    startDate,
    workoutDays,
    clearExistingPlan,
}: CreatePlanArgs): Promise<CreatePlanResult> => {
    if (!template) {
        return { success: false, itemsCreated: 0, error: "No template provided" };
    }

    // Step 1: Get required IDs
    const userId = await ensureCurrentUserId();
    if (!userId) {
        return { success: false, itemsCreated: 0, error: "User not logged in" };
    }

    let planId = getCurrentPlanId();
    if (!planId) {
        // Try to fetch the plan ID if not in memory
        try {
            planId = await apiService.getWorkoutPlanId(userId);
        } catch (err) {
            console.error("[createUserPlanFromTemplate] Failed to get plan ID:", err);
            return { success: false, itemsCreated: 0, error: "Could not find workout plan" };
        }
    }

    // Step 2: Generate plan items from template
    const planItems = generatePlanItemsFromTemplate({ template, startDate, workoutDays });

    if (planItems.length === 0) {
        return { success: false, itemsCreated: 0, error: "Template generated no plan items" };
    }

    console.log("[createUserPlanFromTemplate] Generated items:", planItems.length);
    console.log("[createUserPlanFromTemplate] Clear existing:", clearExistingPlan);

    try {
        // Step 3: Clear existing plan if requested
        if (clearExistingPlan) {
            await apiService.clearPlanItems(planId);
            console.log("[createUserPlanFromTemplate] Cleared existing plan items");
        }

        // Step 4: Group items by workoutId for efficient bulk insert
        const itemsByWorkout = planItems.reduce<Record<string, string[]>>((acc, item) => {
            if (!acc[item.workoutId]) {
                acc[item.workoutId] = [];
            }
            acc[item.workoutId].push(item.scheduledDate);
            return acc;
        }, {});

        // Step 5: Insert all items in parallel (one API call per unique workout)
        const workoutEntries = Object.entries(itemsByWorkout);
        const insertPromises = workoutEntries.map(([workoutId, dates]) =>
            apiService.addWorkoutToPlanOnDates(planId!, { workoutId, dates }),
        );

        const results = await Promise.allSettled(insertPromises);

        // Step 6: Check for failures
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
            const successCount = results.filter((r) => r.status === "fulfilled").length;
            console.error("[createUserPlanFromTemplate] Some inserts failed:", failures);

            // Invalidate cache even on partial success
            planItemsCache.invalidate();

            if (successCount === 0) {
                return {
                    success: false,
                    itemsCreated: 0,
                    error: "Failed to add workouts to plan",
                };
            }

            return {
                success: true, // Partial success
                itemsCreated: successCount,
                error: `Added ${successCount} of ${workoutEntries.length} workout groups`,
            };
        }

        // Step 7: Invalidate cache on success
        planItemsCache.invalidate();

        return {
            success: true,
            itemsCreated: planItems.length,
        };
    } catch (error) {
        console.error("[createUserPlanFromTemplate] Error:", error);
        return {
            success: false,
            itemsCreated: 0,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
};
