import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { getTheme } from '../theme';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutForm } from '../components/WorkoutForm';
import { WorkoutDetail } from '../components/WorkoutDetail';
import { Workout, CreateWorkoutRequest } from '../types';
import { apiService } from '../services/api';

export const WorkoutLibrary: React.FC = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();
  const [viewingWorkout, setViewingWorkout] = useState<Workout | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWorkouts();
      setWorkouts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workouts');
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async (workoutData: CreateWorkoutRequest) => {
    try {
      const newWorkout = await apiService.createWorkout(workoutData);
      setWorkouts(prev => [newWorkout, ...prev]);
      setShowForm(false);
      Alert.alert('Success', 'Workout created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create workout');
      console.error('Error creating workout:', error);
    }
  };

  const handleUpdateWorkout = async (workoutData: CreateWorkoutRequest) => {
    if (!editingWorkout) return;
    
    try {
      const updatedWorkout = await apiService.updateWorkout(editingWorkout.id, workoutData);
      setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? updatedWorkout : w));
      setShowForm(false);
      setEditingWorkout(undefined);
      Alert.alert('Success', 'Workout updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update workout');
      console.error('Error updating workout:', error);
    }
  };

  const handleDeleteWorkout = async (workout: Workout) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteWorkout(workout.id);
              setWorkouts(prev => prev.filter(w => w.id !== workout.id));
              Alert.alert('Success', 'Workout deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
              console.error('Error deleting workout:', error);
            }
          },
        },
      ]
    );
  };

  const handleViewWorkout = (workout: Workout) => {
    setViewingWorkout(workout);
    setShowDetail(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleFormSubmit = (workoutData: CreateWorkoutRequest) => {
    if (editingWorkout) {
      handleUpdateWorkout(workoutData);
    } else {
      handleCreateWorkout(workoutData);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingWorkout(undefined);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setViewingWorkout(undefined);
  };

  // Get unique categories from workouts
  const getUniqueCategories = () => {
    const categories = workouts.map(workout => workout.category);
    return Array.from(new Set(categories)).sort();
  };

  // Filter workouts by selected category
  const getFilteredWorkouts = () => {
    if (!selectedCategory) return workouts;
    return workouts.filter(workout => workout.category === selectedCategory);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Global Workout Library</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.accent }]} 
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={[styles.categoryFilter, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              { 
                backgroundColor: selectedCategory === null ? theme.colors.accent : theme.colors.bg,
                borderColor: theme.colors.border
              }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === null ? theme.colors.surface : theme.colors.text }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {getUniqueCategories().map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedCategory === category ? theme.colors.accent : theme.colors.bg,
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                { color: selectedCategory === category ? theme.colors.surface : theme.colors.text }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredWorkouts()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => handleViewWorkout(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WorkoutForm
          workout={editingWorkout}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
        />
      </Modal>

      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {viewingWorkout && (
          <WorkoutDetail
            workout={viewingWorkout}
            onEdit={() => handleEditWorkout(viewingWorkout)}
            onDelete={() => handleDeleteWorkout(viewingWorkout)}
            onClose={handleCloseDetail}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilter: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  listContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
