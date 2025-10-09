import { 
  Workout, 
  WorkoutPlan, 
  PlanItem, 
  User,
  CreateWorkoutRequest, 
  CreateWorkoutPlanRequest, 
  CreatePlanItemRequest,
  UpdateUserProfileRequest
} from '../types';

import { API_BASE_URL } from '../constants';

// Log which API base the app is using (helps confirm local vs cloud)
try {
  // eslint-disable-next-line no-console
  console.log('[api] API_BASE_URL=', API_BASE_URL);
} catch (e) {
  // ignore
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Log each request for debugging (Metro/console)
    try {
      // eslint-disable-next-line no-console
      console.log(`[REQUEST][api] ${options?.method ?? 'GET'} ${API_BASE_URL}${endpoint}`);
    } catch (e) {}
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
      }

      return response.json();
  }

  // Workout endpoints
  async getWorkouts(): Promise<Workout[]> {
    return this.request<Workout[]>('/workouts');
  }

  async createWorkout(workout: CreateWorkoutRequest): Promise<Workout> {
    return this.request<Workout>('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  }

  async getWorkout(id: string): Promise<Workout> {
    return this.request<Workout>(`/workouts/${id}`);
  }

  async updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout> {
    return this.request<Workout>(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workout),
    });
  }

  async deleteWorkout(id: string): Promise<void> {
    return this.request<void>(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  // Workout Plan endpoints
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    return this.request<WorkoutPlan[]>('/workout-plans');
  }

  async createWorkoutPlan(plan: CreateWorkoutPlanRequest): Promise<WorkoutPlan> {
    return this.request<WorkoutPlan>('/workout-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async addWorkoutToPlan(planId: string, planItem: CreatePlanItemRequest): Promise<PlanItem> {
    return this.request<PlanItem>(`/workout-plans/${planId}/plan-items`, {
      method: 'POST',
      body: JSON.stringify(planItem),
    });
  }

  /**
   * Add a single dated occurrence of a workout to a plan.
   * payload: { workoutId, date: 'YYYY-MM-DD', intensity? }
   */
  async addWorkoutToPlanOnDate(planId: string, payload: { workoutId: string; date: string; intensity?: string }): Promise<PlanItem> {
    return this.request<PlanItem>(`/workout-plans/${planId}/plan-items/date`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Add a workout to a plan for multiple dates in one request.
   * payload: { workoutId, dates: ['YYYY-MM-DD', ...], intensity? }
   */
  async addWorkoutToPlanOnDates(planId: string, payload: { workoutId: string; dates: string[]; intensity?: string }): Promise<PlanItem[] | PlanItem> {
    return this.request<PlanItem[] | PlanItem>(`/workout-plans/${planId}/plan-items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async removeWorkoutFromPlan(planItemId: string): Promise<void> {
    return this.request<void>(`/plan-items/${planItemId}`, {
      method: 'DELETE',
    });
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
