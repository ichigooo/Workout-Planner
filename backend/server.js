const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
// Increase body size limit to accept base64 image payloads from mobile
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Request logging middleware (development only)
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        const now = new Date().toISOString();
        try {
            console.log(`[${now}] ${req.method} ${req.originalUrl} from ${req.ip}`);
            if (req.query && Object.keys(req.query).length > 0) {
                console.log("  query:", JSON.stringify(req.query));
            }
            if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
                try {
                    console.log("  body:", JSON.stringify(req.body));
                } catch {
                    console.log("  body: <unserializable>");
                }
            }
        } catch {
            // Safe guard to prevent logger from crashing the server
            console.error("Request logger error");
        }
    }
    // Attach start time for request and log when response finishes
    req._startTime = Date.now();
    res.on("finish", () => {
        try {
            const duration = Date.now() - req._startTime;
            console.log(
                `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
            );
        } catch {
            // ignore
        }
    });
    res.on("close", () => {
        try {
            const duration = Date.now() - req._startTime;
            console.log(
                `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} closed by client (${duration}ms)`,
            );
        } catch {
            // ignore
        }
    });
    next();
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes("your-supabase-project-url") ||
    supabaseKey.includes("your-supabase-service-role-key") ||
    !isValidUrl(supabaseUrl)
) {
    console.error("\nSupabase is not configured correctly.");
    console.error("Please set valid values in backend/.env:");
    console.error("  SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
    console.error(
        "\nTip: In Supabase dashboard -> Project Settings -> API, copy the Project URL and Service role key.",
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers
/**
 * mapUserRow
 * Maps a database user row to API-friendly camelCase fields.
 * Accepts both snake_case and camelCase source column names.
 * @param {Object} row - raw DB row
 * @returns {Object} mapped user object
 */
function mapUserRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        profilePhoto: row.profilePhoto,
        birthday: row.birthday,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isAdmin: row.isAdmin,
    };
}

/**
 * uploadAvatarToStorage
 * Uploads a base64/data-URL image to Supabase storage 'avatars' bucket for a given user
 * and returns a public URL. If the input looks like an http(s) URL, returns it unchanged.
 * @param {string} userId
 * @param {string} input - data URL (e.g. data:image/jpeg;base64,...) or raw base64 or http(s) URL
 * @returns {Promise<string|null>} public URL or null on failure
 */
async function uploadAvatarToStorage(userId, input) {
    try {
        if (!input || typeof input !== "string") return null;
        // If it's already an http(s) URL, return as-is
        if (/^https?:\/\//i.test(input)) return input;
        // Reject local device file URIs - server cannot read client sandbox files
        if (/^file:\/\//i.test(input)) {
            const err = new Error("UNSUPPORTED_LOCAL_URI");
            err.code = "UNSUPPORTED_LOCAL_URI";
            throw err;
        }
        let contentType = "image/jpeg";
        let base64Data = input;
        const dataUrlMatch = input.match(/^data:(?<ct>[^;]+);base64,(?<data>[A-Za-z0-9+/=]+)$/);
        if (dataUrlMatch && dataUrlMatch.groups) {
            contentType = dataUrlMatch.groups.ct || contentType;
            base64Data = dataUrlMatch.groups.data || "";
        }
        // Fallback: if not data URL but looks like base64, keep as-is
        const buffer = Buffer.from(base64Data, "base64");
        if (!buffer || buffer.length === 0) return null;

        const ext = contentType.includes("png")
            ? "png"
            : contentType.includes("webp")
              ? "webp"
              : "jpg";
        const filePath = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
            .from("avatars")
            .upload(filePath, buffer, { contentType, upsert: true });
        if (uploadErr) {
            console.error("Supabase storage upload error:", uploadErr);
            return null;
        }
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);
        return pub?.publicUrl || null;
    } catch (e) {
        console.error("uploadAvatarToStorage failed:", e);
        return null;
    }
}

/**
 * uploadImageToStorage
 * Generic uploader for images to a specified Supabase storage bucket.
 * Supports data URLs, raw base64 strings, and http(s) URLs (downloaded then re-uploaded).
 * Falls back to returning the original http(s) URL if fetch is unavailable.
 * @param {string} bucket - storage bucket name (e.g., "workouts", "avatars")
 * @param {string} pathPrefix - folder/prefix path (e.g., userId or workoutId)
 * @param {string} input - data URL, base64, or http(s) URL
 * @returns {Promise<string|null>} public URL or null on failure
 */
async function uploadImageToStorage(bucket, pathPrefix, input) {
    try {
        if (!input || typeof input !== "string") return null;
        if (/^file:\/\//i.test(input)) {
            const err = new Error("UNSUPPORTED_LOCAL_URI");
            err.code = "UNSUPPORTED_LOCAL_URI";
            throw err;
        }

        let contentType = "image/jpeg";
        let buffer = null;

        // data URL
        const dataUrlMatch = input.match(/^data:(?<ct>[^;]+);base64,(?<data>[A-Za-z0-9+/=]+)$/);
        if (dataUrlMatch && dataUrlMatch.groups) {
            contentType = dataUrlMatch.groups.ct || contentType;
            const base64Data = dataUrlMatch.groups.data || "";
            buffer = Buffer.from(base64Data, "base64");
        } else if (/^https?:\/\//i.test(input)) {
            // External URL: download then upload
            if (typeof fetch !== "function") {
                // Environment cannot download; return as-is
                return input;
            }
            const resp = await fetch(input);
            if (!resp.ok) return null;
            const ct = resp.headers.get("content-type");
            if (ct) contentType = ct;
            const ab = await resp.arrayBuffer();
            buffer = Buffer.from(ab);
        } else {
            // Assume raw base64
            buffer = Buffer.from(input, "base64");
        }

        if (!buffer || buffer.length === 0) return null;

        const normalizedCt = (contentType || "image/jpeg").toLowerCase();
        const ext = normalizedCt.includes("png")
            ? "png"
            : normalizedCt.includes("webp")
              ? "webp"
              : normalizedCt.includes("gif")
                ? "gif"
                : "jpg";

        const filePath = `${pathPrefix}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, { contentType: normalizedCt, upsert: true });
        if (uploadErr) {
            console.error(`Supabase storage upload error to bucket ${bucket}:`, uploadErr);
            return null;
        }
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return pub?.publicUrl || null;
    } catch (e) {
        console.error("uploadImageToStorage failed:", e);
        return null;
    }
}

/**
 * uploadWorkoutImageToStorage
 * Convenience wrapper for uploading workout images to the 'workouts' bucket.
 * @param {string} workoutId
 * @param {string} input
 */
async function uploadWorkoutImageToStorage(workoutId, input) {
    return uploadImageToStorage("workouts", workoutId, input);
}

//

/**
 * mapWorkoutRow
 * Maps a database workout row to API-friendly camelCase fields.
 * Normalizes snake_case or camelCase column names and fills defaults.
 * @param {Object} row - raw DB row
 * @returns {Object} mapped workout object
 */
function mapWorkoutRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        workoutType: row.workoutType,
        sets: row.sets ?? null,
        reps: row.reps ?? null,
        duration: row.duration ?? null,
        intensity: row.intensity,
        imageUrl: row.imageUrl ?? null,
        imageUrl2: row.imageUrl2 ?? null,
        isGlobal: row.isGlobal !== undefined ? row.isGlobal : true,
        createdBy: row.createdBy ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

/**
 * mapPlanItemRow
 * Maps a plan_items DB row (single occurrence) to an API-friendly object.
 * Ensures scheduled date normalization and attaches nested workout data if present.
 * @param {Object} row - raw DB row
 * @returns {Object} mapped plan item
 */
function mapPlanItemRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        workoutId: row.workoutId,
        workoutPlanId: row.workoutPlanId,
        // After consolidation each PlanItem represents a single dated occurrence
        scheduledDate: row.scheduled_date,
        intensity: row.intensity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        workout: row.workouts ? mapWorkoutRow(row.workouts) : undefined,
    };
}

/**
 * expandFrequencyToDates
 * Expand a recurrence frequency string (e.g., "Mon,Wed,Fri" or "daily") into
 * concrete ISO date strings within the provided range (or next 90 days by default).
 * @param {string} frequency - comma-separated tokens or 'daily'
 * @param {string|null} startDate - inclusive start date (YYYY-MM-DD) or null
 * @param {string|null} endDate - inclusive end date (YYYY-MM-DD) or null
 * @returns {string[]} array of YYYY-MM-DD dates
 */
// Expand a recurrence string like "Mon,Wed,Fri" or "daily" into concrete dates
function expandFrequencyToDates(frequency, startDate, endDate) {
    if (!frequency) return [];
    const tokens = frequency
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    const results = [];
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
        ? new Date(endDate)
        : new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000);

    // Normalize tokens (daily or weekday short/full)
    const isDaily = tokens.some((t) => t === "daily");
    const tokenShorts = new Set(tokens.map((t) => t.slice(0, 3)));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isDaily) {
            results.push(new Date(d).toISOString().split("T")[0]);
            continue;
        }
        const dayFull = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const dayShort = dayFull.slice(0, 3);
        if (tokenShorts.has(dayShort) || tokenShorts.has(dayFull)) {
            results.push(new Date(d).toISOString().split("T")[0]);
        }
    }
    return results;
}

// (removed) addWorkoutToPlanByDate helper was unused

/**
 * mapPlanRow
 * Maps a workout_plan DB row to an API-friendly object. Normalizes field names
 * and maps nested plan items via mapPlanItemRow.
 * @param {Object} row - raw DB row
 * @returns {Object} mapped plan
 */
function mapPlanRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        name: row.name, // may be null for routine
        startDate: row.startDate ?? row.start_date, // may be null for routine
        endDate: row.endDate ?? row.end_date, // may be null for routine
        userId: row.user_id ?? row.userId,
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
        isRoutine: row.is_routine === true || row.isRoutine === true,
        planItems: Array.isArray(row.plan_items) ? row.plan_items.map(mapPlanItemRow) : [],
    };
}
/**
 * resolveUserIdOrCreateFallback
 * Verifies the provided userId exists. If missing, returns an existing test user id
 * or creates a fallback user and returns its id. Used by server-side creation flows
 * where a user context is required.
 * @param {string|null} providedUserId
 * @returns {Promise<string>} user id to use
 */
async function resolveUserIdOrCreateFallback(providedUserId) {
    if (providedUserId) {
        // Validate the provided user exists
        const { data: existing, error: findErr } = await supabase
            .from("users")
            .select("id")
            .eq("id", providedUserId)
            .single();
        if (!findErr && existing?.id) return existing.id;
    }

    // Try to use an existing user
    const { data: anyUser } = await supabase
        .from("users")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (anyUser?.id) return anyUser.id;

    // Create a fallback user
    const { data: created, error: createErr } = await supabase
        .from("users")
        .insert([{ email: "test@example.com", name: "Test User" }])
        .select("id")
        .single();
    if (createErr) throw createErr;
    return created.id;
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Workout routes
app.get("/api/workouts", async (req, res) => {
    console.log("[GET /api/workouts] received request");
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select("*")
            .order("createdAt", { ascending: false });

        if (error) throw error;
        const mapped = Array.isArray(data) ? data.map(mapWorkoutRow) : [];
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ error: "Failed to fetch workouts" });
    }
});

app.post("/api/workouts", async (req, res) => {
    console.log("[POST /api/workouts] received request");
    try {
        const body = req.body || {};

        // Auto-detect workout type based on category
        const workoutType = body.category === "Cardio" ? "cardio" : "strength";

        // Pre-generate id so we can use it for storage path
        const workoutId = require("crypto").randomUUID();

        // Handle images: upload data/base64 and http(s) URLs to 'workouts' storage; reject file://
        let imageUrl = null;
        if (body.imageUrl !== undefined) {
            if (/^file:\/\//i.test(body.imageUrl)) {
                return res.status(400).json({
                    error: "Please send imageUrl as a data URL (base64) or http(s) URL, not a file:// URI.",
                });
            } else {
                const uploaded = await uploadWorkoutImageToStorage(workoutId, body.imageUrl);
                imageUrl = uploaded || (/^https?:\/\//i.test(body.imageUrl) ? body.imageUrl : null);
            }
        }

        let imageUrl2 = null;
        if (body.imageUrl2 !== undefined) {
            if (/^file:\/\//i.test(body.imageUrl2)) {
                return res.status(400).json({
                    error: "Please send imageUrl2 as a data URL (base64) or http(s) URL, not a file:// URI.",
                });
            } else {
                const uploaded2 = await uploadWorkoutImageToStorage(workoutId, body.imageUrl2);
                imageUrl2 =
                    uploaded2 || (/^https?:\/\//i.test(body.imageUrl2) ? body.imageUrl2 : null);
            }
        }

        // Map camelCase from client to snake_case columns
        const insert = {
            id: workoutId,
            title: body.title,
            category: body.category,
            description: body.description ?? null,
            workoutType: workoutType, // Auto-determined (camelCase column)
            sets: body.sets ?? null,
            reps: body.reps ?? null,
            duration: body.duration ?? null,
            intensity: body.intensity,
            imageUrl: imageUrl,
            imageUrl2: imageUrl2,
            isGlobal: true, // All workouts are global by default
            createdBy: body.createdBy ?? null, // Optional: who created this workout
        };

        // Ensure timestamps are provided to match DB NOT NULL constraints
        insert.createdAt = new Date().toISOString();
        insert.updatedAt = new Date().toISOString();

        const { data, error } = await supabase.from("workouts").insert([insert]).select().single();

        if (error) throw error;
        res.status(201).json(mapWorkoutRow(data));
    } catch (error) {
        console.error("Error creating workout:", error);
        res.status(500).json({ error: "Failed to create workout" });
    }
});

app.get("/api/workouts/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: "Workout not found" });
        }
        res.json(mapWorkoutRow(data));
    } catch (error) {
        console.error("Error fetching workout:", error);
        res.status(500).json({ error: "Failed to fetch workout" });
    }
});

app.put("/api/workouts/:id", async (req, res) => {
    try {
        const body = req.body || {};
        // Auto-detect workout type based on category
        const workoutType = body.category === "Cardio" ? "cardio" : "strength";

        const workoutId = req.params.id;

        // Compute image fields only if provided, otherwise leave undefined to avoid overwriting
        let computedImageUrl = undefined;
        if (body.imageUrl !== undefined) {
            if (/^file:\/\//i.test(body.imageUrl)) {
                return res.status(400).json({
                    error: "Please send imageUrl as a data URL (base64) or http(s) URL, not a file:// URI.",
                });
            } else {
                const uploaded = await uploadWorkoutImageToStorage(workoutId, body.imageUrl);
                if (!uploaded) {
                    throw new Error("IMAGE_UPLOAD_FAILED");
                }
                computedImageUrl = uploaded;
            }
        }

        let computedImageUrl2 = undefined;
        if (body.imageUrl2 !== undefined) {
            if (/^file:\/\//i.test(body.imageUrl2)) {
                return res.status(400).json({
                    error: "Please send imageUrl2 as a data URL (base64) or http(s) URL, not a file:// URI.",
                });
            } else {
                const uploaded2 = await uploadWorkoutImageToStorage(workoutId, body.imageUrl2);
                if (!uploaded2) {
                    throw new Error("IMAGE_UPLOAD_FAILED");
                }
                computedImageUrl2 = uploaded2;
            }
        }

        const update = {
            title: body.title,
            category: body.category,
            description: body.description ?? null,
            workoutType: workoutType, // Auto-determined
            sets: body.sets ?? null,
            reps: body.reps ?? null,
            duration: body.duration ?? null,
            intensity: body.intensity,
            imageUrl: computedImageUrl,
            imageUrl2: computedImageUrl2,
            // Note: is_global and created_by are not updated here to maintain data integrity
            updatedAt: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("workouts")
            .update(update)
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapWorkoutRow(data));
    } catch (error) {
        console.error("Error updating workout:", error);
        res.status(500).json({ error: "Failed to update workout" });
    }
});

app.delete("/api/workouts/:id", async (req, res) => {
    try {
        const { error } = await supabase.from("workouts").delete().eq("id", req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting workout:", error);
        res.status(500).json({ error: "Failed to delete workout" });
    }
});

// Workout Plan routes
app.get("/api/workout-plans", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("workout_plans")
            .select(
                `
        *,
        plan_items (
          *,
          workouts (*)
        )
      `,
            )
            .order("createdAt", { ascending: false });

        if (error) throw error;
        const mapped = Array.isArray(data) ? data.map(mapPlanRow) : [];
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching workout plans:", error);
        res.status(500).json({ error: "Failed to fetch workout plans" });
    }
});

// Create or return default routine for a user (90 days)
app.post("/api/users/:id/default-plan", async (req, res) => {
    try {
        const userId = req.params.id;
        // Check if user already has a plan
        const { data: existingPlans, error: existingErr } = await supabase
            .from("workout_plans")
            .select("*")
            .eq("userId", userId)
            .order("createdAt", { ascending: false });

        if (existingErr) throw existingErr;
        if (Array.isArray(existingPlans) && existingPlans.length > 0) {
            // Return the most recent plan
            return res.json(mapPlanRow(existingPlans[0]));
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 90);

        const insert = {
            id: require("crypto").randomUUID(),
            // some DBs have name NOT NULL; use empty string as default
            name: "",
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            userId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("workout_plans")
            .insert([insert])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(mapPlanRow(data));
    } catch (error) {
        console.error("Error creating default plan:", error);
        res.status(500).json({ error: "Failed to create default plan" });
    }
});

// Add workout to plan for a specific date (single occurrence)
app.post("/api/workout-plans/:id/plan-items/date", async (req, res) => {
    try {
        const planId = req.params.id;
        const body = req.body || {};
        const workoutId = body.workoutId;
        const date = body.date; // expected YYYY-MM-DD
        const intensity = body.intensity ?? null;

        if (!workoutId || !date) {
            return res.status(400).json({ error: "workoutId and date are required" });
        }

        const id = require("crypto").randomUUID();
        const now = new Date().toISOString();

        // Try inserting using camelCase (scheduledDate) first, fallback to snake_case (scheduled_date)
        const insert = {
            id,
            workoutId,
            workoutPlanId: planId,
            scheduled_date: date,
            intensity,
            createdAt: now,
            updatedAt: now,
        };

        const { data, error } = await supabase
            .from("plan_items")
            .insert([insert])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(mapPlanItemRow(data));
    } catch (error) {
        console.error("Error adding workout to plan by date:", error);
        res.status(500).json({ error: "Failed to add workout to plan by date" });
    }
});

app.post("/api/workout-plans", async (req, res) => {
    try {
        const body = req.body || {};
        // Map camelCase to snake_case; routine plans have no name and no date range
        const insert = {
            name: body.isRoutine ? null : (body.name ?? null),
            startDate: body.isRoutine ? null : (body.startDate ?? null),
            endDate: body.isRoutine ? null : (body.endDate ?? null),
            userId: await resolveUserIdOrCreateFallback(body.userId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("workout_plans")
            .insert([insert])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(mapPlanRow(data));
    } catch (error) {
        console.error("Error creating workout plan:", error);
        res.status(500).json({ error: "Failed to create workout plan" });
    }
});

app.post("/api/workout-plans/:id/plan-items", async (req, res) => {
    try {
        const body = req.body || {};
        // Accept either explicit dates or a frequency token from client.
        // If body.dates is provided (array of 'YYYY-MM-DD'), insert those explicit dates.
        // Else if body.frequency is provided, expand into dates for the next 90 days (or plan range).

        const planId = req.params.id;
        const workoutId = body.workoutId;
        const intensity = body.intensity ?? null;

        // Determine dates to insert (explicit dates, expanded frequency, or fallback to plan start/current date)
        let dates = [];
        if (Array.isArray(body.dates) && body.dates.length > 0) {
            dates = body.dates;
        } else if (body.frequency) {
            const { data: planRows } = await supabase
                .from("workout_plans")
                .select("startDate,start_date,endDate,end_date")
                .eq("id", planId)
                .single();
            const startDate = planRows?.startDate ?? planRows?.start_date ?? null;
            const endDate = planRows?.endDate ?? planRows?.end_date ?? null;
            dates = expandFrequencyToDates(body.frequency, startDate, endDate);
        } else {
            // No dates or frequency provided - use plan start date or today
            const { data: planRow } = await supabase
                .from("workout_plans")
                .select("startDate,start_date")
                .eq("id", planId)
                .single();
            const fallback =
                planRow?.startDate ?? planRow?.start_date ?? new Date().toISOString().split("T")[0];
            dates = [fallback];
        }

        if (dates.length === 0) {
            return res.status(400).json({ error: "No dates determined for plan item insertion" });
        }

        // Build dated plan_items rows (each row is a single dated occurrence)
        const now = new Date().toISOString();
        const inserts = dates.map((d) => ({
            id: require("crypto").randomUUID(),
            workoutId: workoutId,
            workoutPlanId: planId,
            scheduled_date: d,
            intensity,
            createdAt: now,
            updatedAt: now,
        }));

        // Bulk insert into plan_items
        const { data: insertedRows, error: insertErr2 } = await supabase
            .from("plan_items")
            .insert(inserts)
            .select("*, workouts(*)");
        if (insertErr2) {
            console.error("Error inserting dated plan_items:", insertErr2);
            // Return 500 but include error details for debugging
            return res
                .status(500)
                .json({ error: "Failed to insert dated plan items", details: insertErr2 });
        }

        // Map and return the created plan items
        const mapped = Array.isArray(insertedRows)
            ? insertedRows.map(mapPlanItemRow)
            : [mapPlanItemRow(insertedRows)];
        // If only one item was inserted, return a single object for backwards compatibility
        if (mapped.length === 1) return res.status(201).json(mapped[0]);
        return res.status(201).json(mapped);
    } catch (error) {
        console.error("Error creating plan item:", error);
        res.status(500).json({ error: "Failed to create plan item" });
    }
});

// Get plan items for a specific workout plan, sorted by scheduled_date (limit 30)
app.get("/api/workout-plans/:id/plan-items-sorted", async (req, res) => {
    try {
        const planId = req.params.id;
        // Optional start date filter (YYYY-MM-DD); if provided, only return items scheduled on/after this date
        const start = req.query.start;
        let query = supabase
            .from("plan_items")
            .select("*, workouts(*)")
            .eq("workoutPlanId", planId);
        if (typeof start === "string" && start.length >= 10) {
            query = query.gte("scheduled_date", start);
        }
        const { data, error } = await query.order("scheduled_date", { ascending: true }).limit(30);

        if (error) throw error;

        const mapped = Array.isArray(data) ? data.map(mapPlanItemRow) : [];
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching sorted plan items:", error);
        res.status(500).json({ error: "Failed to fetch plan items" });
    }
});

// Get plan items for a specific workout plan for a given month/year
// Query params: year=YYYY (default current year), month=1-12 (default current month)
app.get("/api/workout-plans/:id/plan-items-by-month", async (req, res) => {
    try {
        const planId = req.params.id;
        const qYear = parseInt(req.query.year, 10);
        const qMonth = parseInt(req.query.month, 10);

        const now = new Date();
        const year = Number.isFinite(qYear) && qYear > 0 ? qYear : now.getFullYear();
        const month =
            Number.isFinite(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : now.getMonth() + 1;

        // start is inclusive first day of month, end is exclusive first day of next month
        // Use local dates (no UTC conversion) to avoid timezone shifts when comparing timestamps stored without timezone
        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
        const startDate = `${year}-${pad(month)}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const endDate = `${nextYear}-${pad(nextMonth)}-01`;

        const { data, error } = await supabase
            .from("plan_items")
            .select("*, workouts(*)")
            .eq("workoutPlanId", planId)
            .gte("scheduled_date", startDate)
            .lt("scheduled_date", endDate)
            .order("scheduled_date", { ascending: true })
            .limit(1000);

        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];
        // Normalize scheduled_date to date-only string to avoid timezone shifts on clients
        const normalized = rows.map((r) => {
            const sd = r.scheduled_date ?? r.scheduledDate ?? null;
            const sdStr = sd
                ? typeof sd === "string"
                    ? sd.split("T")[0].split(" ")[0]
                    : new Date(sd).toISOString().split("T")[0]
                : null;
            return { ...r, scheduled_date: sdStr };
        });
        const mapped = normalized.map(mapPlanItemRow);
        res.json({ year, month, items: mapped });
    } catch (error) {
        console.error("Error fetching plan items by month:", error);
        res.status(500).json({ error: "Failed to fetch plan items by month" });
    }
});

// Delete plan item
app.delete("/api/plan-items/:id", async (req, res) => {
    try {
        const { error } = await supabase.from("plan_items").delete().eq("id", req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting plan item:", error);
        res.status(500).json({ error: "Failed to delete plan item" });
    }
});

// User Profile Endpoints

// Get user profile
app.get("/api/users/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error) throw error;
        res.json(mapUserRow(data));
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

// Update user profile
app.put("/api/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, profilePhoto, birthday } = req.body;

        // Prepare update data (only include fields that are provided)
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (profilePhoto !== undefined) {
            // If profilePhoto is provided as data URL/base64/local URI, upload to Supabase storage and save URL
            if (/^file:\/\//i.test(profilePhoto)) {
                return res.status(400).json({
                    error: "Please send profilePhoto as a data URL (base64), not a file:// URI.",
                });
            }
            const uploaded = await uploadAvatarToStorage(userId, profilePhoto);
            if (uploaded) updateData.profilePhoto = uploaded;
            else if (/^https?:\/\//i.test(profilePhoto)) updateData.profilePhoto = profilePhoto;
        }
        if (birthday !== undefined) updateData.birthday = birthday;

        const { data, error } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;
        res.json(mapUserRow(data));
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Failed to update user profile" });
    }
});

// Create a new user
app.post("/api/users", async (req, res) => {
    try {
        const body = req.body || {};
        const email = body.email;
        if (!email) return res.status(400).json({ error: "email is required" });

        // Check for existing email
        const { data: existing, error: findErr } = await supabase
            .from("users")
            .select("id,email")
            .eq("email", email)
            .maybeSingle();
        if (findErr) throw findErr;
        if (existing && existing.email) {
            return res
                .status(409)
                .json({ error: "User with this email already exists", id: existing.id });
        }

        const id = body.id || require("crypto").randomUUID();
        const insert = {
            id,
            email,
            name: body.name ?? null,
            profilePhoto: body.profilePhoto ?? null,
            birthday: body.birthday ?? null,
            isAdmin: body.isAdmin === true ? true : false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { data, error } = await supabase.from("users").insert([insert]).select().single();
        if (error) {
            // If conflict occurred at DB level, surface it
            console.error("Supabase insert error for /api/users:", error);
            return res.status(500).json({ error: "Failed to create user", details: error });
        }

        res.status(201).json(mapUserRow(data));
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
