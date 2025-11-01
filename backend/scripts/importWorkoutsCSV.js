const fs = require("fs");
const csv = require("csv-parser");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Predefined categories
const VALID_CATEGORIES = [
    "Upper Body - Pull",
    "Upper Body - Push",
    "Legs",
    "Core",
    "Climbing - Power",
    "Climbing - Endurance",
    "Climbing - Warm Up",
    "Cardio",
];

// Function to validate and clean data
function validateWorkoutData(row, rowIndex) {
    const errors = [];

    // Required fields
    if (!row.Exercise || !row.Exercise.trim()) {
        errors.push(`Row ${rowIndex + 1}: Exercise name is required`);
    }

    if (!row.Category || !row.Category.trim()) {
        errors.push(`Row ${rowIndex + 1}: Category is required`);
    } else if (!VALID_CATEGORIES.includes(row.Category.trim())) {
        errors.push(
            `Row ${rowIndex + 1}: Invalid category "${row.Category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        );
    }

    if (!row.Intensity || !row.Intensity.trim()) {
        errors.push(`Row ${rowIndex + 1}: Intensity is required`);
    }

    // Validate sets/reps for strength workouts
    const category = row.Category.trim();
    const isCardio = category === "Cardio";

    if (!isCardio) {
        // Strength workout - need sets and reps
        if (!row.Sets || isNaN(parseInt(row.Sets))) {
            errors.push(`Row ${rowIndex + 1}: Sets must be a number for strength workouts`);
        }
        // Allow special values like "—" for reps (climbing warm-up exercises)
        // Also allow descriptive values like "10s hold each angle"
        if (
            !row.Reps ||
            (row.Reps !== "—" &&
                isNaN(parseInt(row.Reps)) &&
                !row.Reps.includes("s") &&
                !row.Reps.includes("min"))
        ) {
            errors.push(
                `Row ${rowIndex + 1}: Reps must be a number, "—", or descriptive text for strength workouts`,
            );
        }
    } else {
        // Cardio workout - need duration
        if (!row.Duration || isNaN(parseInt(row.Duration))) {
            errors.push(`Row ${rowIndex + 1}: Duration must be a number for cardio workouts`);
        }
    }

    return errors;
}

// Function to convert CSV row to workout data
function convertRowToWorkout(row) {
    const category = row.Category.trim();
    const isCardio = category === "Cardio";

    // Handle special cases for reps (like "—" for climbing warm-up)
    // For descriptive values, we'll store them as strings in the intensity field
    let repsValue = null;
    if (!isCardio && row.Reps && row.Reps !== "—") {
        if (isNaN(parseInt(row.Reps))) {
            // Descriptive rep value - we'll include it in intensity
            repsValue = null;
        } else {
            repsValue = parseInt(row.Reps);
        }
    }

    // Combine intensity with descriptive rep information
    let intensityValue = row.Intensity.trim();
    if (!isCardio && row.Reps && row.Reps !== "—" && isNaN(parseInt(row.Reps))) {
        intensityValue = `${row.Intensity.trim()} (${row.Reps})`;
    }

    return {
        title: row.Exercise.trim(),
        category: category,
        description: row.Description ? row.Description.trim() : null,
        workout_type: isCardio ? "cardio" : "strength",
        sets: isCardio ? null : parseInt(row.Sets),
        reps: repsValue,
        duration: isCardio ? parseInt(row.Duration) : null,
        intensity: intensityValue,
        image_url: row.Illustration ? row.Illustration.trim() : null,
        is_global: true,
        created_by: null,
        user_id: "system-import", // Temporary user_id for import
    };
}

// Main import function
async function importWorkoutsFromCSV(filePath) {
    try {
        console.log("📖 Reading CSV file...");

        const workouts = [];
        let rowIndex = 0;

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (row) => {
                    rowIndex++;

                    // Validate data
                    const errors = validateWorkoutData(row, rowIndex - 1);
                    if (errors.length > 0) {
                        console.log("❌ Validation errors:");
                        errors.forEach((error) => console.log(`  - ${error}`));
                        reject(new Error("Validation failed"));
                        return;
                    }

                    // Convert to workout format
                    const workout = convertRowToWorkout(row);
                    workouts.push(workout);
                })
                .on("end", async () => {
                    console.log(`📊 Found ${workouts.length} valid workouts`);

                    if (workouts.length === 0) {
                        console.log("❌ No valid workouts found");
                        resolve();
                        return;
                    }

                    console.log("📤 Uploading workouts to database...");

                    // Upload in batches of 10
                    const batchSize = 10;
                    let successCount = 0;
                    let errorCount = 0;

                    for (let i = 0; i < workouts.length; i += batchSize) {
                        const batch = workouts.slice(i, i + batchSize);

                        try {
                            const { error } = await supabase
                                .from("workouts")
                                .insert(batch)
                                .select();

                            if (error) {
                                console.log(
                                    `❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`,
                                    error.message,
                                );
                                errorCount += batch.length;
                            } else {
                                console.log(
                                    `✅ Uploaded batch ${Math.floor(i / batchSize) + 1} (${batch.length} workouts)`,
                                );
                                successCount += batch.length;
                            }
                        } catch (err) {
                            console.log(
                                `❌ Exception uploading batch ${Math.floor(i / batchSize) + 1}:`,
                                err.message,
                            );
                            errorCount += batch.length;
                        }
                    }

                    console.log("\n📈 Import Summary:");
                    console.log(`  ✅ Successfully imported: ${successCount} workouts`);
                    console.log(`  ❌ Failed to import: ${errorCount} workouts`);
                    console.log(`  📊 Total processed: ${workouts.length} workouts`);

                    resolve();
                })
                .on("error", (error) => {
                    console.error("❌ Error reading CSV file:", error.message);
                    reject(error);
                });
        });
    } catch (error) {
        console.error("❌ Import failed:", error.message);
    }
}

// Command line usage
if (require.main === module) {
    const filePath = process.argv[2];

    if (!filePath) {
        console.log("Usage: node importWorkoutsCSV.js <path-to-csv-file>");
        console.log("Example: node importWorkoutsCSV.js ../workouts.csv");
        process.exit(1);
    }

    importWorkoutsFromCSV(filePath);
}

module.exports = { importWorkoutsFromCSV };
