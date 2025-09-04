import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { WorkoutPlan, CreateWorkoutPlanRequest } from '../types';

interface WorkoutPlanFormProps {
  plan?: WorkoutPlan;
  onSubmit: (plan: CreateWorkoutPlanRequest) => void;
  onCancel: () => void;
}

export const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({ 
  plan, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState(plan?.name || '');
  const [startDate, setStartDate] = useState(plan?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(plan?.endDate || new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
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

    onSubmit(planData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{plan ? 'Edit Workout Plan' : 'Create New Workout Plan'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Plan Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter plan name"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>End Date *</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {plan ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
});
