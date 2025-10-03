import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTheme } from '../theme';
import { apiService } from '../services/api';
import { Workout, WorkoutPlan } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface HomeProps {
  onOpenCalendar: () => void;
  onOpenProfile: () => void;
  onOpenLibrary: (category?: string) => void;
  onOpenRoutine?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenCalendar, onOpenProfile, onOpenLibrary, onOpenRoutine }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadWorkouts();
    loadPlans();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWorkouts();
      setWorkouts(data || []);
    } catch (err) {
      console.error('Failed to load workouts', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const plans = await apiService.getWorkoutPlans();
      setWorkoutPlans(plans || []);
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  };

  // Helpers to compute scheduled workouts similar to CalendarView
  const isWorkoutScheduledForDay = (frequency: string, dayName: string): boolean => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun',
    };
    const shortDay = dayMap[dayName];
    return frequency?.includes(shortDay) || frequency?.toLowerCase?.().includes('daily');
  };

  const getWeekDates = (baseISO: string) => {
    const base = new Date(baseISO);
    const startOfWeek = new Date(base);
    // Sunday as 0; align to Sunday start
    startOfWeek.setDate(base.getDate() - base.getDay());
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getScheduledWorkoutsByDate = (): Record<string, Workout[]> => {
    const weekDates = getWeekDates(selectedDate);
    const result: Record<string, Workout[]> = {};
    weekDates.forEach(d => (result[d] = []));

    workoutPlans.forEach(plan => {
      const planStart = plan.startDate ? new Date(plan.startDate) : null;
      const planEnd = plan.endDate ? new Date(plan.endDate) : null;
      weekDates.forEach(dateISO => {
        const dateObj = new Date(dateISO);
        // If plan has no start/end date (perpetual routine), include for all dates
        const inRange = (!planStart && !planEnd) || (planStart && planEnd && dateObj >= planStart && dateObj <= planEnd);
        if (inRange) {
          plan.planItems?.forEach(item => {
            if (item.workout) {
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              if (isWorkoutScheduledForDay(item.frequency, dayName)) {
                result[dateISO].push(item.workout);
              }
            }
          });
        }
      });
    });
    return result;
  };

  const weekDates = getWeekDates(selectedDate);
  const weekWorkouts = getScheduledWorkoutsByDate();
  const todayISO = new Date().toISOString().split('T')[0];

  const todaysWorkout = workouts.length > 0 ? workouts[0] : undefined;

  const renderWorkoutPreview = ({ item }: { item: Workout }) => (
    <TouchableOpacity style={[styles.previewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={onOpenLibrary}>
      <View style={styles.previewHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}> 
          <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.previewTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.title}</Text>
      {item.description ? <Text style={[styles.previewDesc, { color: theme.colors.subtext }]} numberOfLines={2}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  // Simple week snapshot UI
  const WeekSnapshot = () => {
    const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return (
      <View style={styles.weekContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>This week</Text>
        <View style={[styles.weekCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.weekRow}>
            {weekDates.map((dateISO) => {
              const d = new Date(dateISO);
              const label = dayShort[d.getDay()];
              const hasWorkouts = (weekWorkouts[dateISO] || []).length > 0;
              const isToday = dateISO === todayISO;
              const isSelected = dateISO === selectedDate;
              return (
                <TouchableOpacity
                  key={dateISO}
                  style={[
                    styles.dayCol,
                    {
                      backgroundColor: isSelected ? theme.colors.accent + '20' : 'transparent',
                      borderColor: isSelected ? theme.colors.accent : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                      borderRadius: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 6,
                    },
                  ]}
                  onPress={() => setSelectedDate(dateISO)}
                >
                  <Text style={[
                    styles.dayLabel,
                    { color: isSelected ? theme.colors.accent : isToday ? theme.colors.accent : theme.colors.subtext }
                  ]}>{label}</Text>
                  <View style={[styles.dot, { backgroundColor: hasWorkouts ? theme.colors.accent : theme.colors.border }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onOpenProfile} style={styles.iconButton}>
          <Image source={require('../../assets/images/catt.png')} style={styles.profileImage} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenCalendar} style={styles.iconButton}>
          <Ionicons name="calendar-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Good morning</Text>

      <WeekSnapshot />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {selectedDate === todayISO ? "Today's workouts" : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        {(weekWorkouts[selectedDate] && weekWorkouts[selectedDate].length > 0) ? (
          <View style={{ gap: 12 }}>
            {weekWorkouts[selectedDate].map((item, idx) => (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                style={[styles.previewCardFull, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={onOpenLibrary}
              >
                <View style={styles.previewHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}> 
                    <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.previewTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.previewDesc, { color: theme.colors.subtext }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.todaysCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.todaysTitle, { color: theme.colors.text }]}>No workout scheduled</Text>
          </View>
        )}
      </View>

      {/* Workout categories snapshot below today's workouts */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Workout</Text>
          <TouchableOpacity onPress={onOpenLibrary}>
            <Text style={[styles.linkText, { color: theme.colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryGrid}>
          {Array.from(new Set(workouts.map(w => w.category))).sort().map((cat) => (
            <TouchableOpacity
              key={String(cat)}
              style={[styles.categoryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 }]}
              onPress={() => onOpenLibrary && onOpenLibrary(String(cat))}
              activeOpacity={0.85}
            >
              <Ionicons name="barbell-outline" size={28} color={theme.colors.accent} style={{ marginBottom: 8 }} />
              <Text style={[styles.categoryTileText, { color: theme.colors.text }]} numberOfLines={1}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  weekContainer: {
    marginBottom: 16,
  },
  weekCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  todaysCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todaysTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  todaysDesc: {
    fontSize: 14,
  },
  previewList: {
    paddingVertical: 8,
  },
  previewCard: {
    width: 220,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewCardFull: {
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  previewDesc: {
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryTile: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryTileText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Home;
