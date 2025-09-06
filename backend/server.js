const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidUrl(url) {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

if (!supabaseUrl || !supabaseKey ||
    supabaseUrl.includes('your-supabase-project-url') ||
    supabaseKey.includes('your-supabase-service-role-key') ||
    !isValidUrl(supabaseUrl)) {
  console.error('\nSupabase is not configured correctly.');
  console.error('Please set valid values in backend/.env:');
  console.error('  SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nTip: In Supabase dashboard -> Project Settings -> API, copy the Project URL and Service role key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers
function mapUserRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    profilePhoto: row.profile_photo ?? null,
    birthday: row.birthday ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? null,
    workoutType: row.workout_type,
    sets: row.sets ?? null,
    reps: row.reps ?? null,
    duration: row.duration ?? null,
    intensity: row.intensity,
    imageUrl: row.image_url ?? null,
    isGlobal: row.is_global ?? true,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPlanItemRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    workoutId: row.workout_id,
    workoutPlanId: row.workout_plan_id,
    frequency: row.frequency,
    intensity: row.intensity ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    workout: row.workouts ? mapWorkoutRow(row.workouts) : undefined,
  };
}

function mapPlanRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    planItems: Array.isArray(row.plan_items) ? row.plan_items.map(mapPlanItemRow) : [],
  };
}
async function resolveUserIdOrCreateFallback(providedUserId) {
  try {
    if (providedUserId) {
      // Validate the provided user exists
      const { data: existing, error: findErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', providedUserId)
        .single();
      if (!findErr && existing?.id) return existing.id;
    }

    // Try to use an existing test user
    const { data: anyUser } = await supabase
      .from('users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (anyUser?.id) return anyUser.id;

    // Create a fallback user
    const { data: created, error: createErr } = await supabase
      .from('users')
      .insert([{ email: 'test@example.com', name: 'Test User' }])
      .select('id')
      .single();
    if (createErr) throw createErr;
    return created.id;
  } catch (e) {
    throw e;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Workout routes
app.get('/api/workouts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const mapped = Array.isArray(data) ? data.map(mapWorkoutRow) : [];
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const body = req.body || {};
    
    // Auto-detect workout type based on category
    const workoutType = body.category === 'Cardio' ? 'cardio' : 'strength';
    
    // Map camelCase from client to snake_case columns
    const insert = {
      title: body.title,
      category: body.category,
      description: body.description ?? null,
      workout_type: workoutType, // Auto-determined
      sets: body.sets ?? null,
      reps: body.reps ?? null,
      duration: body.duration ?? null,
      intensity: body.intensity,
      image_url: body.imageUrl ?? null,
      is_global: true, // All workouts are global by default
      created_by: body.createdBy ?? null, // Optional: who created this workout
    };

    const { data, error } = await supabase
      .from('workouts')
      .insert([insert])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapWorkoutRow(data));
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

app.get('/api/workouts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json(mapWorkoutRow(data));
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

app.put('/api/workouts/:id', async (req, res) => {
  try {
    const body = req.body || {};
    
    // Auto-detect workout type based on category
    const workoutType = body.category === 'Cardio' ? 'cardio' : 'strength';
    
    const update = {
      title: body.title,
      category: body.category,
      description: body.description ?? null,
      workout_type: workoutType, // Auto-determined
      sets: body.sets ?? null,
      reps: body.reps ?? null,
      duration: body.duration ?? null,
      intensity: body.intensity,
      image_url: body.imageUrl ?? null,
      // Note: is_global and created_by are not updated here to maintain data integrity
    };

    const { data, error } = await supabase
      .from('workouts')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapWorkoutRow(data));
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// Workout Plan routes
app.get('/api/workout-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select(`
        *,
        plan_items (
          *,
          workouts (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const mapped = Array.isArray(data) ? data.map(mapPlanRow) : [];
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    res.status(500).json({ error: 'Failed to fetch workout plans' });
  }
});

app.post('/api/workout-plans', async (req, res) => {
  try {
    const body = req.body || {};
    // Map camelCase to snake_case
    const insert = {
      name: body.name,
      start_date: body.startDate,
      end_date: body.endDate,
      user_id: await resolveUserIdOrCreateFallback(body.userId),
    };

    const { data, error } = await supabase
      .from('workout_plans')
      .insert([insert])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapPlanRow(data));
  } catch (error) {
    console.error('Error creating workout plan:', error);
    res.status(500).json({ error: 'Failed to create workout plan' });
  }
});

app.post('/api/workout-plans/:id/plan-items', async (req, res) => {
  try {
    const body = req.body || {};
    const insert = {
      workout_plan_id: req.params.id,
      workout_id: body.workoutId,
      frequency: body.frequency,
      intensity: body.intensity ?? null,
    };

    const { data, error } = await supabase
      .from('plan_items')
      .insert([insert])
      .select(`
        *,
        workouts (*)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(mapPlanItemRow(data));
  } catch (error) {
    console.error('Error creating plan item:', error);
    res.status(500).json({ error: 'Failed to create plan item' });
  }
});

// Delete plan item
app.delete('/api/plan-items/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('plan_items')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan item:', error);
    res.status(500).json({ error: 'Failed to delete plan item' });
  }
});

// User Profile Endpoints

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(mapUserRow(data));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, profilePhoto, birthday } = req.body;

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profilePhoto !== undefined) updateData.profile_photo = profilePhoto;
    if (birthday !== undefined) updateData.birthday = birthday;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(mapUserRow(data));
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
