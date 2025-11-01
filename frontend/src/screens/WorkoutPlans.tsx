import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from "react-native";
import { WorkoutPlan, CreateWorkoutPlanRequest } from "../types";
import { WorkoutPlanForm } from "../components/WorkoutPlanForm";
import { apiService } from "../services/api";

interface WorkoutPlanCardProps {
    plan: WorkoutPlan;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({ plan, onPress, onEdit, onDelete }) => {
    const startDate = new Date(plan.startDate).toLocaleDateString();
    const endDate = new Date(plan.endDate).toLocaleDateString();
    const workoutCount = plan.planItems?.length || 0;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardContent}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.dateRange}>
                    {startDate} - {endDate}
                </Text>
                <Text style={styles.workoutCount}>{workoutCount} workouts</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={onDelete}
                >
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export const WorkoutPlans: React.FC = () => {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<WorkoutPlan | undefined>();

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await apiService.getWorkoutPlans();
            setPlans(data);
        } catch (error) {
            Alert.alert("Error", "Failed to load workout plans");
            console.error("Error loading plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (planData: CreateWorkoutPlanRequest) => {
        try {
            const newPlan = await apiService.createWorkoutPlan(planData);
            setPlans((prev) => [newPlan, ...prev]);
            setShowForm(false);
            Alert.alert("Success", "Workout plan created successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to create workout plan");
            console.error("Error creating plan:", error);
        }
    };

    const handleEditPlan = (plan: WorkoutPlan) => {
        setEditingPlan(plan);
        setShowForm(true);
    };

    const handleDeletePlan = (plan: WorkoutPlan) => {
        Alert.alert("Delete Plan", `Are you sure you want to delete "${plan.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    // TODO: Implement delete plan API call
                    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
                    Alert.alert("Success", "Plan deleted successfully!");
                },
            },
        ]);
    };

    const handleFormSubmit = (planData: CreateWorkoutPlanRequest) => {
        if (editingPlan) {
            // TODO: Implement update plan API call
            Alert.alert("Info", "Update functionality coming soon!");
        } else {
            handleCreatePlan(planData);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingPlan(undefined);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workout Plans</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                    <Text style={styles.addButtonText}>+ Add Plan</Text>
                </TouchableOpacity>
            </View>

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

            <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
                <WorkoutPlanForm
                    plan={editingPlan}
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
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#333",
    },
    dateRange: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    workoutCount: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "500",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 12,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: "#007AFF",
        marginLeft: 8,
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
    },
    actionText: {
        color: "white",
        fontSize: 12,
        fontWeight: "500",
    },
    deleteText: {
        color: "white",
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
