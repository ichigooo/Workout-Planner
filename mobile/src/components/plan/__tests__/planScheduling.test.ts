import type { WorkoutPlanTemplate } from "../../../types";
import { generatePlanItemsFromTemplate } from "../planScheduling";

const buildTemplate = (numWeeks = 2, daysPerWeek = 5): WorkoutPlanTemplate => {
    const dayNames = Array.from({ length: daysPerWeek }, (_, idx) => `Day ${idx + 1}`);
    return {
        id: "template-1",
        name: "Mock Template",
        description: "Test template",
        numWeeks,
        daysPerWeek,
        workoutStructure: Array.from({ length: numWeeks }, (_, weekIdx) =>
            dayNames.map((name, dayIdx) => ({
                name: `${name} Week ${weekIdx + 1}`,
                workoutIds: [`week${weekIdx + 1}-day${dayIdx + 1}`],
            })),
        ),
        level: "test",
        createdBy: "tester",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

const extractDates = (items: { scheduledDate: string }[], count: number) =>
    items.slice(0, count).map((item) => item.scheduledDate);

describe("generatePlanItemsFromTemplate", () => {
    it("aligns workouts to the next available selected day when the start date is not included", () => {
        const template = buildTemplate(2, 5);
        const planItems = generatePlanItemsFromTemplate({
            template,
            startDate: new Date(2025, 11, 9), // Tue Dec 9, 2025
            workoutDays: ["mon", "wed", "fri", "sun", "thu"],
        });

        expect(extractDates(planItems, 5)).toEqual([
            "2025-12-10", // Wed
            "2025-12-11", // Thu
            "2025-12-12", // Fri
            "2025-12-14", // Sun
            "2025-12-15", // Mon
        ]);

        // Second week should offset by exactly 7 days
        expect(extractDates(planItems.slice(5), 5)).toEqual([
            "2025-12-17",
            "2025-12-18",
            "2025-12-19",
            "2025-12-21",
            "2025-12-22",
        ]);
    });

    it("keeps the start date when the user selects that weekday", () => {
        const template = buildTemplate(1, 3);
        const planItems = generatePlanItemsFromTemplate({
            template,
            startDate: new Date(2025, 11, 10), // Wed Dec 10, 2025
            workoutDays: ["wed", "fri"],
        });

        expect(extractDates(planItems, 3)).toEqual([
            "2025-12-10", // Wed
            "2025-12-12", // Fri
            "2025-12-13", // Fallback sequential day
        ]);
    });

    it("falls back to sequential scheduling when no workout days are selected", () => {
        const template = buildTemplate(1, 4);
        const planItems = generatePlanItemsFromTemplate({
            template,
            startDate: new Date(2025, 0, 1), // Jan 1, 2025
            workoutDays: [],
        });

        expect(extractDates(planItems, 4)).toEqual([
            "2025-01-01",
            "2025-01-02",
            "2025-01-03",
            "2025-01-04",
        ]);
    });
});
