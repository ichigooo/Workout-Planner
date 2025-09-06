const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
  "Cardio"
];

// Function to validate and clean data
function validateWorkoutData(row, rowIndex) {
  const errors = [];
  
  // Required fields
  if (!row.Exercise || !row.Exercise.trim()) {
    errors.push(`Row ${rowIndex + 2}: Exercise name is required`);
  }
  
  if (!row.Category || !row.Category.trim()) {
    errors.push(`Row ${rowIndex + 2}: Category is required`);
  } else if (!VALID_CATEGORIES.includes(row.Category.trim())) {
    errors.push(`Row ${rowIndex + 2}: Invalid category "${row.Category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  
  if (!row.Intensity || !row.Intensity.trim()) {
    errors.push(`Row ${rowIndex + 2}: Intensity is required`);
  }
  
  // Validate sets/reps for strength workouts
  const category = row.Category.trim();
  const isCardio = category === 'Cardio';
  
  if (!isCardio) {
    // Strength workout - need sets and reps
    if (!row.Sets || isNaN(parseInt(row.Sets))) {
      errors.push(`Row ${rowIndex + 2}: Sets must be a number for strength workouts`);
    }
    if (!row.Reps || isNaN(parseInt(row.Reps))) {
      errors.push(`Row ${rowIndex + 2}: Reps must be a number for strength workouts`);
    }
  } else {
    // Cardio workout - need duration
    if (!row.Duration || isNaN(parseInt(row.Duration))) {
      errors.push(`Row ${rowIndex + 2}: Duration must be a number for cardio workouts`);
    }
  }
  
  return errors;
}

// Function to convert Excel row to workout data
function convertRowToWorkout(row) {
  const category = row.Category.trim();
  const isCardio = category === 'Cardio';
  
  return {
    title: row.Exercise.trim(),
    category: category,
    description: row.Description ? row.Description.trim() : null,
    workout_type: isCardio ? 'cardio' : 'strength',
    sets: isCardio ? null : parseInt(row.Sets),
    reps: isCardio ? null : parseInt(row.Reps),
    duration: isCardio ? parseInt(row.Duration) : null,
    intensity: row.Intensity.trim(),
    image_url: row.Illustration ? row.Illustration.trim() : null,
    is_global: true,
    created_by: null
  };
}

// Main import function
async function importWorkouts(filePath) {
  try {
    console.log('📖 Reading Excel file...');
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${data.length} rows in Excel file`);
    
    if (data.length === 0) {
      console.log('❌ No data found in Excel file');
      return;
    }
    
    // Validate all data first
    console.log('🔍 Validating data...');
    const allErrors = [];
    
    data.forEach((row, index) => {
      const errors = validateWorkoutData(row, index);
      allErrors.push(...errors);
    });
    
    if (allErrors.length > 0) {
      console.log('❌ Validation errors found:');
      allErrors.forEach(error => console.log(`  - ${error}`));
      return;
    }
    
    console.log('✅ All data is valid!');
    
    // Convert to workout format
    const workouts = data.map(convertRowToWorkout);
    
    console.log('📤 Uploading workouts to database...');
    
    // Upload in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < workouts.length; i += batchSize) {
      const batch = workouts.slice(i, i + batchSize);
      
      try {
        const { data: insertedData, error } = await supabase
          .from('workouts')
          .insert(batch)
          .select();
        
        if (error) {
          console.log(`❌ Error uploading batch ${Math.floor(i/batchSize) + 1}:`, error.message);
          errorCount += batch.length;
        } else {
          console.log(`✅ Uploaded batch ${Math.floor(i/batchSize) + 1} (${batch.length} workouts)`);
          successCount += batch.length;
        }
      } catch (err) {
        console.log(`❌ Exception uploading batch ${Math.floor(i/batchSize) + 1}:`, err.message);
        errorCount += batch.length;
      }
    }
    
    console.log('\n📈 Import Summary:');
    console.log(`  ✅ Successfully imported: ${successCount} workouts`);
    console.log(`  ❌ Failed to import: ${errorCount} workouts`);
    console.log(`  📊 Total processed: ${workouts.length} workouts`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

// Command line usage
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('Usage: node importWorkouts.js <path-to-excel-file>');
    console.log('Example: node importWorkouts.js ../workouts.xlsx');
    process.exit(1);
  }
  
  importWorkouts(filePath);
}

module.exports = { importWorkouts };
