import type { WorkoutPlanTemplate } from "../../../types";
import { generatePlanItemsFromTemplate, createUserPlanFromTemplate } from "../planScheduling";

// Mock the dependencies
jest.mock("@/src/services/api", () => ({
    apiService: {
        getWorkoutPlanId: jest.fn(),
        clearPlanItems: jest.fn(),
        addWorkoutToPlanOnDates: jest.fn(),
    },
}));

jest.mock("@/src/state/session", () => ({
    ensureCurrentUserId: jest.fn(),
    getCurrentPlanId: jest.fn(),
}));

jest.mock("@/src/services/planItemsCache", () => ({
    planItemsCache: {
        invalidate: jest.fn(),
    },
}));

import { apiService } from "@/src/services/api";
import { ensureCurrentUserId, getCurrentPlanId } from "@/src/state/session";
import { planItemsCache } from "@/src/services/planItemsCache";

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

describe("createUserPlanFromTemplate", () => {
    const mockTemplate = buildTemplate(1, 2);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns error when no template is provided", async () => {
        const result = await createUserPlanFromTemplate({
            template: undefined as any,
            startDate: new Date(),
            workoutDays: ["mon"],
            clearExistingPlan: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("No template provided");
    });

    it("returns error when user is not logged in", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue(null);

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(),
            workoutDays: ["mon"],
            clearExistingPlan: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not logged in");
    });

    it("returns error when plan ID cannot be found", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue("user-123");
        (getCurrentPlanId as jest.Mock).mockReturnValue(null);
        (apiService.getWorkoutPlanId as jest.Mock).mockRejectedValue(new Error("Not found"));

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(),
            workoutDays: ["mon"],
            clearExistingPlan: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Could not find workout plan");
    });

    it("successfully creates plan items without clearing", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue("user-123");
        (getCurrentPlanId as jest.Mock).mockReturnValue("plan-456");
        (apiService.addWorkoutToPlanOnDates as jest.Mock).mockResolvedValue([]);

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(2025, 0, 1),
            workoutDays: ["mon", "wed"],
            clearExistingPlan: false,
        });

        expect(result.success).toBe(true);
        expect(result.itemsCreated).toBe(2); // 1 week x 2 days
        expect(apiService.clearPlanItems).not.toHaveBeenCalled();
        expect(apiService.addWorkoutToPlanOnDates).toHaveBeenCalled();
        expect(planItemsCache.invalidate).toHaveBeenCalled();
    });

    it("clears existing plan when requested", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue("user-123");
        (getCurrentPlanId as jest.Mock).mockReturnValue("plan-456");
        (apiService.clearPlanItems as jest.Mock).mockResolvedValue(undefined);
        (apiService.addWorkoutToPlanOnDates as jest.Mock).mockResolvedValue([]);

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(2025, 0, 1),
            workoutDays: ["mon"],
            clearExistingPlan: true,
        });

        expect(result.success).toBe(true);
        expect(apiService.clearPlanItems).toHaveBeenCalledWith("plan-456");
    });

    it("handles partial API failures gracefully", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue("user-123");
        (getCurrentPlanId as jest.Mock).mockReturnValue("plan-456");
        (apiService.addWorkoutToPlanOnDates as jest.Mock)
            .mockResolvedValueOnce([]) // First workout succeeds
            .mockRejectedValueOnce(new Error("Network error")); // Second fails

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(2025, 0, 1),
            workoutDays: ["mon"],
            clearExistingPlan: false,
        });

        // Partial success - one workout group succeeded
        expect(result.success).toBe(true);
        expect(result.itemsCreated).toBe(1);
        expect(result.error).toContain("1 of 2");
        expect(planItemsCache.invalidate).toHaveBeenCalled();
    });

    it("returns failure when all API calls fail", async () => {
        (ensureCurrentUserId as jest.Mock).mockResolvedValue("user-123");
        (getCurrentPlanId as jest.Mock).mockReturnValue("plan-456");
        (apiService.addWorkoutToPlanOnDates as jest.Mock).mockRejectedValue(
            new Error("Network error"),
        );

        const result = await createUserPlanFromTemplate({
            template: mockTemplate,
            startDate: new Date(2025, 0, 1),
            workoutDays: ["mon"],
            clearExistingPlan: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to add workouts to plan");
    });
});
