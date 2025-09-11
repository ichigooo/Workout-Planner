import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme 
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { WorkoutPlan, CreateWorkoutPlanRequest, Workout, PlanItem } from '../types';
import { CalendarWidget } from './CalendarWidget';
import { apiService } from '../services/api';
import { getTheme } from '../theme';

interface WorkoutPlanFormProps {
  plan?: WorkoutPlan;
  onSubmit: (plan: CreateWorkoutPlanRequest) => void;
  onCancel: () => void;
  onPlanUpdated?: () => void;
}

interface WorkoutWithDays extends Workout {
  scheduledDays: string[];
  planItemId?: string;
}

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday', short: 'M' },
  { key: 'Tue', label: 'Tuesday', short: 'T' },
  { key: 'Wed', label: 'Wednesday', short: 'W' },
  { key: 'Thu', label: 'Thursday', short: 'T' },
  { key: 'Fri', label: 'Friday', short: 'F' },
  { key: 'Sat', label: 'Saturday', short: 'S' },
  { key: 'Sun', label: 'Sunday', short: 'S' },
];

export const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({ 
  plan, 
  onSubmit, 
  onCancel,
  onPlanUpdated 
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  
  const [name, setName] = useState(plan?.name || '');
  const [startDate, setStartDate] = useState(plan?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(plan?.endDate || new Date().toISOString().split('T')[0]);
  
  // Workout scheduling state
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<WorkoutWithDays[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  useEffect(() => {
    if (plan) {
      loadWorkouts();
    }
  }, [plan]);

  const loadWorkouts = async () => {
    try {
      setLoadingWorkouts(true);
      const [workouts, planData] = await Promise.all([
        apiService.getWorkouts(),
        apiService.getWorkoutPlans()
      ]);
      
      setAvailableWorkouts(workouts);
      
      // Convert plan items to scheduled workouts with days
      const currentPlan = planData.find(p => p.id === plan?.id);
      const scheduled: WorkoutWithDays[] = [];
      
      currentPlan?.planItems?.forEach(planItem => {
        if (planItem.workout) {
          const days = planItem.frequency.split(',').map(d => d.trim());
          scheduled.push({
            ...planItem.workout,
            scheduledDays: days,
            planItemId: planItem.id,
          });
        }
      });
      
      setScheduledWorkouts(scheduled);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const handleDragEnd = ({ data }: { data: WorkoutWithDays[] }) => {
    setScheduledWorkouts(data);
  };

  const handleDayToggle = (workoutId: string, dayKey: string) => {
    setScheduledWorkouts(prev => 
      prev.map(workout => 
        workout.id === workoutId 
          ? {
              ...workout,
              scheduledDays: workout.scheduledDays.includes(dayKey)
                ? workout.scheduledDays.filter(d => d !== dayKey)
                : [...workout.scheduledDays, dayKey]
            }
          : workout
      )
    );
  };

  const handleAddWorkout = (workout: Workout) => {
    const isAlreadyScheduled = scheduledWorkouts.some(w => w.id === workout.id);
    if (isAlreadyScheduled) {
      Alert.alert('Already Added', 'This workout is already scheduled in this plan');
      return;
    }

    setScheduledWorkouts(prev => [
      ...prev,
      {
        ...workout,
        scheduledDays: [],
        planItemId: undefined,
      }
    ]);
  };

  const handleRemoveWorkout = (workoutId: string) => {
    setScheduledWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const handleSubmit = async () => {
    if (!name || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const planData: CreateWorkoutPlanRequest = {
      name,
      startDate,
      endDate,
      userId: plan?.userId || 'temp-user-id', // TODO: Get from auth context
    };

    // If editing an existing plan, save the workout schedule
    if (plan) {
      try {
        // Remove existing plan items
        for (const workout of scheduledWorkouts) {
          if (workout.planItemId) {
            await apiService.removeWorkoutFromPlan(workout.planItemId);
          }
        }

        // Add new plan items
        for (const workout of scheduledWorkouts) {
          if (workout.scheduledDays.length > 0) {
            await apiService.addWorkoutToPlan(plan.id, {
              workoutId: workout.id,
              frequency: workout.scheduledDays.join(','),
              intensity: workout.intensity,
            });
          }
        }

        if (onPlanUpdated) {
          onPlanUpdated();
        }
      } catch (error) {
        console.error('Error saving workout schedule:', error);
        Alert.alert('Error', 'Failed to save workout schedule');
        return;
      }
    }

    onSubmit(planData);
  };

  const renderWorkoutItem = ({ item, drag, isActive }: RenderItemParams<WorkoutWithDays>) => (
    <View style={[
      styles.workoutCard,
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        opacity: isActive ? 0.8 : 1,
      }
    ]}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.workoutDetails, { color: theme.colors.subtext }]}>
            {item.sets} sets × {item.reps} reps • {item.category}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.colors.danger }]}
          onPress={() => handleRemoveWorkout(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysContainer}>
        <Text style={[styles.daysLabel, { color: theme.colors.text }]}>Schedule for:</Text>
        <View style={styles.daysRow}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayButton,
                { 
                  backgroundColor: item.scheduledDays.includes(day.key) 
                    ? theme.colors.accent 
                    : theme.colors.bg,
                  borderColor: theme.colors.border 
                }
              ]}
              onPress={() => handleDayToggle(item.id, day.key)}
            >
              <Text style={[
                styles.dayButtonText,
                { 
                  color: item.scheduledDays.includes(day.key) 
                    ? '#FFFFFF' 
                    : theme.colors.text 
                }
              ]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{plan ? 'Edit Workout Plan' : 'Create New Workout Plan'}</Text>
    
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Plan Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border, 
            color: theme.colors.text 
          }]}
          value={name}
          onChangeText={setName}
          placeholder="Enter plan name"
          placeholderTextColor={theme.colors.subtext}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Start Date *</Text>
        <CalendarWidget
          selectedDate={startDate}
          onDateSelect={setStartDate}
          placeholder="Select start date"
          minimumDate={new Date().toISOString().split('T')[0]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>End Date *</Text>
        <CalendarWidget
          selectedDate={endDate}
          onDateSelect={setEndDate}
          placeholder="Select end date"
          minimumDate={startDate}
        />
      </View>

      {plan && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Available Workouts</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.subtext }]}>
            Tap to add to your plan
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutSelector}>
            {availableWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[styles.workoutOption, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border 
                }]}
                onPress={() => handleAddWorkout(workout)}
              >
                <Text style={[styles.workoutOptionTitle, { color: theme.colors.text }]}>
                  {workout.title}
                </Text>
                <Text style={[styles.workoutOptionDetails, { color: theme.colors.subtext }]}>
                  {workout.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {plan && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Scheduled Workouts</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.subtext }]}>
            Long press to reorder • Tap days to schedule
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.subtext }]} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.accent }]} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{plan ? 'Update Plan' : 'Create Plan'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    plan ? (
      <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
          No workouts scheduled yet
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtext }]}>
          Add workouts from above to get started
        </Text>
      </View>
    ) : null
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {plan ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          
          {scheduledWorkouts.length > 0 ? (
            <View style={styles.workoutsContainer}>
              {scheduledWorkouts.map((workout, index) => (
                <View key={workout.id} style={styles.workoutItemWrapper}>
                  <TouchableOpacity
                    style={[styles.dragHandle, { backgroundColor: theme.colors.subtext }]}
                    onLongPress={() => {
                      // Simple reorder functionality - move item up/down
                      const newWorkouts = [...scheduledWorkouts];
                      if (index > 0) {
                        [newWorkouts[index], newWorkouts[index - 1]] = [newWorkouts[index - 1], newWorkouts[index]];
                        setScheduledWorkouts(newWorkouts);
                      }
                    }}
                  >
                    <Text style={styles.dragHandleText}>⋮⋮</Text>
                  </TouchableOpacity>
                  {renderWorkoutItem({ item: workout, drag: () => {}, isActive: false })}
                </View>
              ))}
            </View>
          ) : (
            renderEmptyState()
          )}
          
          {renderFooter()}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>Create New Workout Plan</Text>
        
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Plan Name *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border, 
                color: theme.colors.text 
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter plan name"
              placeholderTextColor={theme.colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Start Date *</Text>
            <CalendarWidget
              selectedDate={startDate}
              onDateSelect={setStartDate}
              placeholder="Select start date"
              minimumDate={new Date().toISOString().split('T')[0]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>End Date *</Text>
            <CalendarWidget
              selectedDate={endDate}
              onDateSelect={setEndDate}
              placeholder="Select end date"
              minimumDate={startDate}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.subtext }]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.accent }]} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Drag and drop styles
  draggableList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
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
  workoutOptionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  workoutOptionDetails: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  workoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dragHandleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysContainer: {
    marginTop: 8,
  },
  daysLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 32,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  workoutsContainer: {
    padding: 16,
  },
  workoutItemWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
});
