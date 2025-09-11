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
  Modal 
} from 'react-native';
import { Workout, WorkoutPlan, CreatePlanItemRequest } from '../types';
import { getTheme } from '../theme';
import { apiService } from '../services/api';

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
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [currentWeight, setCurrentWeight] = useState('');
  const [notes, setNotes] = useState('');
  
  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // Add to plan state
  const [showAddToPlan, setShowAddToPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
  };

  const handleCompleteSet = () => {
    if (setsCompleted < (workout.sets || 0)) {
      setSetsCompleted(setsCompleted + 1);
    }
  };

  const handleLogWorkout = () => {
    if (setsCompleted === 0) {
      Alert.alert('No sets completed', 'Please complete at least one set before logging.');
      return;
    }
    
    Alert.alert(
      'Log Workout',
      `Log ${setsCompleted}/${workout.sets || 0} sets completed in ${formatTime(time)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log', 
          onPress: () => {
            // TODO: Save to backend
            Alert.alert('Success', 'Workout logged successfully!');
            handleReset();
            setSetsCompleted(0);
            setCurrentWeight('');
            setNotes('');
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    setShowMenu(false);
    onEdit();
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    onDelete();
  };

  const loadPlans = async () => {
    try {
      const plans = await apiService.getWorkoutPlans();
      setAvailablePlans(plans);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleAddToPlan = async () => {
    if (!selectedPlan || !frequency) {
      Alert.alert('Error', 'Please select a plan and specify frequency');
      return;
    }

    try {
      await apiService.addWorkoutToPlan(selectedPlan, {
        workoutId: workout.id,
        frequency: frequency,
        intensity: workout.intensity,
      });
      
      Alert.alert('Success', 'Workout added to plan successfully!');
      setShowAddToPlan(false);
      setSelectedPlan('');
      setFrequency('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add workout to plan');
      console.error('Error adding workout to plan:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Workout Details</Text>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Text style={[styles.menuButtonText, { color: theme.colors.text }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {workout.imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: workout.imageUrl }} 
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        
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
            onPress={() => {
              loadPlans();
              setShowAddToPlan(true);
            }}
          >
            <Text style={styles.addToPlanButtonText}>Add to Plan</Text>
          </TouchableOpacity>

          {/* Workout Tracker Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Workout Tracker</Text>
            
            {/* Timer */}
            <View style={[styles.timerContainer, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
              <Text style={[styles.timerText, { color: theme.colors.text }]}>{formatTime(time)}</Text>
              <View style={styles.timerButtons}>
                <TouchableOpacity 
                  style={[styles.timerButton, { backgroundColor: theme.colors.accent }]} 
                  onPress={handleStartStop}
                >
                  <Text style={styles.timerButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.timerButton, { backgroundColor: theme.colors.subtext }]} 
                  onPress={handleReset}
                >
                  <Text style={styles.timerButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sets Progress - only for strength workouts */}
            {workout.workoutType === 'strength' && (
              <View style={[styles.setsContainer, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                <Text style={[styles.setsTitle, { color: theme.colors.text }]}>Sets Progress</Text>
                <View style={styles.setsProgress}>
                  <Text style={[styles.setsText, { color: theme.colors.text }]}>
                    {setsCompleted} / {workout.sets || 0} completed
                  </Text>
                  <TouchableOpacity 
                    style={[styles.completeSetButton, { backgroundColor: theme.colors.accent }]} 
                    onPress={handleCompleteSet}
                    disabled={setsCompleted >= (workout.sets || 0)}
                  >
                    <Text style={styles.completeSetText}>+1 Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Weight & Notes */}
            <View style={styles.inputsContainer}>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Notes</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes..."
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>
            </View>

            {/* Log Workout Button */}
            <TouchableOpacity 
              style={[styles.logButton, { backgroundColor: theme.colors.accent }]} 
              onPress={handleLogWorkout}
            >
              <Text style={styles.logButtonText}>Log Workout</Text>
            </TouchableOpacity>
          </View>
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

      {/* Add to Plan Modal */}
      <Modal
        visible={showAddToPlan}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddToPlan(false)} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add to Plan</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.workoutTitle, { color: theme.colors.text }]}>{workout.title}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Select Plan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansSelector}>
                {availablePlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planOption, 
                      { 
                        backgroundColor: selectedPlan === plan.id ? theme.colors.accent : theme.colors.surface,
                        borderColor: theme.colors.border 
                      }
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    <Text style={[
                      styles.planOptionText,
                      { color: selectedPlan === plan.id ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Frequency *</Text>
              <TextInput
                style={[styles.frequencyInput, { 
                  backgroundColor: theme.colors.surface, 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text 
                }]}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="e.g., Mon,Wed,Fri or daily"
                placeholderTextColor={theme.colors.subtext}
              />
              <Text style={[styles.helpText, { color: theme.colors.subtext }]}>
                Specify which days (Mon,Tue,Wed,Thu,Fri,Sat,Sun) or "daily"
              </Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.colors.subtext }]} 
                onPress={() => setShowAddToPlan(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.accent }]} 
                onPress={handleAddToPlan}
              >
                <Text style={styles.addButtonText}>Add to Plan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
