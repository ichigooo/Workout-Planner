import { planItemsCache } from "../planItemsCache";
import { apiService } from "../api";
import { PlanItem } from "../../types";

// Mock the API service
jest.mock("../api", () => ({
    apiService: {
        getPlanItemsSorted: jest.fn(),
    },
}));

const mockApiService = apiService as any;

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
});

// Helper to create mock plan items
const createMockPlanItem = (id: string, scheduledDate: string, workoutTitle: string): PlanItem => ({
    id,
    workoutId: `workout-${id}`,
    workoutPlanId: "test-plan-id",
    scheduledDate,
    intensity: "medium",
    workout: {
        id: `workout-${id}`,
        title: workoutTitle,
        description: `Description for ${workoutTitle}`,
        category: "Upper Body - Pull" as const,
        workoutType: "strength" as const,
        sets: 3,
        reps: 10,
        duration: 30,
        intensity: "medium",
        imageUrl: undefined,
        imageUrl2: undefined,
        isGlobal: true,
        intensityModel: "legacy" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// Helper to get date strings
const getDateStr = (daysFromToday: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
};

describe("PlanItemsCache", () => {
    beforeEach(() => {
        // Reset cache state before each test
        planItemsCache.invalidate();
        jest.clearAllMocks();
    });

    describe("initialization", () => {
        it("should initialize with planId", () => {
            planItemsCache.initialize("test-plan-id");
            expect(console.log).toHaveBeenCalledWith(
                "[PlanItemsCache] Initialized with planId: test-plan-id",
            );
        });
    });

    describe("fetchAndCache", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should fetch and cache items successfully", async () => {
            const mockItems = [
                createMockPlanItem("1", getDateStr(0), "Today Workout"),
                createMockPlanItem("2", getDateStr(1), "Tomorrow Workout"),
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            const result = await planItemsCache.getCachedItems();

            expect(result).toEqual(mockItems);
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledWith(
                "test-plan-id",
                getDateStr(-7), // start date (today - 7)
                getDateStr(5), // end date (today + 5)
            );
        });

        it("should return empty array on API error", async () => {
            mockApiService.getPlanItemsSorted.mockRejectedValue(new Error("API Error"));

            const result = await planItemsCache.getCachedItems();

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                "[PlanItemsCache] Failed to fetch items:",
                expect.any(Error),
            );
        });

        it("should filter items outside date window", async () => {
            const mockItems = [
                createMockPlanItem("1", getDateStr(-10), "Too Old"), // Outside window
                createMockPlanItem("2", getDateStr(0), "Today Workout"), // In window
                createMockPlanItem("3", getDateStr(10), "Too Future"), // Outside window
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            const result = await planItemsCache.getCachedItems();

            expect(result).toHaveLength(1);
            expect(result?.[0]?.workout?.title).toBe("Today Workout");
        });

        it("should sort items by date", async () => {
            const mockItems = [
                createMockPlanItem("1", getDateStr(2), "Future Workout"),
                createMockPlanItem("2", getDateStr(0), "Today Workout"),
                createMockPlanItem("3", getDateStr(1), "Tomorrow Workout"),
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            const result = await planItemsCache.getCachedItems();

            expect(result[0].workout.title).toBe("Today Workout");
            expect(result[1].workout.title).toBe("Tomorrow Workout");
            expect(result[2].workout.title).toBe("Future Workout");
        });
    });

    describe("cache validation", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should use cached items when cache is valid", async () => {
            const mockItems = [createMockPlanItem("1", getDateStr(0), "Cached Workout")];
            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            // First call - should fetch
            await planItemsCache.getCachedItems();
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);

            // Second call - should use cache
            const result = await planItemsCache.getCachedItems();
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockItems);
        });

        it("should refetch when cache is expired", async () => {
            const mockItems = [createMockPlanItem("1", getDateStr(0), "Workout")];
            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            // Mock cache TTL to be very short
            const originalTTL = (planItemsCache as any).CACHE_TTL;
            (planItemsCache as any).CACHE_TTL = 1; // 1ms

            // First call
            await planItemsCache.getCachedItems();
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);

            // Wait for cache to expire
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Second call - should refetch
            await planItemsCache.getCachedItems();
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(2);

            // Restore original TTL
            (planItemsCache as any).CACHE_TTL = originalTTL;
        });
    });

    describe("getItemsForDateRange", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should return items within specified date range", async () => {
            const mockItems = [
                createMockPlanItem("1", getDateStr(-1), "Yesterday"),
                createMockPlanItem("2", getDateStr(0), "Today"),
                createMockPlanItem("3", getDateStr(1), "Tomorrow"),
                createMockPlanItem("4", getDateStr(2), "Day After"),
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            const result = await planItemsCache.getItemsForDateRange(getDateStr(0), getDateStr(1));

            expect(result).toHaveLength(2);
            expect(result?.[0]?.workout?.title).toBe("Today");
            expect(result?.[1]?.workout?.title).toBe("Tomorrow");
        });

        it("should throw error for invalid date range", async () => {
            await expect(
                planItemsCache.getItemsForDateRange(getDateStr(1), getDateStr(0)),
            ).rejects.toThrow("Invalid date range");
        });

        it("should warn when requested range extends beyond cache", async () => {
            const mockItems = [createMockPlanItem("1", getDateStr(0), "Today")];
            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            // Request range that extends beyond cache window
            await planItemsCache.getItemsForDateRange(getDateStr(-10), getDateStr(10));

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("extends beyond cached window"),
            );
        });
    });

    describe("getItemsForNextDays", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should return items for next N days", async () => {
            const mockItems = [
                createMockPlanItem("1", getDateStr(0), "Today"),
                createMockPlanItem("2", getDateStr(1), "Tomorrow"),
                createMockPlanItem("3", getDateStr(2), "Day After"),
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            const result = await planItemsCache.getItemsForNextDays(2);

            expect(result).toHaveLength(2);
            expect(result[0]?.workout?.title).toBe("Today");
            expect(result[1]?.workout?.title).toBe("Tomorrow");
        });

        it("should throw error for invalid days parameter", async () => {
            await expect(planItemsCache.getItemsForNextDays(-1)).rejects.toThrow(
                "Invalid days parameter",
            );

            await expect(planItemsCache.getItemsForNextDays(0)).rejects.toThrow(
                "Invalid days parameter",
            );

            await expect(planItemsCache.getItemsForNextDays(1.5)).rejects.toThrow(
                "Invalid days parameter",
            );
        });

        it("should extend cache when extendCache option is true", async () => {
            // First, populate cache with initial data (today-7 to today+5 window)
            const initialItems = [
                createMockPlanItem("1", getDateStr(0), "Today"),
                createMockPlanItem("2", getDateStr(2), "Day 2"),
            ];
            mockApiService.getPlanItemsSorted.mockResolvedValueOnce(initialItems);

            // Populate initial cache
            await planItemsCache.getCachedItems();

            // Now mock extended data for the extension call
            const extendedItems = [
                createMockPlanItem("1", getDateStr(0), "Today"),
                createMockPlanItem("2", getDateStr(2), "Day 2"),
                createMockPlanItem("3", getDateStr(10), "Far Future"),
            ];
            mockApiService.getPlanItemsSorted.mockResolvedValueOnce(extendedItems);

            // Request 15 days with cache extension
            const result = await planItemsCache.getItemsForNextDays(15, { extendCache: true });

            expect(result).toHaveLength(3);
            expect(result[0]?.workout?.title).toBe("Today");
            expect(result[1]?.workout?.title).toBe("Day 2");
            expect(result[2]?.workout?.title).toBe("Far Future");

            // Verify the extended API call was made
            expect(mockApiService.getPlanItemsSorted).toHaveBeenLastCalledWith(
                "test-plan-id",
                getDateStr(-7), // start date (today - 7)
                getDateStr(14), // extended end date (today + 14)
            );
        });
    });

    describe("invalidate", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should clear cache and refetch fresh data", async () => {
            // Initial data
            const initialItems = [createMockPlanItem("1", getDateStr(0), "Initial Workout")];
            mockApiService.getPlanItemsSorted.mockResolvedValueOnce(initialItems);

            // Populate cache
            const firstResult = await planItemsCache.getCachedItems();
            expect(firstResult?.[0]?.workout?.title).toBe("Initial Workout");
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);

            // Verify cache is being used (no new API call)
            const cachedResult = await planItemsCache.getCachedItems();
            expect(cachedResult?.[0]?.workout?.title).toBe("Initial Workout");
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(1); // Still 1

            // Invalidate cache
            planItemsCache.invalidate();

            // Mock new data for refresh
            const updatedItems = [
                createMockPlanItem("1", getDateStr(0), "Updated Workout"),
                createMockPlanItem("2", getDateStr(1), "New Workout"),
            ];
            mockApiService.getPlanItemsSorted.mockResolvedValueOnce(updatedItems);

            // Next call should refetch and return fresh data
            const refreshedResult = await planItemsCache.getCachedItems();
            expect(refreshedResult).toHaveLength(2);
            expect(refreshedResult?.[0]?.workout?.title).toBe("Updated Workout");
            expect(refreshedResult?.[1]?.workout?.title).toBe("New Workout");
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(2);

            // Verify new data is now cached
            const newCachedResult = await planItemsCache.getCachedItems();
            expect(newCachedResult?.[0]?.workout?.title).toBe("Updated Workout");
            expect(mockApiService.getPlanItemsSorted).toHaveBeenCalledTimes(2); // Still 2
        });

        it("should clear cache info", async () => {
            const mockItems = [createMockPlanItem("1", getDateStr(0), "Workout")];
            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            // Populate cache
            await planItemsCache.getCachedItems();
            expect(planItemsCache.getCacheInfo()).not.toBeNull();

            // Invalidate cache
            planItemsCache.invalidate();

            // Cache info should be null
            expect(planItemsCache.getCacheInfo()).toBeNull();
        });
    });

    describe("getCacheInfo", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should return null when cache is empty", () => {
            const info = planItemsCache.getCacheInfo();
            expect(info).toBeNull();
        });

        it("should return cache info when cache is populated", async () => {
            const mockItems = [createMockPlanItem("1", getDateStr(0), "Workout")];
            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems);

            await planItemsCache.getCachedItems();

            const info = planItemsCache.getCacheInfo();
            expect(info).toMatchObject({
                itemCount: 1,
                startDate: getDateStr(-7),
                endDate: getDateStr(5),
                age: expect.any(Number),
            });
        });
    });

    describe("date normalization", () => {
        beforeEach(() => {
            planItemsCache.initialize("test-plan-id");
        });

        it("should handle different date formats", async () => {
            const mockItems = [
                {
                    ...createMockPlanItem("1", getDateStr(0), "String Date"),
                    scheduledDate: getDateStr(0), // String format
                },
                {
                    ...createMockPlanItem("2", getDateStr(1), "Timestamp Date"),
                    scheduledDate: new Date(getDateStr(1)).getTime(), // Timestamp format
                },
                {
                    ...createMockPlanItem("3", getDateStr(2), "ISO Date"),
                    scheduledDate: new Date(getDateStr(2)).toISOString(), // ISO string format
                },
            ];

            mockApiService.getPlanItemsSorted.mockResolvedValue(mockItems as any);

            const result = await planItemsCache.getCachedItems();

            expect(result).toHaveLength(3);
            expect(result?.[0]?.workout?.title).toBe("String Date");
            expect(result?.[1]?.workout?.title).toBe("Timestamp Date");
            expect(result?.[2]?.workout?.title).toBe("ISO Date");
        });
    });
});
