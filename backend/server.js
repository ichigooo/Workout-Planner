const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { createId } = require("@paralleldrive/cuid2");

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
const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

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
        isAdmin: row.isAdmin ?? row.is_admin ?? false,
    };
}

/**
 * ensureUserExistsOrRespond
 * Verifies that a user with the given ID exists in the `users` table.
 * If not, sends an appropriate HTTP response and returns false.
 * Intended to be called at the top of any route that relies on a user row.
 * @param {string} userId
 * @param {import('express').Response} res
 * @returns {Promise<boolean>}
 */
async function ensureUserExistsOrRespond(userId, res) {
    if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return false;
    }

    try {
        const { data, error } = await supabase
            .from("users")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Error verifying user existence:", error);
            res.status(500).json({ error: "Failed to verify user" });
            return false;
        }

        if (!data) {
            const autoProvisioned = await autoProvisionUserFromAuth(userId);
            if (!autoProvisioned) {
                res.status(404).json({ error: "User not found" });
                return false;
            }
            return true;
        }

        return true;
    } catch (err) {
        console.error("Unexpected error verifying user existence:", err);
        res.status(500).json({ error: "Failed to verify user" });
        return false;
    }
}

/**
 * requireAdmin
 * Simple admin check middleware for personal use.
 * Checks if the userId in the request has isAdmin=true in the database.
 */
async function requireAdmin(req, res, next) {
    try {
        // Get userId from body or query params
        const userId = req.body?.userId || req.query?.userId;

        if (!userId) {
            return res.status(400).json({
                error: "userId is required"
            });
        }

        // Check if user is admin
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error checking admin status:", error);
            return res.status(500).json({ error: "Failed to verify admin status" });
        }

        const adminFlag = data?.isAdmin ?? data?.is_admin ?? false;
        if (!adminFlag) {
            return res.status(403).json({
                error: "Admin privileges required"
            });
        }

        next();
    } catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({ error: "Failed to verify admin status" });
    }
}

/**
 * Attempts to create a user row in `users` by pulling metadata from Supabase Auth.
 * This is a safety net for cases where the mobile client has not explicitly created
 * the profile yet (e.g., race conditions during sign-up).
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function autoProvisionUserFromAuth(userId) {
    if (!userId) return false;
    try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (error) {
            console.warn(`[autoProvisionUser] Auth lookup failed for ${userId}:`, error);
            return false;
        }
        const authUser = data?.user;
        if (!authUser || !authUser.email) {
            console.warn(
                `[autoProvisionUser] Cannot provision user ${userId} without auth record/email.`,
            );
            return false;
        }

        const metadata = authUser.user_metadata || {};
        const insert = {
            id: authUser.id,
            email: authUser.email,
            name: metadata.full_name || metadata.name || null,
            profilePhoto: metadata.avatar_url || metadata.picture || null,
            birthday: null,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase.from("users").upsert([insert], {
            onConflict: "id",
        });
        if (upsertError) {
            console.error(`[autoProvisionUser] Failed to insert user ${userId}:`, upsertError);
            return false;
        }
        console.log(`[autoProvisionUser] Provisioned user record for ${userId}`);
        return true;
    } catch (err) {
        console.error(`[autoProvisionUser] Unexpected error provisioning ${userId}:`, err);
        return false;
    }
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
        trackRecords: row.trackRecords ?? false,
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

function mapPersonalRecordRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        userId: row.userId ?? row.user_id,
        workoutId: row.workoutId ?? row.workout_id,
        value: row.value,
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
    };
}

function mapPREntryRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        userId: row.userId,
        workoutId: row.workoutId,
        reps: row.reps,
        weight: row.weight,
        dateAchieved: row.dateAchieved,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function mapRepConfigRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        userId: row.userId,
        workoutId: row.workoutId,
        customReps: row.customReps ?? [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
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
 * mapPlanTemplateRow
 * Normalizes workout_plan_templates rows into camelCase objects for the API.
 * @param {Object} row
 * @returns {Object}
 */
function mapPlanTemplateRow(row) {
    if (!row) return row;
    let structure = row.workoutStructure ?? row.workout_structure ?? [];
    try {
        structure = normalizeWorkoutStructureInput(structure);
    } catch {
        structure = [];
    }
    console.log("Normalized workout structure:", structure);
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        numWeeks: row.numWeeks ?? row.num_weeks,
        daysPerWeek: row.daysPerWeek ?? row.days_per_week,
        workoutStructure: structure,
        level: row.level ?? null,
        createdBy: row.createdBy ?? row.created_by ?? null,
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
    };
}

function mapWorkoutImportRow(row) {
    if (!row) return row;
    return {
        id: row.id,
        userId: row.userId ?? row.user_id,
        sourceUrl: row.sourceUrl ?? row.source_url,
        sourcePlatform: row.sourcePlatform ?? row.source_platform ?? null,
        title: row.title ?? null,
        category: row.category ?? null,
        description: row.description ?? null,
        thumbnailUrl: row.thumbnailUrl ?? row.thumbnail_url ?? null,
        html: row.html ?? row.embed_html ?? null,
        metadata: row.metadata ?? null,
        isGlobal: row.isGlobal ?? row.is_global ?? false,
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
    };
}

const INSTAGRAM_ALLOWED_HOSTS = ["instagram.com", "www.instagram.com", "m.instagram.com"];
const YOUTUBE_ALLOWED_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

function normalizeInstagramUrl(input) {
    if (!input || typeof input !== "string") throw new Error("INVALID_URL");
    let raw = input.trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        raw = `https://${raw}`;
    }
    const parsed = new URL(raw);
    if (!INSTAGRAM_ALLOWED_HOSTS.some((host) => parsed.hostname.toLowerCase().endsWith(host))) {
        throw new Error("INVALID_INSTAGRAM_DOMAIN");
    }
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
}

function normalizeYouTubeUrl(input) {
    if (!input || typeof input !== "string") throw new Error("INVALID_URL");
    let raw = input.trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        raw = `https://${raw}`;
    }
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (!YOUTUBE_ALLOWED_HOSTS.some((allowed) => host === allowed)) {
        throw new Error("INVALID_YOUTUBE_DOMAIN");
    }
    if (host === "youtu.be") {
        const videoId = parsed.pathname.replace("/", "");
        if (!videoId) throw new Error("INVALID_YOUTUBE_URL");
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        if (id) {
            parsed.pathname = "/watch";
            parsed.searchParams.set("v", id);
        }
    }
    return parsed.toString();
}

async function fetchInstagramMetadata(instagramUrl) {
    if (!facebookAppId || !facebookAppSecret) {
        throw new Error("INSTAGRAM_OEMBED_NOT_CONFIGURED");
    }
    const normalizedUrl = normalizeInstagramUrl(instagramUrl);
    const endpoint = new URL("https://graph.facebook.com/v19.0/instagram_oembed");
    endpoint.searchParams.set("url", normalizedUrl);
    endpoint.searchParams.set("access_token", `${facebookAppId}|${facebookAppSecret}`);
    endpoint.searchParams.set("omitscript", "true");
    endpoint.searchParams.set("hidecaption", "false");

    const response = await fetch(endpoint.toString(), {
        headers: { "user-agent": "WorkoutPlannerBot/1.0" },
    });
    console.log("Instagram oEmbed response status:", response.status);
    const text = await response.text();
    if (!response.ok) {
        console.error("Instagram oEmbed failed:", text);
        throw new Error(`INSTAGRAM_OEMBED_FAILED_${response.status}`);
    }

    let payload;
    try {
        payload = JSON.parse(text);
    } catch (err) {
        console.error("Invalid Instagram oEmbed payload:", err);
        throw new Error("INSTAGRAM_OEMBED_INVALID_RESPONSE");
    }

    return {
        normalizedUrl,
        title: payload.title || payload.author_name || null,
        description: payload.author_name || null,
        thumbnailUrl: payload.thumbnail_url || null,
        mediaUrl: payload.thumbnail_url || null,
        ogType: payload.provider_name || null,
        html: payload.html || null,
        raw: payload,
    };
}

async function fetchYouTubeMetadata(youtubeUrl) {
    const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("url", normalizedUrl);
    const response = await fetch(endpoint.toString(), {
        headers: { "user-agent": "WorkoutPlannerBot/1.0" },
    });
    const text = await response.text();
    if (!response.ok) {
        console.error("YouTube oEmbed failed:", text);
        throw new Error(`YOUTUBE_OEMBED_FAILED_${response.status}`);
    }
    let payload;
    try {
        payload = JSON.parse(text);
    } catch (err) {
        console.error("Invalid YouTube oEmbed payload:", err);
        throw new Error("YOUTUBE_OEMBED_INVALID_RESPONSE");
    }
    return {
        normalizedUrl,
        title: payload.title || null,
        description: payload.author_name || null,
        thumbnailUrl: payload.thumbnail_url || null,
        mediaUrl: payload.thumbnail_url || null,
        ogType: payload.provider_name || null,
        html: payload.html || null,
        raw: payload,
    };
}

/**
 * normalizeWorkoutStructureInput
 * Ensures the incoming workoutStructure matches the expected string[][] shape.
 * Empty strings/null entries are converted to null to keep JSON clean.
 * @param {any} structure
 * @returns {Array<Array<string|null>>}
 */
function normalizeWorkoutStructureInput(structure) {
    if (!Array.isArray(structure)) {
        throw new Error("workoutStructure must be an array of week arrays.");
    }
    return structure.map((week, weekIdx) => {
        if (!Array.isArray(week)) {
            throw new Error(`workoutStructure[${weekIdx}] must be an array of days.`);
        }
        return week.map((day, dayIdx) => {
            const fallbackName = `Day ${dayIdx + 1}`;

            // If already in new object format
            if (day && typeof day === "object" && !Array.isArray(day)) {
                const name =
                    typeof day.name === "string" && day.name.trim().length > 0
                        ? day.name.trim()
                        : fallbackName;
                const idsSource = Array.isArray(day.workoutIds) ? day.workoutIds : [];
                const workoutIds = idsSource
                    .map((workoutId, workoutIdx) => {
                        if (workoutId == null) return null;
                        if (typeof workoutId !== "string") {
                            throw new Error(
                                `workoutStructure[${weekIdx}][${dayIdx}].workoutIds[${workoutIdx}] must be a string`,
                            );
                        }
                        const trimmed = workoutId.trim();
                        return trimmed.length > 0 ? trimmed : null;
                    })
                    .filter(Boolean);
                return { name, workoutIds };
            }

            // Legacy array format
            if (Array.isArray(day)) {
                const workoutIds = day
                    .map((workoutId, workoutIdx) => {
                        if (workoutId == null) return null;
                        if (typeof workoutId !== "string") {
                            throw new Error(
                                `workoutStructure[${weekIdx}][${dayIdx}][${workoutIdx}] must be a string`,
                            );
                        }
                        const trimmed = workoutId.trim();
                        return trimmed.length > 0 ? trimmed : null;
                    })
                    .filter(Boolean);
                return { name: fallbackName, workoutIds };
            }

            if (typeof day === "string") {
                const trimmed = day.trim();
                return { name: fallbackName, workoutIds: trimmed ? [trimmed] : [] };
            }

            if (day == null) {
                return { name: fallbackName, workoutIds: [] };
            }

            throw new Error(
                `workoutStructure[${weekIdx}][${dayIdx}] must be an object or array of workout IDs`,
            );
        });
    });
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

app.put("/api/workouts/:id", requireAdmin, async (req, res) => {
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
            trackRecords: body.trackRecords ?? false,
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

app.delete("/api/workouts/:id", requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from("workouts").delete().eq("id", req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting workout:", error);
        res.status(500).json({ error: "Failed to delete workout" });
    }
});

app.get("/api/workouts/:id/personal-record", async (req, res) => {
    const workoutId = req.params.id;
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { data, error } = await supabase
            .from("workout_personal_records")
            .select("*")
            .eq("workout_id", workoutId)
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.json(null);

        res.json(mapPersonalRecordRow(data));
    } catch (error) {
        console.error("Error fetching personal record:", error);
        res.status(500).json({ error: "Failed to fetch personal record" });
    }
});

app.put("/api/workouts/:id/personal-record", async (req, res) => {
    const workoutId = req.params.id;
    const { userId, value } = req.body || {};
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const normalizedValue = typeof value === "string" ? value.trim() : "";

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        if (!normalizedValue) {
            const { error } = await supabase
                .from("workout_personal_records")
                .delete()
                .eq("workout_id", workoutId)
                .eq("user_id", userId);
            if (error) throw error;
            return res.status(204).send();
        }

        const payload = {
            workout_id: workoutId,
            user_id: userId,
            value: normalizedValue,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("workout_personal_records")
            .upsert([payload], { onConflict: "user_id,workout_id" })
            .select()
            .single();

        if (error) throw error;
        res.json(mapPersonalRecordRow(data));
    } catch (error) {
        console.error("Error upserting personal record:", error);
        res.status(500).json({ error: "Failed to save personal record" });
    }
});

app.delete("/api/workouts/:id/personal-record", async (req, res) => {
    const workoutId = req.params.id;
    const userId = req.query.userId || req.body?.userId;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { error } = await supabase
            .from("workout_personal_records")
            .delete()
            .eq("workout_id", workoutId)
            .eq("user_id", userId);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting personal record:", error);
        res.status(500).json({ error: "Failed to delete personal record" });
    }
});

// ==================== PR Entry Endpoints (new structured PR tracking) ====================

// Get all PR entries for a workout (full history)
app.get("/api/workouts/:workoutId/pr-entries", async (req, res) => {
    const { workoutId } = req.params;
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { data: entries, error } = await supabase
            .from("personal_record_entries")
            .select("*")
            .eq("workoutId", workoutId)
            .eq("userId", userId)
            .order("dateAchieved", { ascending: false });

        if (error) throw error;
        res.json((entries || []).map(mapPREntryRow));
    } catch (error) {
        console.error("Error fetching PR entries:", error);
        res.status(500).json({ error: "Failed to fetch PR entries" });
    }
});

// Get current best PR for each rep count
app.get("/api/workouts/:workoutId/pr-entries/current", async (req, res) => {
    const { workoutId } = req.params;
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        // Get all entries for this workout and user
        const { data: entries, error } = await supabase
            .from("personal_record_entries")
            .select("*")
            .eq("workoutId", workoutId)
            .eq("userId", userId);

        if (error) throw error;

        // Group by reps and find the best (max weight) for each
        const repGroups = {};
        for (const entry of entries || []) {
            if (!repGroups[entry.reps] || entry.weight > repGroups[entry.reps].weight) {
                repGroups[entry.reps] = entry;
            }
        }

        const currentBest = Object.values(repGroups).map((entry) => ({
            reps: entry.reps,
            weight: entry.weight,
            dateAchieved: entry.dateAchieved,
            entryId: entry.id,
        }));

        res.json(currentBest);
    } catch (error) {
        console.error("Error fetching current PRs:", error);
        res.status(500).json({ error: "Failed to fetch current PRs" });
    }
});

// Create a new PR entry
app.post("/api/workouts/:workoutId/pr-entries", async (req, res) => {
    const { workoutId } = req.params;
    const { userId, reps, weight, dateAchieved } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    if (typeof reps !== "number" || reps < 1 || reps > 20) {
        return res.status(400).json({ error: "reps must be a number between 1 and 20" });
    }
    if (typeof weight !== "number" || weight <= 0) {
        return res.status(400).json({ error: "weight must be a positive number" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        // Find the current best for this rep count
        const { data: existingEntries, error: fetchError } = await supabase
            .from("personal_record_entries")
            .select("*")
            .eq("workoutId", workoutId)
            .eq("userId", userId)
            .eq("reps", reps)
            .order("weight", { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

        const previousBest = existingEntries?.[0] || null;
        const isNewRecord = !previousBest || weight > previousBest.weight;

        // Create the new entry
        const now = new Date().toISOString();
        const { data: entry, error: insertError } = await supabase
            .from("personal_record_entries")
            .insert([{
                id: createId(),
                userId,
                workoutId,
                reps,
                weight,
                dateAchieved: dateAchieved ? new Date(dateAchieved).toISOString() : now,
                createdAt: now,
                updatedAt: now,
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({
            entry: mapPREntryRow(entry),
            isNewRecord,
            previousBest: previousBest
                ? { weight: previousBest.weight, dateAchieved: previousBest.dateAchieved }
                : null,
        });
    } catch (error) {
        console.error("Error creating PR entry:", error);
        res.status(500).json({ error: "Failed to create PR entry" });
    }
});

// Delete a specific PR entry
app.delete("/api/workouts/:workoutId/pr-entries/:entryId", async (req, res) => {
    const { workoutId, entryId } = req.params;
    const userId = req.query.userId || req.body?.userId;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { error } = await supabase
            .from("personal_record_entries")
            .delete()
            .eq("id", entryId)
            .eq("workoutId", workoutId)
            .eq("userId", userId);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting PR entry:", error);
        res.status(500).json({ error: "Failed to delete PR entry" });
    }
});

// Get user's custom rep config for a workout
app.get("/api/workouts/:workoutId/rep-config", async (req, res) => {
    const { workoutId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { data: config, error } = await supabase
            .from("user_workout_rep_configs")
            .select("*")
            .eq("userId", userId)
            .eq("workoutId", workoutId)
            .maybeSingle();

        if (error) throw error;
        res.json(config ? mapRepConfigRow(config) : { customReps: [] });
    } catch (error) {
        console.error("Error fetching rep config:", error);
        res.status(500).json({ error: "Failed to fetch rep config" });
    }
});

// Update user's custom rep config for a workout
app.put("/api/workouts/:workoutId/rep-config", async (req, res) => {
    const { workoutId } = req.params;
    const { userId, customReps } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    if (!Array.isArray(customReps) || customReps.length > 2) {
        return res.status(400).json({ error: "customReps must be an array with max 2 items" });
    }
    if (customReps.some((r) => typeof r !== "number" || r < 1 || r > 20)) {
        return res.status(400).json({ error: "Each rep count must be a number between 1 and 20" });
    }

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        // Check if config already exists
        const { data: existingConfig } = await supabase
            .from("user_workout_rep_configs")
            .select("id")
            .eq("userId", userId)
            .eq("workoutId", workoutId)
            .single();

        const configId = existingConfig?.id || createId();
        const now = new Date().toISOString();
        const { data: config, error } = await supabase
            .from("user_workout_rep_configs")
            .upsert([{ id: configId, userId, workoutId, customReps, createdAt: now, updatedAt: now }], { onConflict: "userId,workoutId" })
            .select()
            .single();

        if (error) throw error;
        res.json(mapRepConfigRow(config));
    } catch (error) {
        console.error("Error updating rep config:", error);
        res.status(500).json({ error: "Failed to update rep config" });
    }
});

// Get all PRs for a user across all tracked workouts (for My PRs page)
app.get("/api/users/:userId/all-prs", async (req, res) => {
    const { userId } = req.params;

    try {
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        // Get all workouts with trackRecords = true
        const { data: trackedWorkouts, error: workoutsError } = await supabase
            .from("workouts")
            .select("id, title, category, imageUrl")
            .eq("trackRecords", true);

        if (workoutsError) throw workoutsError;

        // Get all PR entries for this user
        const { data: allEntries, error: entriesError } = await supabase
            .from("personal_record_entries")
            .select("*")
            .eq("userId", userId);

        if (entriesError) throw entriesError;

        // Get user's custom rep configs
        const { data: repConfigs, error: configsError } = await supabase
            .from("user_workout_rep_configs")
            .select("*")
            .eq("userId", userId);

        if (configsError) throw configsError;

        // Build the response
        const result = (trackedWorkouts || []).map((workout) => {
            const entries = (allEntries || []).filter((e) => e.workoutId === workout.id);
            const config = (repConfigs || []).find((c) => c.workoutId === workout.id);

            // Group by reps and find best for each
            const repGroups = {};
            for (const entry of entries) {
                if (!repGroups[entry.reps] || entry.weight > repGroups[entry.reps].weight) {
                    repGroups[entry.reps] = entry;
                }
            }

            const currentRecords = Object.values(repGroups).map((entry) => ({
                reps: entry.reps,
                weight: entry.weight,
                dateAchieved: entry.dateAchieved,
                entryId: entry.id,
            }));

            return {
                workout: {
                    id: workout.id,
                    title: workout.title,
                    category: workout.category,
                    imageUrl: workout.imageUrl,
                },
                currentRecords,
                customReps: config?.customReps ?? [],
            };
        });

        res.json({ workouts: result });
    } catch (error) {
        console.error("Error fetching all PRs:", error);
        res.status(500).json({ error: "Failed to fetch all PRs" });
    }
});

// Workout Plan routes
// Get or create workout plan ID for user
app.get("/api/users/:userId/workout-plan-id", async (req, res) => {
    try {
        const userId = req.params.userId;

        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        // Try to get existing plans
        const { data: existingPlans, error: fetchError } = await supabase
            .from("workout_plans")
            .select("id, name, userId, createdAt, updatedAt")
            .eq("userId", userId)
            .order("createdAt", { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

        // If user has a plan, return it
        if (existingPlans && existingPlans.length > 0) {
            const mapped = mapPlanRow(existingPlans[0]);
            return res.json({ planId: mapped.id });
        }

        // No plans exist, create a default one
        const defaultPlan = {
            id: require("crypto").randomUUID(),
            name: "My Workout Plan",
            userId: userId,
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days from now
            updatedAt: new Date().toISOString(),
        };

        const { data: newPlan, error: createError } = await supabase
            .from("workout_plans")
            .insert([defaultPlan])
            .select("id, name, userId, createdAt, updatedAt")
            .single();

        if (createError) throw createError;

        const mapped = mapPlanRow(newPlan);
        res.json({ planId: mapped.id });
    } catch (error) {
        console.error("Error fetching/creating workout plan:", error);
        res.status(500).json({ error: "Failed to get workout plan" });
    }
});

// Get specific workout plan with all plan items
app.get("/api/workout-plans/:id", async (req, res) => {
    try {
        const planId = req.params.id;

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
            .eq("id", planId)
            .single();

        if (error) throw error;
        const mapped = mapPlanRow(data);
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching workout plan:", error);
        res.status(500).json({ error: "Failed to fetch workout plan" });
    }
});

// Create or return default routine for a user (90 days)
app.post("/api/users/:id/default-plan", async (req, res) => {
    try {
        const userId = req.params.id;
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;
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
        if (body.userId) {
            const ok = await ensureUserExistsOrRespond(body.userId, res);
            if (!ok) return;
        }
        // Map camelCase to snake_case; routine plans have no name and no date range
        const insert = {
            name: body.isRoutine ? null : (body.name ?? null),
            startDate: body.isRoutine ? null : (body.startDate ?? null),
            endDate: body.isRoutine ? null : (body.endDate ?? null),
            userId: body.userId,
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

// Get plan items for a specific workout plan, sorted by scheduled_date
// Query params:
//   - start: YYYY-MM-DD (optional) - filter items on/after this date
//   - end: YYYY-MM-DD (optional) - filter items on/before this date
//   - limit: number (optional, default: 100, max: 1000) - max items to return
// Returns: Array of plan items with embedded workout details, sorted by scheduled_date ASC
app.get("/api/workout-plans/:id/plan-items-sorted", async (req, res) => {
    try {
        const planId = req.params.id;
        // Optional start date filter (YYYY-MM-DD); if provided, only return items scheduled on/after this date
        const start = req.query.start;
        // Optional end date filter (YYYY-MM-DD); if provided, only return items scheduled on/before this date
        const end = req.query.end;
        // Optional limit parameter (default: 100, max: 1000 to prevent abuse)
        const limitParam = req.query.limit;
        let limit = 100;
        if (limitParam) {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 1000) {
                limit = parsedLimit;
            }
        }

        let query = supabase
            .from("plan_items")
            .select("*, workouts(*)")
            .eq("workoutPlanId", planId);

        if (typeof start === "string" && start.length >= 10) {
            query = query.gte("scheduled_date", start);
        }
        if (typeof end === "string" && end.length >= 10) {
            query = query.lte("scheduled_date", end);
        }
        const { data, error } = await query
            .order("scheduled_date", { ascending: true })
            .limit(limit);

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

// Workout Plan Template routes
app.get("/api/workout-plan-templates", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("workout_plan_templates")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped = Array.isArray(data) ? data.map(mapPlanTemplateRow) : [];
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching workout plan templates:", error);
        res.status(500).json({ error: "Failed to fetch workout plan templates" });
    }
});

app.get("/api/workout-plan-templates/:id", async (req, res) => {
    try {
        const templateId = req.params.id;
        const { data, error } = await supabase
            .from("workout_plan_templates")
            .select("*")
            .eq("id", templateId)
            .maybeSingle();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: "Workout plan template not found" });
        }
        res.json(mapPlanTemplateRow(data));
    } catch (error) {
        console.error("Error fetching workout plan template:", error);
        res.status(500).json({ error: "Failed to fetch workout plan template" });
    }
});

app.put("/api/workout-plan-templates/:id", async (req, res) => {
    try {
        const templateId = req.params.id;
        if (!templateId) {
            return res.status(400).json({ error: "Template id is required" });
        }

        const body = req.body || {};
        const { name, description, numWeeks, daysPerWeek, workoutStructure, level, createdBy } =
            body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "name is required" });
        }
        const weeksInt = parseInt(numWeeks, 10);
        const daysInt = parseInt(daysPerWeek, 10);
        if (!Number.isFinite(weeksInt) || weeksInt <= 0) {
            return res.status(400).json({ error: "numWeeks must be a positive integer" });
        }
        if (!Number.isFinite(daysInt) || daysInt <= 0) {
            return res.status(400).json({ error: "daysPerWeek must be a positive integer" });
        }
        if (workoutStructure === undefined) {
            return res.status(400).json({ error: "workoutStructure is required" });
        }

        let normalizedStructure;
        try {
            normalizedStructure = normalizeWorkoutStructureInput(workoutStructure);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        if (createdBy) {
            const ok = await ensureUserExistsOrRespond(createdBy, res);
            if (!ok) return;
        }

        const payload = {
            id: templateId,
            name: name.trim(),
            description: description ?? null,
            num_weeks: weeksInt,
            days_per_week: daysInt,
            workout_structure: normalizedStructure,
            level: level ?? null,
            created_by: createdBy ?? null,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("workout_plan_templates")
            .upsert([payload], { onConflict: "id" })
            .select()
            .single();
        if (error) throw error;

        res.json(mapPlanTemplateRow(data));
    } catch (error) {
        console.error("Error upserting workout plan template:", error);
        res.status(500).json({ error: "Failed to save workout plan template" });
    }
});

// Workout import entries (social media)
app.post("/api/workout-imports", async (req, res) => {
    try {
        const body = req.body || {};
        const { userId, sourceUrl } = body;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        if (!sourceUrl || typeof sourceUrl !== "string") {
            return res.status(400).json({ error: "sourceUrl is required" });
        }

        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        let metadataPayload = null;
        if (body.metadata !== undefined) {
            if (typeof body.metadata === "string") {
                try {
                    metadataPayload = JSON.parse(body.metadata);
                } catch {
                    metadataPayload = body.metadata;
                }
            } else {
                metadataPayload = body.metadata;
            }
        }

        // Check admin status if isGlobal is requested
        let isGlobal = false;
        if (body.isGlobal === true) {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("isAdmin")
                .eq("id", userId)
                .single();
            if (userError || !userData?.isAdmin) {
                return res.status(403).json({ error: "Only admins can create public imports" });
            }
            isGlobal = true;
        }

        const insertPayload = {
            user_id: userId,
            source_url: sourceUrl,
            source_platform: body.sourcePlatform ?? null,
            title: body.title ?? null,
            category: body.category ?? null,
            description: body.description ?? null,
            thumbnail_url: body.thumbnailUrl ?? null,
            html: body.html ?? null,
            metadata: metadataPayload,
            is_global: isGlobal,
        };

        const { data, error } = await supabase
            .from("workout_imports")
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(mapWorkoutImportRow(data));
    } catch (error) {
        console.error("Error recording workout import:", error);
        res.status(500).json({ error: "Failed to record workout import" });
    }
});

app.post("/api/workout-imports/instagram", async (req, res) => {
    try {
        const body = req.body || {};
        const { userId, url } = body;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "url is required" });
        }

        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        let metadata;
        try {
            metadata = await fetchInstagramMetadata(url);
        } catch (err) {
            console.error("Failed to fetch Instagram metadata:", err);
            if (err && err.message === "INSTAGRAM_OEMBED_NOT_CONFIGURED") {
                return res.status(500).json({
                    error: "Instagram import is not configured on the server.",
                });
            }
            return res
                .status(400)
                .json({ error: "Unable to fetch Instagram metadata for that URL." });
        }

        // Check admin status if isGlobal is requested
        let isGlobal = false;
        if (body.isGlobal === true) {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("isAdmin")
                .eq("id", userId)
                .single();
            if (userError || !userData?.isAdmin) {
                return res.status(403).json({ error: "Only admins can create public imports" });
            }
            isGlobal = true;
        }

        const insertPayload = {
            user_id: userId,
            source_url: metadata.normalizedUrl || url,
            source_platform: "instagram",
            title: metadata.title ?? null,
            category: body.category ?? null,
            description: metadata.description ?? null,
            thumbnail_url: metadata.thumbnailUrl ?? null,
            html: metadata.html ?? null,
            metadata,
            is_global: isGlobal,
        };

        const { data, error } = await supabase
            .from("workout_imports")
            .insert([insertPayload])
            .select()
            .single();
        if (error) throw error;

        res.status(201).json(mapWorkoutImportRow(data));
    } catch (error) {
        console.error("Error importing Instagram workout:", error);
        res.status(500).json({ error: "Failed to import Instagram workout" });
    }
});

app.post("/api/workout-imports/youtube", async (req, res) => {
    try {
        const body = req.body || {};
        const { userId, url } = body;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "url is required" });
        }

        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        let metadata;
        try {
            metadata = await fetchYouTubeMetadata(url);
        } catch (err) {
            console.error("Failed to fetch YouTube metadata:", err);
            return res
                .status(400)
                .json({ error: "Unable to fetch YouTube metadata for that URL." });
        }

        // Check admin status if isGlobal is requested
        let isGlobal = false;
        if (body.isGlobal === true) {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("isAdmin")
                .eq("id", userId)
                .single();
            if (userError || !userData?.isAdmin) {
                return res.status(403).json({ error: "Only admins can create public imports" });
            }
            isGlobal = true;
        }

        const insertPayload = {
            user_id: userId,
            source_url: metadata.normalizedUrl || url,
            source_platform: "youtube",
            title: metadata.title ?? null,
            category: body.category ?? null,
            description: metadata.description ?? null,
            thumbnail_url: metadata.thumbnailUrl ?? null,
            html: metadata.html ?? null,
            metadata,
            is_global: isGlobal,
        };

        const { data, error } = await supabase
            .from("workout_imports")
            .insert([insertPayload])
            .select()
            .single();
        if (error) throw error;

        res.status(201).json(mapWorkoutImportRow(data));
    } catch (error) {
        console.error("Error importing YouTube workout:", error);
        res.status(500).json({ error: "Failed to import YouTube workout" });
    }
});

app.get("/api/users/:userId/workout-imports", async (req, res) => {
    try {
        const { userId } = req.params;
        const ok = await ensureUserExistsOrRespond(userId, res);
        if (!ok) return;

        const { data, error } = await supabase
            .from("workout_imports")
            .select("*")
            .or(`user_id.eq.${userId},is_global.eq.true`)
            .order("created_at", { ascending: false });
        if (error) throw error;

        const mapped = Array.isArray(data) ? data.map(mapWorkoutImportRow) : [];
        res.json(mapped);
    } catch (error) {
        console.error("Error fetching workout imports:", error);
        res.status(500).json({ error: "Failed to fetch workout imports" });
    }
});

// Delete a workout import
app.delete("/api/workout-imports/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.body?.userId || req.query?.userId;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // Fetch the import to check ownership and global status
        const { data: importData, error: fetchError } = await supabase
            .from("workout_imports")
            .select("user_id, is_global")
            .eq("id", id)
            .single();

        if (fetchError || !importData) {
            return res.status(404).json({ error: "Import not found" });
        }

        const isOwner = importData.user_id === userId;
        const isGlobal = importData.is_global === true;

        if (isGlobal) {
            // Global imports: only owner admin can delete
            if (!isOwner) {
                return res.status(403).json({ error: "Cannot delete public imports you don't own" });
            }
            const { data: userData } = await supabase
                .from("users")
                .select("isAdmin")
                .eq("id", userId)
                .single();
            if (!userData?.isAdmin) {
                return res.status(403).json({ error: "Admin privileges required" });
            }
        } else {
            // Personal imports: only owner can delete
            if (!isOwner) {
                return res.status(403).json({ error: "Cannot delete imports you don't own" });
            }
        }

        const { error } = await supabase.from("workout_imports").delete().eq("id", id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting workout import:", error);
        res.status(500).json({ error: "Failed to delete workout import" });
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
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

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

// Start server - listen on 0.0.0.0 to allow connections from network devices
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Network access: http://192.168.86.27:${PORT}/health`);
});
