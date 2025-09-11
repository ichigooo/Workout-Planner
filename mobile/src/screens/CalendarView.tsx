import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  useColorScheme,
  Alert 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { WorkoutPlan, Workout } from '../types';
import { apiService } from '../services/api';
import { getTheme } from '../theme';

interface ScheduledWorkout {
  id: string;
  workout: Workout;
  date: string;
  frequency: string;
  intensity?: string;
}

export const CalendarView: React.FC = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  useEffect(() => {
    loadWorkoutPlans();
  }, []);

  useEffect(() => {
    generateScheduledWorkouts();
  }, [workoutPlans, selectedDate]);

  const loadWorkoutPlans = async () => {
    try {
      const plans = await apiService.getWorkoutPlans();
      setWorkoutPlans(plans);
    } catch (error) {
      console.error('Error loading workout plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScheduledWorkouts = () => {
    const scheduled: ScheduledWorkout[] = [];
    const currentDate = new Date(selectedDate);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Generate workouts for the current week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check each plan to see if it has workouts scheduled for this day
      workoutPlans.forEach(plan => {
        const planStart = new Date(plan.startDate);
        const planEnd = new Date(plan.endDate);
        
        if (date >= planStart && date <= planEnd) {
          plan.planItems?.forEach(planItem => {
            if (planItem.workout && isWorkoutScheduledForDay(planItem.frequency, dayName)) {
              scheduled.push({
                id: `${planItem.id}-${dateString}`,
                workout: planItem.workout,
                date: dateString,
                frequency: planItem.frequency,
                intensity: planItem.intensity || planItem.workout.intensity,
              });
            }
          });
        }
      });
    }
    
    setScheduledWorkouts(scheduled);
  };

  const isWorkoutScheduledForDay = (frequency: string, dayName: string): boolean => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'Mon',
      'Tuesday': 'Tue', 
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    
    const shortDay = dayMap[dayName];
    return frequency.includes(shortDay) || frequency.toLowerCase().includes('daily');
  };

  const getWorkoutsForDate = (date: string) => {
    return scheduledWorkouts.filter(workout => workout.date === date);
  };

  const getWorkoutsForWeek = () => {
    const currentDate = new Date(selectedDate);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekWorkouts: { [key: string]: ScheduledWorkout[] } = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      weekWorkouts[dateString] = getWorkoutsForDate(dateString);
    }
    
    return weekWorkouts;
  };

  const handleMoveWorkout = async (workoutId: string, fromDate: string, toDate: string) => {
    try {
      // Find the plan item that contains this workout
      const planItem = workoutPlans
        .flatMap(plan => plan.planItems || [])
        .find(item => item.workout?.id === workoutId);

      if (!planItem) {
        Alert.alert('Error', 'Could not find workout plan item');
        return;
      }

      // Update the frequency to include the new day
      const fromDay = new Date(fromDate).toLocaleDateString('en-US', { weekday: 'short' });
      const toDay = new Date(toDate).toLocaleDateString('en-US', { weekday: 'short' });
      
      let newFrequency = planItem.frequency;
      if (newFrequency.includes(fromDay)) {
        newFrequency = newFrequency.replace(fromDay, '').replace(/,,/g, ',').replace(/^,|,$/g, '');
      }
      if (!newFrequency.includes(toDay)) {
        newFrequency = newFrequency ? `${newFrequency},${toDay}` : toDay;
      }

      // Update the plan item
      await apiService.addWorkoutToPlan(planItem.workoutPlanId, {
        workoutId: planItem.workoutId,
        frequency: newFrequency,
        intensity: planItem.intensity,
      });

      // Remove the old plan item
      await apiService.removeWorkoutFromPlan(planItem.id);

      // Reload data
      loadWorkoutPlans();
      
      Alert.alert('Success', 'Workout moved successfully!');
    } catch (error) {
      console.error('Error moving workout:', error);
      Alert.alert('Error', 'Failed to move workout');
    }
  };

  const calendarTheme = {
    backgroundColor: theme.colors.surface,
    calendarBackground: theme.colors.surface,
    textSectionTitleColor: theme.colors.text,
    selectedDayBackgroundColor: theme.colors.accent,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: theme.colors.accent,
    dayTextColor: theme.colors.text,
    textDisabledColor: theme.colors.subtext,
    dotColor: theme.colors.accent,
    selectedDotColor: '#FFFFFF',
    arrowColor: theme.colors.accent,
    disabledArrowColor: theme.colors.subtext,
    monthTextColor: theme.colors.text,
    indicatorColor: theme.colors.accent,
    textDayFontFamily: 'Inter_400Regular',
    textMonthFontFamily: 'Inter_600SemiBold',
    textDayHeaderFontFamily: 'Inter_400Regular',
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  const getMarkedDates = () => {
    const marked: any = {
      [selectedDate]: {
        selected: true,
        selectedColor: theme.colors.accent,
      },
    };

    // Mark dates with workouts
    scheduledWorkouts.forEach(workout => {
      if (!marked[workout.date]) {
        marked[workout.date] = {
          marked: true,
          dotColor: theme.colors.accent,
        };
      }
    });

    return marked;
  };

  const weekWorkouts = getWorkoutsForWeek();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().toISOString().split('T')[0];
  const selectedDayWorkouts = getWorkoutsForDate(selectedDate);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Weekly Row */}
        <View style={styles.weeklyRowContainer}>
          <View style={[styles.weeklyRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {dayNames.map((dayName, index) => {
              const currentDate = new Date(selectedDate);
              const startOfWeek = new Date(currentDate);
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
              const date = new Date(startOfWeek);
              date.setDate(startOfWeek.getDate() + index);
              const dateString = date.toISOString().split('T')[0];
              const dayWorkouts = weekWorkouts[dateString] || [];
              const isToday = dateString === today;
              const isSelected = dateString === selectedDate;

              return (
                <TouchableOpacity
                  key={dayName}
                  style={[
                    styles.dayColumn,
                    { 
                      backgroundColor: isToday ? theme.colors.accent + '20' : 'transparent',
                      borderColor: isSelected ? theme.colors.accent : 'transparent',
                    }
                  ]}
                  onPress={() => setSelectedDate(dateString)}
                >
                  <Text style={[
                    styles.dayNameShort,
                    { 
                      color: isToday ? theme.colors.accent : theme.colors.text,
                      fontFamily: 'Inter_600SemiBold'
                    }
                  ]}>
                    {dayName}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    { 
                      color: isToday ? theme.colors.accent : theme.colors.subtext,
                      fontFamily: 'Inter_400Regular'
                    }
                  ]}>
                    {date.getDate()}
                  </Text>
                  {dayWorkouts.length > 0 && (
                    <View style={[styles.workoutDot, { backgroundColor: theme.colors.accent }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={[styles.calendarToggle, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setShowFullCalendar(!showFullCalendar)}
          >
            <Text style={[styles.calendarToggleText, { color: theme.colors.text }]}>
              {showFullCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Calendar (Conditional) */}
        {showFullCalendar && (
          <View style={[styles.calendarContainer, { backgroundColor: theme.colors.surface }]}>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={getMarkedDates()}
              theme={calendarTheme}
              style={styles.calendar}
            />
          </View>
        )}

        {/* Selected Day's Workouts */}
        <View style={styles.todaySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {selectedDate === today ? "Today's Workouts" : `${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} Workouts`}
          </Text>
          
          {selectedDayWorkouts.length > 0 ? (
            <View style={styles.workoutsList}>
              {selectedDayWorkouts.map((scheduledWorkout) => (
                <TouchableOpacity
                  key={scheduledWorkout.id}
                  style={[styles.workoutCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onLongPress={() => {
                    Alert.alert(
                      'Move Workout',
                      `Move "${scheduledWorkout.workout.title}" to another day?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Move to Tomorrow', onPress: () => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          handleMoveWorkout(scheduledWorkout.workout.id, today, tomorrow.toISOString().split('T')[0]);
                        }},
                        { text: 'Move to Next Week', onPress: () => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          handleMoveWorkout(scheduledWorkout.workout.id, today, nextWeek.toISOString().split('T')[0]);
                        }},
                      ]
                    );
                  }}
                >
                  <View style={styles.workoutHeader}>
                    <Text style={[
                      styles.workoutTitle, 
                      { 
                        color: theme.colors.text,
                        fontFamily: 'Inter_600SemiBold'
                      }
                    ]}>
                      {scheduledWorkout.workout.title}
                    </Text>
                    <Text style={[styles.moveHint, { color: theme.colors.subtext }]}>Long press to move</Text>
                  </View>
                  <Text style={[
                    styles.workoutDetails, 
                    { 
                      color: theme.colors.subtext,
                      fontFamily: 'Inter_400Regular'
                    }
                  ]}>
                    {scheduledWorkout.workout.sets} sets × {scheduledWorkout.workout.reps} reps
                  </Text>
                  {scheduledWorkout.intensity && (
                    <Text style={[
                      styles.workoutIntensity, 
                      { 
                        color: theme.colors.accent,
                        fontFamily: 'Inter_400Regular'
                      }
                    ]}>
                      {scheduledWorkout.intensity}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                {selectedDate === today ? "No workouts scheduled for today" : `No workouts scheduled for ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtext }]}>
                Check your workout plans to schedule some exercises
              </Text>
            </View>
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
  // Weekly Row Styles
  weeklyRowContainer: {
    padding: 16,
  },
  weeklyRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 2,
  },
  dayNameShort: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    marginBottom: 4,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  calendarToggleText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  // Calendar Styles
  calendarContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 16,
  },
  // Today's Workouts Styles
  todaySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 16,
    flex: 1,
  },
  moveHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  workoutDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  workoutIntensity: {
    fontSize: 14,
  },
  // Empty State
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
});
