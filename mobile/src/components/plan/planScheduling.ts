import type { WorkoutPlanTemplate } from "@/src/types";

export type GeneratedPlanItem = {
    workoutId: string;
    scheduledDate: string;
};

type GeneratePlanItemsArgs = {
    template: WorkoutPlanTemplate;
    startDate: Date;
    workoutDays: string[];
};

type CreatePlanArgs = GeneratePlanItemsArgs & {
    templateId?: string;
    clearExistingPlan: boolean;
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
}: CreatePlanArgs) => {
    if (!template) {
        console.warn("[PlanSetupModal] No template provided for plan creation");
        return;
    }

    const planItems = generatePlanItemsFromTemplate({ template, startDate, workoutDays });

    console.log("Prepared plan items:", planItems);
    console.log("Clear current plan first:", clearExistingPlan);
    console.log("Template metadata:", {
        templateId: templateId ?? template.id,
        numWeeks: template.numWeeks,
        daysPerWeek: template.daysPerWeek,
    });

    // TODO: Replace with Supabase mutation
    return new Promise<void>((resolve) => setTimeout(resolve, 800));
};
