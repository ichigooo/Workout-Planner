import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTheme } from '@/src/theme';
import { apiService } from '@/src/services/api';
import { Workout } from '@/src/types';
import { WorkoutCard } from '@/src/components/WorkoutCard';
import { WorkoutDetail } from '@/src/components/WorkoutDetail';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Workout | undefined>();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiService.getWorkouts();
        setWorkouts(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Initialize category from query param
  useEffect(() => {
    if (typeof params?.category === 'string' && params.category.length > 0) {
      setCategory(params.category);
    }
  }, [params?.category]);

  const categories = Array.from(new Set(workouts.map(w => w.category))).sort();
  const filtered = category ? workouts.filter(w => w.category === category) : workouts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.accent }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Workout</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.filterBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <FlatList
          horizontal
          data={['All', ...categories]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCategory(item === 'All' ? null : item)}
              style={[styles.filterChip, { borderColor: theme.colors.border, backgroundColor: (item === 'All' ? category === null : category === item) ? theme.colors.accent : theme.colors.bg }]}
            >
              <Text style={[styles.filterText, { color: (item === 'All' ? category === null : category === item) ? '#fff' : theme.colors.text }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.subtext }}>Loading workouts...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => { setSelected(item); setShowDetail(true); }}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <WorkoutDetail
            workout={selected}
            onEdit={() => {}
            }
            onDelete={() => {}
            }
            onClose={() => setShowDetail(false)}
          />
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  filterBar: { borderBottomWidth: 1 },
  filterChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  filterText: { fontSize: 14, fontWeight: '600' },
});
