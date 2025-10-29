import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from "react-native";
import { WorkoutCard } from "../components/WorkoutCard";
import { WorkoutForm } from "../components/WorkoutForm";
import { Workout, CreateWorkoutRequest } from "../types";
import { apiService } from "../services/api";

export const WorkoutLibrary: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();

    useEffect(() => {
        loadWorkouts();
    }, []);

    const loadWorkouts = async () => {
        try {
            setLoading(true);
            const data = await apiService.getWorkouts();
            setWorkouts(data);
        } catch (error) {
            Alert.alert("Error", "Failed to load workouts");
            console.error("Error loading workouts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkout = async (workoutData: CreateWorkoutRequest) => {
        try {
            const newWorkout = await apiService.createWorkout(workoutData);
            setWorkouts((prev) => [newWorkout, ...prev]);
            setShowForm(false);
            Alert.alert("Success", "Workout created successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to create workout");
            console.error("Error creating workout:", error);
        }
    };

    const handleUpdateWorkout = async (workoutData: CreateWorkoutRequest) => {
        if (!editingWorkout) return;

        try {
            const updatedWorkout = await apiService.updateWorkout(editingWorkout.id, workoutData);
            setWorkouts((prev) =>
                prev.map((w) => (w.id === editingWorkout.id ? updatedWorkout : w)),
            );
            setShowForm(false);
            setEditingWorkout(undefined);
            Alert.alert("Success", "Workout updated successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to update workout");
            console.error("Error updating workout:", error);
        }
    };

    const handleDeleteWorkout = async (workout: Workout) => {
        Alert.alert("Delete Workout", `Are you sure you want to delete "${workout.title}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await apiService.deleteWorkout(workout.id);
                        setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
                        Alert.alert("Success", "Workout deleted successfully!");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete workout");
                        console.error("Error deleting workout:", error);
                    }
                },
            },
        ]);
    };

    const handleEditWorkout = (workout: Workout) => {
        setEditingWorkout(workout);
        setShowForm(true);
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading workouts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workout Library</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                    <Text style={styles.addButtonText}>+ Add Workout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={workouts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <WorkoutCard
                        workout={item}
                        onPress={() => handleEditWorkout(item)}
                        onEdit={() => handleEditWorkout(item)}
                        onDelete={() => handleDeleteWorkout(item)}
                    />
                )}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
                <WorkoutForm
                    workout={editingWorkout}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelForm}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    addButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    listContainer: {
        paddingVertical: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
    },
});
