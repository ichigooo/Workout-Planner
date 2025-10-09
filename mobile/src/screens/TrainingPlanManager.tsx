import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, useColorScheme, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { getTheme } from '../theme';
import { apiService } from '../services/api';
import { WorkoutPlan, CreateWorkoutPlanRequest, Workout } from '../types';
import { WorkoutPlanForm } from '../components/WorkoutPlanForm';
import { Ionicons } from '@expo/vector-icons';

export const TrainingPlanManager: React.FC = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const [plan, setPlan] = useState<WorkoutPlan | undefined>();
  const [loading, setLoading] = useState(true);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<{[key: string]: any}>({});

  useEffect(() => {
    loadPlan();
    loadWorkouts();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWorkoutPlans();
      const routine = data && data.length > 0 ? data[0] : undefined;
      setPlan(routine);
    } catch (e) {
      Alert.alert('Error', 'Failed to load routine');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (_payload: CreateWorkoutPlanRequest) => {
    // For now, delegate to the embedded form flow which already saves plan items via callbacks
    Alert.alert('Saved', 'Routine saved successfully');
  };

  const loadWorkouts = async () => {
    try {
      const ws = await apiService.getWorkouts();
      setAllWorkouts(ws || []);
    } catch (e) {
      // ignore
    }
  };

  const categories = useMemo(() => Array.from(new Set(allWorkouts.map(w => w.category))).sort(), [allWorkouts]);
  const workoutsByCategory = useMemo(() => selectedCategory ? allWorkouts.filter(w => w.category === selectedCategory) : [], [allWorkouts, selectedCategory]);

  // Ensure a default category is selected (first one) so the list isn't empty
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Keep the active category chip in view
  const categoriesListRef = useRef<FlatList<string>>(null);
  useEffect(() => {
    if (!selectedCategory) return;
    const index = categories.findIndex(c => c === selectedCategory);
    if (index >= 0 && categoriesListRef.current) {
      categoriesListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, [selectedCategory, categories]);

  const handleQuickAdd = async () => {
    if (!plan || !selectedWorkoutId) return;
    
    const selectedDateStrings = Object.keys(selectedDates);
    if (selectedDateStrings.length === 0) {
      Alert.alert('No dates selected', 'Please select at least one date for the workout');
      return;
    }
    
    try {
      // Use the new API to add workout to specific dates
      await apiService.addWorkoutToPlanOnDates(plan.id, {
        workoutId: selectedWorkoutId,
        dates: selectedDateStrings,
        intensity: undefined,
      });
      
      setShowAddSheet(false);
      setSelectedWorkoutId(null);
      setSelectedCategory(null);
      setSelectedDates({});
      
      // Refresh the plan to show the new workouts
      await loadPlan();
      
      Alert.alert('Added', `Workout added to ${selectedDateStrings.length} date(s)`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add workout');
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 24 }}>Loading routine...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Current Training Plan</Text>
        <TouchableOpacity onPress={() => setShowAddSheet(true)} style={[styles.browseButton, { borderColor: theme.colors.border }] }>
          <Text style={[styles.browseText, { color: theme.colors.accent }]}>Browse all workouts</Text>
        </TouchableOpacity>
      </View>

      <WorkoutPlanForm
        plan={plan}
        hideDates
        onSubmit={handleSubmit}
        onCancel={() => {}}
        onPlanUpdated={loadPlan}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.accent }]} onPress={() => setShowAddSheet(true)}>
        <Ionicons name="add" color="#fff" size={28} />
      </TouchableOpacity>

      <Modal visible={showAddSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSheet(false)}>
        <SafeAreaView edges={['top']} style={[styles.sheetContainer, { backgroundColor: theme.colors.bg }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Add Workout</Text>
            <TouchableOpacity onPress={() => setShowAddSheet(false)}>
              <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Category</Text>
            <FlatList
              ref={categoriesListRef}
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = selectedCategory === item;
                return (
                  <TouchableOpacity
                    style={[styles.chip, { borderColor: theme.colors.border, backgroundColor: active ? theme.colors.accent : theme.colors.surface }]}
                    onPress={() => { setSelectedCategory(item); setSelectedWorkoutId(null); }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: active ? '#fff' : theme.colors.text, fontWeight: '600' }}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              onScrollToIndexFailed={(info) => {
                // As a fallback, approximate offset
                const approx = Math.max(0, (info.index - 1) * 100);
                categoriesListRef.current?.scrollToOffset({ offset: approx, animated: true });
              }}
            />

            <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>Workout</Text>
            <View style={{ gap: 8 }}>
              {workoutsByCategory.map(w => {
                const active = selectedWorkoutId === w.id;
                return (
                  <TouchableOpacity key={w.id} style={[styles.workoutRow, { borderColor: theme.colors.border, backgroundColor: active ? theme.colors.accent + '15' : theme.colors.surface }]} onPress={() => setSelectedWorkoutId(w.id)}>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{w.title}</Text>
                    <Text style={{ color: theme.colors.subtext, marginTop: 2 }}>{w.category}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>Select Dates</Text>
            <Calendar
              onDayPress={(day) => {
                const dateString = day.dateString;
                setSelectedDates(prev => {
                  const newDates = { ...prev };
                  if (newDates[dateString]) {
                    delete newDates[dateString];
                  } else {
                    newDates[dateString] = { selected: true, selectedColor: theme.colors.accent };
                  }
                  return newDates;
                });
              }}
              markedDates={selectedDates}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.accent,
                selectedDayTextColor: '#fff',
                todayTextColor: theme.colors.accent,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.subtext,
                dotColor: theme.colors.accent,
                selectedDotColor: '#fff',
                arrowColor: theme.colors.accent,
                monthTextColor: theme.colors.text,
                indicatorColor: theme.colors.accent,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />

            <TouchableOpacity disabled={!selectedWorkoutId || Object.keys(selectedDates).length === 0} onPress={handleQuickAdd} style={[styles.addBtn, { backgroundColor: (selectedWorkoutId && Object.keys(selectedDates).length > 0) ? theme.colors.accent : theme.colors.subtext }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>ADD</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  browseButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  browseText: { fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  sheetContainer: { flex: 1 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  fieldLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  workoutRow: { borderWidth: 1, borderRadius: 12, padding: 12 },
  calendar: { marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  addBtn: { marginTop: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
});

export default TrainingPlanManager;
