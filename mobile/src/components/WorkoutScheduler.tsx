import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useColorScheme,
  Alert 
} from 'react-native';
import { Workout, WorkoutPlan, PlanItem } from '../types';
import { apiService } from '../services/api';
import { getTheme } from '../theme';

interface WorkoutSchedulerProps {
  plan: WorkoutPlan;
  onPlanUpdated: () => void;
}

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

export const WorkoutScheduler: React.FC<WorkoutSchedulerProps> = ({ 
  plan, 
  onPlanUpdated 
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [customIntensity, setCustomIntensity] = useState('');

  useEffect(() => {
    loadAvailableWorkouts();
  }, []);

  const loadAvailableWorkouts = async () => {
    try {
      const workouts = await apiService.getWorkouts();
      setAvailableWorkouts(workouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayKey: string) => {
    setSelectedDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  const handleScheduleWorkout = async () => {
    if (!selectedWorkout || selectedDays.length === 0) {
      Alert.alert('Error', 'Please select a workout and at least one day');
      return;
    }

    try {
      const frequency = selectedDays.join(',');
      const intensity = customIntensity || selectedWorkout.intensity;

      await apiService.addWorkoutToPlan(plan.id, {
        workoutId: selectedWorkout.id,
        frequency,
        intensity,
      });

      Alert.alert('Success', 'Workout scheduled successfully!');
      setSelectedWorkout(null);
      setSelectedDays([]);
      setCustomIntensity('');
      onPlanUpdated();
    } catch (error) {
      console.error('Error scheduling workout:', error);
      Alert.alert('Error', 'Failed to schedule workout');
    }
  };

  const handleRemoveWorkout = async (planItem: PlanItem) => {
    Alert.alert(
      'Remove Workout',
      `Remove ${planItem.workout?.title} from this plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeWorkoutFromPlan(planItem.id);
              Alert.alert('Success', 'Workout removed from plan');
              onPlanUpdated();
            } catch (error) {
              console.error('Error removing workout:', error);
              Alert.alert('Error', 'Failed to remove workout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Scheduled Workouts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Scheduled Workouts</Text>
          
          {plan.planItems && plan.planItems.length > 0 ? (
            <View style={styles.scheduledWorkouts}>
              {plan.planItems.map((planItem) => (
                <View 
                  key={planItem.id}
                  style={[styles.scheduledWorkoutCard, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border 
                  }]}
                >
                  <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutTitle, { color: theme.colors.text }]}>
                      {planItem.workout?.title}
                    </Text>
                    <Text style={[styles.workoutDetails, { color: theme.colors.subtext }]}>
                      {planItem.workout?.sets} sets × {planItem.workout?.reps} reps
                    </Text>
                    <Text style={[styles.workoutFrequency, { color: theme.colors.accent }]}>
                      Days: {planItem.frequency}
                    </Text>
                    {planItem.intensity && (
                      <Text style={[styles.workoutIntensity, { color: theme.colors.subtext }]}>
                        Intensity: {planItem.intensity}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.danger }]}
                    onPress={() => handleRemoveWorkout(planItem)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noWorkoutsText, { color: theme.colors.subtext }]}>
              No workouts scheduled yet
            </Text>
          )}
        </View>

        {/* Add New Workout */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Workout to Plan</Text>
          
          {/* Workout Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Select Workout</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutSelector}>
              {availableWorkouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={[
                    styles.workoutOption,
                    { 
                      backgroundColor: selectedWorkout?.id === workout.id 
                        ? theme.colors.accent 
                        : theme.colors.surface,
                      borderColor: theme.colors.border 
                    }
                  ]}
                  onPress={() => setSelectedWorkout(workout)}
                >
                  <Text style={[
                    styles.workoutOptionText,
                    { 
                      color: selectedWorkout?.id === workout.id 
                        ? '#FFFFFF' 
                        : theme.colors.text 
                    }
                  ]}>
                    {workout.title}
                  </Text>
                  <Text style={[
                    styles.workoutOptionDetails,
                    { 
                      color: selectedWorkout?.id === workout.id 
                        ? '#FFFFFF' 
                        : theme.colors.subtext 
                    }
                  ]}>
                    {workout.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Day Selection */}
          {selectedWorkout && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Select Days</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayButton,
                      { 
                        backgroundColor: selectedDays.includes(day.key) 
                          ? theme.colors.accent 
                          : theme.colors.surface,
                        borderColor: theme.colors.border 
                      }
                    ]}
                    onPress={() => handleDayToggle(day.key)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      { 
                        color: selectedDays.includes(day.key) 
                          ? '#FFFFFF' 
                          : theme.colors.text 
                      }
                    ]}>
                      {day.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Custom Intensity */}
          {selectedWorkout && selectedDays.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Custom Intensity (optional)
              </Text>
              <Text style={[styles.intensityHint, { color: theme.colors.subtext }]}>
                Default: {selectedWorkout.intensity}
              </Text>
            </View>
          )}

          {/* Schedule Button */}
          {selectedWorkout && selectedDays.length > 0 && (
            <TouchableOpacity
              style={[styles.scheduleButton, { backgroundColor: theme.colors.accent }]}
              onPress={handleScheduleWorkout}
            >
              <Text style={styles.scheduleButtonText}>Schedule Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  scheduledWorkouts: {
    gap: 12,
  },
  scheduledWorkoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  workoutFrequency: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  workoutIntensity: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  noWorkoutsText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  intensityHint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  workoutSelector: {
    marginBottom: 8,
  },
  workoutOption: {
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  workoutOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  workoutOptionDetails: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  scheduleButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
