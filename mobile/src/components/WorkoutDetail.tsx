import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  useColorScheme,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Workout, WorkoutPlan, CreatePlanItemRequest, CreateWorkoutRequest } from '../types';
import { getTheme } from '../theme';
import { apiService } from '../services/api';
import { WorkoutForm } from './WorkoutForm';

interface WorkoutDetailProps {
  workout: Workout;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ 
  workout, 
  onEdit, 
  onDelete, 
  onClose 
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  
  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // Add to plan sheet state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{[key: string]: any}>({});
  const [planId, setPlanId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Temporary: test user id used elsewhere in the app for local testing
  const TEST_CURRENT_USER_ID = '48a1fd02-b5d4-4942-9356-439ecfbf13f8';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await apiService.getUserProfile(TEST_CURRENT_USER_ID);
      if (!mounted) return;
      setIsCurrentUserAdmin(u.isAdmin);
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogWorkout = () => {
    Alert.alert('Saved', 'Notes saved.');
  };

  const handleEditPress = () => {
    setShowMenu(false);
    // open inline edit modal
    setShowEditModal(true);
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    onDelete();
  };

  const openAddSheet = async () => {
    setShowAddSheet(true);
    try {
      const plans = await apiService.getWorkoutPlans();
      if (Array.isArray(plans) && plans.length > 0) setPlanId(plans[0].id);
    } catch (e) {
      console.warn('Failed to load plans for add sheet', e);
    }
  };

  const handleAddToPlan = async () => {
    if (!planId) {
      Alert.alert('No plan', 'No plan available to add to');
      return;
    }
    const dates = Object.keys(selectedDates);
    if (dates.length === 0) {
      Alert.alert('No dates selected', 'Please select at least one date');
      return;
    }
    try {
      setAdding(true);
      await apiService.addWorkoutToPlanOnDates(planId, { workoutId: workout.id, dates });
      // refresh cache
      try { await apiService.fetchAndCachePlanItems(planId); } catch (e) {}
      setShowAddSheet(false);
      setSelectedDates({});
      Alert.alert('Added', `Workout added to ${dates.length} date(s)`);
    } catch (e) {
      console.error('Add to plan failed', e);
      Alert.alert('Error', 'Failed to add workout to plan');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Workout Details</Text>
        {isCurrentUserAdmin ? (
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
            <Text style={[styles.menuButtonText, { color: theme.colors.text }]}>⋯</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(() => {
          const imgs = [workout.imageUrl, workout.imageUrl2].filter(Boolean) as string[];
          if (imgs.length === 0) return null;
          const slideWidth = Dimensions.get('window').width - 32; // account for padding
          return (
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                {imgs.map((uri, idx) => (
                  <View key={`${uri}-${idx}`} style={[styles.imageSlideWrapper, { width: slideWidth }] }>
                    <Image source={{ uri }} style={styles.imageSlide} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })()}
        
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{workout.title}</Text>
          <Text style={[styles.category, { color: theme.colors.accent }]}>{workout.category}</Text>
          
          {workout.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: theme.colors.subtext }]}>{workout.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Workout Details</Text>
            <View style={styles.detailsGrid}>
              {workout.workoutType === 'cardio' ? (
                <View style={[styles.detailItem, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Duration</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{workout.duration} min</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.detailItem, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Sets</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{workout.sets}</Text>
                  </View>
                  <View style={[styles.detailItem, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Reps</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{workout.reps}</Text>
                  </View>
                </>
              )}
              <View style={[styles.detailItem, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Intensity</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{workout.intensity}</Text>
              </View>
            </View>
          </View>

          {/* Add to Plan Button */}
          <TouchableOpacity 
            style={[styles.addToPlanButton, { backgroundColor: theme.colors.accent }]} 
            onPress={openAddSheet}
          >
            <Text style={styles.addToPlanButtonText}>Add to Plan</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} 
              onPress={handleEditPress}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Edit Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleDeletePress}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>Delete Workout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Edit workout modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <WorkoutForm
            workout={workout}
            onCancel={() => setShowEditModal(false)}
            onSubmit={async (payload: CreateWorkoutRequest) => {
              try {
                // call API to update workout
                await apiService.updateWorkout(workout.id, payload);
                // refresh workout details by fetching again
                const refreshed = await apiService.getWorkout(workout.id);
                // notify parent via onEdit callback to let it refresh
                onEdit();
                setShowEditModal(false);
                // Optionally update UI immediately (not wired here)
                Alert.alert('Updated', 'Workout updated successfully');
              } catch (e) {
                console.error('Failed to update workout', e);
                Alert.alert('Error', 'Failed to update workout');
              }
            }}
          />
        </SafeAreaView>
      </Modal>
      <Modal visible={showAddSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSheet(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}> 
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add to Plan</Text>
            <TouchableOpacity onPress={() => setShowAddSheet(false)}>
              <Text style={{ color: theme.colors.accent }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Select Dates</Text>
            <Calendar
              onDayPress={(day) => {
                const dateString = day.dateString;
                setSelectedDates(prev => {
                  const newDates = { ...prev };
                  if (newDates[dateString]) delete newDates[dateString]; else newDates[dateString] = { selected: true, selectedColor: theme.colors.accent };
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
              }}
              style={{ marginVertical: 8 }}
            />

            <TouchableOpacity onPress={handleAddToPlan} disabled={adding} style={[styles.addButton, { backgroundColor: theme.colors.accent, marginTop: 12 }]}> 
              <Text style={styles.addButtonText}>{adding ? 'Adding...' : 'Add to Plan'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  imageSlideWrapper: {
    height: '100%',
    paddingHorizontal: 8,
  },
  imageSlide: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dualImageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dualImage: {
    flex: 1,
    height: '100%',
  },
  imageSpacer: {
    width: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  addToPlanButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addToPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    // backgroundColor set dynamically
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Tracker styles
  timerContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  setsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  completeSetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  completeSetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inputsContainer: {
    marginBottom: 12,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  logButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  plansSelector: {
    marginBottom: 8,
  },
  planOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  planOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
