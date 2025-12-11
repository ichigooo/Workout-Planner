import { PlanItem, Workout, WorkoutPlanTemplate } from "../types";
import { apiService } from "./api";

interface CacheEntry {
    items: PlanItem[];
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    fetchedAt: number; // timestamp
}

class PlanItemsCache {
    private cache: CacheEntry | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private planId!: string; // Set during initialization, guaranteed to exist when methods are called
    private workoutsCache: Workout[] = []; // Cache for all workouts
    private workoutsCacheTimestamp: number = 0; // When workouts were last fetched
    private templateCache: { items: WorkoutPlanTemplate[]; fetchedAt: number } | null = null;

    /**
     * Get the date window for caching: today-7 to today+5
     */
    private getDateWindow(): { startDate: string; endDate: string } {
        const today = new Date();

        // Start: today - 7 days
        const start = new Date(today);
        start.setDate(today.getDate() - 7);

        // End: today + 5 days
        const end = new Date(today);
        end.setDate(today.getDate() + 5);

        const pad = (n: number) => n.toString().padStart(2, "0");

        return {
            startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
            endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
        };
    }

    /**
     * Check if cache entry is valid (not expired and covers current date window)
     */
    private isCacheValid(): boolean {
        if (!this.cache) {
            console.log(`[PlanItemsCache] Cache validation: No cache exists`);
            return false;
        }

        const now = Date.now();
        const { startDate, endDate } = this.getDateWindow();
        const age = now - this.cache.fetchedAt;

        console.log(`[PlanItemsCache] Cache validation:`, {
            cacheAge: `${Math.round(age / 1000)}s`,
            cacheTTL: `${this.CACHE_TTL / 1000}s`,
            isExpired: age > this.CACHE_TTL,
            currentWindow: `${startDate} to ${endDate}`,
            cachedWindow: `${this.cache.startDate} to ${this.cache.endDate}`,
            windowCovers: this.cache.startDate <= startDate && this.cache.endDate >= endDate,
        });

        // Check TTL
        if (age > this.CACHE_TTL) {
            console.log(
                `[PlanItemsCache] Cache expired: ${Math.round(age / 1000)}s > ${this.CACHE_TTL / 1000}s`,
            );
            return false;
        }

        // Check if cache covers current date window
        const covers = this.cache.startDate <= startDate && this.cache.endDate >= endDate;
        if (!covers) {
            console.log(
                `[PlanItemsCache] Cache window insufficient: cached(${this.cache.startDate}-${this.cache.endDate}) vs needed(${startDate}-${endDate})`,
            );
        }

        return covers;
    }

    /**
     * Normalize date from various formats to YYYY-MM-DD
     */
    private toDateStr(sd: unknown): string | null {
        if (!sd) return null;
        if (typeof sd === "string") {
            return sd.split("T")[0].split(" ")[0];
        }
        try {
            const d = new Date(sd as any);
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, "0");
            const day = d.getDate().toString().padStart(2, "0");
            return `${y}-${m}-${day}`;
        } catch {
            return null;
        }
    }

    /**
     * Initialize the cache with a planId
     */
    initialize(planId: string): void {
        this.planId = planId;
        console.log(`[PlanItemsCache] Initialized with planId: ${planId}`);
    }

    /**
     * Get the current plan ID
     */
    getPlanId(): string {
        return this.planId;
    }

    /**
     * Fetch plan items for the date window and cache them
     */
    async fetchAndCache(): Promise<PlanItem[]> {
        const { startDate, endDate } = this.getDateWindow();

        try {
            // Use the sorted endpoint with both start and end dates for precise filtering
            const items = await apiService.getPlanItemsSorted(this.planId, startDate, endDate);
            console.log(`[PlanItemsCache] Fetched ${items?.length} items`);
            // Items should already be filtered by the server, but double-check for safety
            const windowItems = (items || []).filter((item) => {
                const sd = (item as any).scheduledDate ?? (item as any).scheduled_date;
                const dateStr = this.toDateStr(sd);
                return dateStr && dateStr >= startDate && dateStr <= endDate;
            });

            // Sort by date
            windowItems.sort((a, b) => {
                const aDate =
                    this.toDateStr((a as any).scheduledDate ?? (a as any).scheduled_date) || "";
                const bDate =
                    this.toDateStr((b as any).scheduledDate ?? (b as any).scheduled_date) || "";
                return aDate.localeCompare(bDate);
            });

            // Cache the results
            this.cache = {
                items: windowItems,
                startDate,
                endDate,
                fetchedAt: Date.now(),
            };

            return windowItems;
        } catch (error) {
            console.error(`[PlanItemsCache] Failed to fetch items:`, error);
            // Return empty array on error, but don't cache it
            return [];
        }
    }

    /**
     * Get cached plan items, fetching if cache is invalid
     */
    async getCachedItems(): Promise<PlanItem[]> {
        if (this.cache && this.isCacheValid()) {
            return this.cache.items;
        }
        return await this.fetchAndCache();
    }

    /**
     * Get items for a specific date range from cache.
     *
     * @param startDate Start date in YYYY-MM-DD format
     * @param endDate End date in YYYY-MM-DD format
     * @returns Array of plan items within the date range
     *
     * Note: If the requested range extends beyond the cached window (today-7 to today+5),
     * only items within the cached window will be returned. No additional API calls are made.
     */
    async getItemsForDateRange(startDate: string, endDate: string): Promise<PlanItem[]> {
        // Basic validation
        if (startDate > endDate) {
            throw new Error(
                `Invalid date range: startDate "${startDate}" is after endDate "${endDate}".`,
            );
        }

        const allItems = await this.getCachedItems();

        // Check if requested range extends beyond cache window
        if (this.cache) {
            const { startDate: cacheStart, endDate: cacheEnd } = this.cache;

            if (startDate < cacheStart || endDate > cacheEnd) {
                console.warn(
                    `[PlanItemsCache] Requested range ${startDate} to ${endDate} extends beyond ` +
                        `cached window ${cacheStart} to ${cacheEnd}. Only cached items will be returned.`,
                );
            }
        }

        return allItems.filter((item) => {
            const sd = (item as any).scheduledDate ?? (item as any).scheduled_date;
            const dateStr = this.toDateStr(sd);
            return dateStr && dateStr >= startDate && dateStr <= endDate;
        });
    }

    /**
     * Get items for the next N days starting from today.
     *
     * @param days Number of days to fetch (default: 5)
     * @param options.extendCache If true, will fetch more data if requested days exceed cache window (default: false)
     * @returns Array of plan items for the next N days
     *
     * Note: If days extends beyond the cached window (today+5) and extendCache is false,
     * only items within the cached window will be returned with a warning.
     */
    async getItemsForNextDays(
        days: number = 5,
        options: { extendCache?: boolean } = {},
    ): Promise<PlanItem[]> {
        // Basic validation
        if (!Number.isInteger(days) || days < 1) {
            throw new Error(`Invalid days parameter: ${days}. Must be a positive integer.`);
        }

        const today = new Date();
        const end = new Date(today);
        end.setDate(today.getDate() + days - 1);

        const pad = (n: number) => n.toString().padStart(2, "0");
        const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

        // Check if we need to extend cache
        if (options.extendCache && this.cache) {
            const { endDate: cacheEnd } = this.cache;

            if (endStr > cacheEnd) {
                console.log(
                    `[PlanItemsCache] Requested ${days} days extends beyond cache (${cacheEnd}). Extending cache to ${endStr}...`,
                );

                // Temporarily extend the cache window to fetch more data
                await this.fetchAndCacheExtended(endStr);
            }
        }

        return await this.getItemsForDateRange(todayStr, endStr);
    }

    /**
     * Fetch and cache items with an extended end date
     */
    private async fetchAndCacheExtended(extendedEndDate: string): Promise<void> {
        const { startDate } = this.getDateWindow();

        console.log(
            `[PlanItemsCache] Fetching extended range from ${startDate} to ${extendedEndDate}`,
        );

        try {
            // Use the sorted endpoint with both start and end dates for precise filtering
            const items = await apiService.getPlanItemsSorted(
                this.planId,
                startDate,
                extendedEndDate,
            );

            // Items should already be filtered by the server, but double-check for safety
            const windowItems = (items || []).filter((item) => {
                const sd = (item as any).scheduledDate ?? (item as any).scheduled_date;
                const dateStr = this.toDateStr(sd);
                return dateStr && dateStr >= startDate && dateStr <= extendedEndDate;
            });

            // Sort by date
            windowItems.sort((a, b) => {
                const aDate =
                    this.toDateStr((a as any).scheduledDate ?? (a as any).scheduled_date) || "";
                const bDate =
                    this.toDateStr((b as any).scheduledDate ?? (b as any).scheduled_date) || "";
                return aDate.localeCompare(bDate);
            });

            // Cache the results with extended end date
            this.cache = {
                items: windowItems,
                startDate,
                endDate: extendedEndDate,
                fetchedAt: Date.now(),
            };

            console.log(
                `[PlanItemsCache] Extended cache to ${extendedEndDate} with ${windowItems.length} items`,
            );
        } catch (error) {
            console.error(`[PlanItemsCache] Failed to extend cache:`, error);
            // Don't throw - fall back to existing cache
        }
    }

    /**
     * Invalidate plan items cache (call after plan item mutations)
     */
    invalidate(): void {
        console.log(`[PlanItemsCache] Invalidating plan items cache`);
        this.cache = null;
        this.fetchAndCache();
    }

    /**
     * Invalidate workouts cache (call after workout mutations)
     */
    invalidateWorkouts(): void {
        console.log(`[PlanItemsCache] Invalidating workouts cache`);
        this.workoutsCache = [];
        this.workoutsCacheTimestamp = 0;
    }

    /**
     * Check if workouts cache is valid (not expired)
     */
    private isWorkoutsCacheValid(): boolean {
        if (this.workoutsCache.length === 0) {
            console.log(`[PlanItemsCache] Workouts cache validation: No workouts cached`);
            return false;
        }

        const now = Date.now();
        const age = now - this.workoutsCacheTimestamp;

        if (age > this.CACHE_TTL) {
            console.log(
                `[PlanItemsCache] Workouts cache expired: ${Math.round(age / 1000)}s > ${this.CACHE_TTL / 1000}s`,
            );
            return false;
        }

        return true;
    }

    /**
     * Fetch and cache workouts
     */
    private async fetchAndCacheWorkouts(): Promise<Workout[]> {
        try {
            console.log(`[PlanItemsCache] Fetching workouts from API...`);
            const workouts = await apiService.getWorkouts();
            this.workoutsCache = workouts;
            this.workoutsCacheTimestamp = Date.now();
            console.log(`[PlanItemsCache] Workouts cached: ${workouts.length} items`);
            return workouts;
        } catch (error) {
            console.error(`[PlanItemsCache] Failed to fetch workouts:`, error);
            // Return empty array on error, but don't cache it
            return [];
        }
    }

    /**
     * Get cached workouts, fetching if cache is invalid
     */
    async getWorkouts(): Promise<Workout[]> {
        if (this.isWorkoutsCacheValid()) {
            console.log(
                `[PlanItemsCache] Using cached workouts (${this.workoutsCache.length} items)`,
            );
            return this.workoutsCache;
        }

        console.log(`[PlanItemsCache] Workouts cache miss/invalid, fetching...`);
        return await this.fetchAndCacheWorkouts();
    }

    private isTemplateCacheValid(): boolean {
        if (!this.templateCache) return false;
        const age = Date.now() - this.templateCache.fetchedAt;
        return age <= this.CACHE_TTL;
    }

    private async fetchTemplateCache(): Promise<WorkoutPlanTemplate[]> {
        try {
            console.log(`[PlanItemsCache] Fetching workout plan templates from API...`);
            const fetched = await apiService.getWorkoutPlanTemplates();
            this.templateCache = { items: fetched, fetchedAt: Date.now() };
            console.log(`[PlanItemsCache] Cached ${fetched?.length ?? 0} workout plan templates`);
            return fetched;
        } catch (error) {
            console.error(`[PlanItemsCache] Failed to fetch workout plan templates:`, error);
            this.templateCache = null;
            return [];
        }
    }

    async getWorkoutPlanTemplates(): Promise<WorkoutPlanTemplate[]> {
        if (this.isTemplateCacheValid() && this.templateCache) {
            return this.templateCache.items;
        }
        return this.fetchTemplateCache();
    }

    invalidatePlanTemplates(): void {
        this.templateCache = null;
    }

    getWorkoutById(workoutId: string): Workout | null {
        if (!workoutId) return null;
        return this.workoutsCache.find((workout) => workout.id === workoutId) ?? null;
    }

    /**
     * Get cache info for debugging
     */
    getCacheInfo(): {
        itemCount: number;
        startDate: string;
        endDate: string;
        age: number;
        workoutCount: number;
    } | null {
        if (!this.cache) return null;

        const now = Date.now();
        return {
            itemCount: this.cache.items.length,
            startDate: this.cache.startDate,
            endDate: this.cache.endDate,
            age: now - this.cache.fetchedAt,
            workoutCount: this.workoutsCache.length,
        };
    }
}

// Export singleton instance
export const planItemsCache = new PlanItemsCache();
