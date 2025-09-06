# Workout Import Scripts

These scripts help you bulk import workout data from Excel or CSV files into your workout library.

## 📋 Required Excel/CSV Format

Your file must have these columns (exact names):

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| **Category** | ✅ Yes | Must be one of the predefined categories | "Upper Body - Push" |
| **Exercise** | ✅ Yes | Name of the exercise | "Push-ups" |
| **Description** | ❌ No | Optional description | "Standard push-up exercise" |
| **Illustration** | ❌ No | URL to exercise image | "https://example.com/image.jpg" |
| **Intensity** | ✅ Yes | Intensity description | "bodyweight", "50kg", "8:30/mile" |
| **Sets** | ✅ Yes* | Number of sets (for strength workouts) | "3" |
| **Reps** | ✅ Yes* | Number of reps (for strength workouts) | "15" |
| **Duration** | ✅ Yes* | Duration in minutes (for cardio workouts) | "30" |

*Required based on workout type:
- **Strength workouts** (all categories except "Cardio"): Need Sets and Reps
- **Cardio workouts** ("Cardio" category): Need Duration

## 🎯 Valid Categories

- "Upper Body - Pull"
- "Upper Body - Push"
- "Legs"
- "Core"
- "Climbing - Power"
- "Climbing - Endurance"
- "Climbing - Warm Up"
- "Cardio"

## 🚀 Usage

### Option 1: Import from Excel (.xlsx)

```bash
cd backend
node scripts/importWorkouts.js path/to/your/workouts.xlsx
```

### Option 2: Import from CSV (.csv)

```bash
cd backend
node scripts/importWorkoutsCSV.js path/to/your/workouts.csv
```

## 📊 Example Data

| Category | Exercise | Description | Intensity | Sets | Reps | Duration | Illustration |
|----------|----------|-------------|-----------|------|------|----------|---------------|
| Upper Body - Push | Push-ups | Standard push-up | bodyweight | 3 | 15 | | https://example.com/pushup.jpg |
| Cardio | Running | Moderate pace | 8:30/mile | | | 30 | https://example.com/running.jpg |
| Legs | Squats | Weighted squats | 50kg | 4 | 12 | | https://example.com/squat.jpg |

## ✅ What the Scripts Do

1. **Validate Data**: Check all required fields and data types
2. **Auto-detect Workout Type**: 
   - "Cardio" category → cardio workout
   - All other categories → strength workout
3. **Upload in Batches**: Process workouts in groups of 10
4. **Error Handling**: Show detailed error messages for any issues
5. **Progress Tracking**: Display upload progress and summary

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid category"**: Make sure your category exactly matches one of the valid categories
2. **"Sets must be a number"**: Ensure Sets column contains only numbers for strength workouts
3. **"Duration must be a number"**: Ensure Duration column contains only numbers for cardio workouts
4. **"Exercise name is required"**: Make sure Exercise column is not empty

### File Format Issues

- **Excel**: Save as .xlsx format
- **CSV**: Use comma-separated values, UTF-8 encoding
- **Headers**: Make sure first row contains column names exactly as specified

## 📈 After Import

Once imported, your workouts will be available in the global workout library for all users to:
- Browse by category
- Add to their personal workout plans
- Track their progress
- View exercise details and images
