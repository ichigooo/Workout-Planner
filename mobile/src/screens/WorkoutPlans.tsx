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
} from 'react-native';
import { getTheme } from '../theme';
import { WorkoutPlan, CreateWorkoutPlanRequest } from '../types';
import { WorkoutPlanForm } from '../components/WorkoutPlanForm';
import { apiService } from '../services/api';

interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({ 
  plan, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const startDate = new Date(plan.startDate).toLocaleDateString();
  const endDate = new Date(plan.endDate).toLocaleDateString();
  const workoutCount = plan.planItems?.length || 0;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.card }]} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={[styles.planName, { color: theme.colors.text }]}>{plan.name}</Text>
        <Text style={[styles.dateRange, { color: theme.colors.subtext }]}>{startDate} - {endDate}</Text>
        <Text style={[styles.workoutCount, { color: theme.colors.accent }]}>{workoutCount} workouts</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.accent }]} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.danger }]} onPress={onDelete}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const WorkoutPlans: React.FC = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | undefined>();
  // Single routine mode: prefer a known routine if present; otherwise use the first plan
  const ROUTINE_NAME: string | null = null;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWorkoutPlans();
      // Enforce single routine: pick named routine, else fallback to first if exists
      const routine = ROUTINE_NAME
        ? (data || []).find((p) => (p.name || '').toLowerCase() === ROUTINE_NAME.toLowerCase())
        : (data && data.length > 0 ? data[0] : undefined);
      setPlans(routine ? [routine] : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plans');
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Creating additional plans is disabled for single-routine mode
  const handleCreatePlan = async (_planData: CreateWorkoutPlanRequest) => {
    Alert.alert('Info', 'Only one routine is supported. Edit the existing routine instead.');
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDeletePlan = (_plan: WorkoutPlan) => {
    Alert.alert('Info', 'Deleting the routine is disabled. Edit the routine instead.');
  };

  const handleFormSubmit = (planData: CreateWorkoutPlanRequest) => {
    if (editingPlan) {
      // TODO: Implement update plan API call
      Alert.alert('Info', 'Update functionality coming soon!');
    } else {
      handleCreatePlan(planData);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlan(undefined);
  };


  const handlePlanUpdated = () => {
    loadPlans(); // Reload plans to get updated data
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Routine</Text>
      </View>

      {plans.length > 0 ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutPlanCard
              plan={item}
              onPress={() => handleEditPlan(item)}
              onEdit={() => handleEditPlan(item)}
              onDelete={() => handleDeletePlan(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.listContainer}>
          <Text style={{ textAlign: 'center', color: theme.colors.subtext }}>No routine found.</Text>
        </View>
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WorkoutPlanForm
          plan={editingPlan}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          onPlanUpdated={handlePlanUpdated}
        />
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
  listContainer: {
    paddingVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardContent: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    marginBottom: 8,
  },
  workoutCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
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
