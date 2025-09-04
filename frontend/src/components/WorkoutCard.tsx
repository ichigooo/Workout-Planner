import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Workout } from '../types';

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ 
  workout, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {workout.imageUrl && (
        <Image source={{ uri: workout.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.category}>{workout.category}</Text>
        <Text style={styles.description}>{workout.description}</Text>
        <View style={styles.details}>
          <Text style={styles.detailText}>{workout.sets} sets × {workout.reps} reps</Text>
          <Text style={styles.detailText}>{workout.intensity}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
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
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: 'white',
  },
});
