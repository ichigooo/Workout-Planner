import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Alert,
    ScrollView,
} from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { Workout, WorkoutPlan } from "../types";
import { apiService } from "../services/api";
import { getCurrentPlanId } from "../state/session";
import { getTheme } from "../theme";

interface DragDropWorkoutPlannerProps {
    plan: WorkoutPlan;
    onPlanUpdated: () => void;
}

interface WorkoutWithDays extends Workout {
    scheduledDays: string[];
    planItemId?: string;
}

const DAYS_OF_WEEK = [
    { key: "Mon", label: "Monday", short: "M" },
    { key: "Tue", label: "Tuesday", short: "T" },
    { key: "Wed", label: "Wednesday", short: "W" },
    { key: "Thu", label: "Thursday", short: "T" },
    { key: "Fri", label: "Friday", short: "F" },
    { key: "Sat", label: "Saturday", short: "S" },
    { key: "Sun", label: "Sunday", short: "S" },
];

export const DragDropWorkoutPlanner: React.FC<DragDropWorkoutPlannerProps> = ({
    plan,
    onPlanUpdated,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
    const [scheduledWorkouts, setScheduledWorkouts] = useState<WorkoutWithDays[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadData = useCallback(async () => {
        try {
            const cachedPlanId = getCurrentPlanId();
            const planData = await apiService.getWorkoutPlan(cachedPlanId!);
            const workouts = await apiService.getWorkouts();

            setAvailableWorkouts(workouts);

            // Convert plan items to scheduled workouts with days
            const currentPlan = planData;
            const scheduled: WorkoutWithDays[] = [];

            currentPlan?.planItems?.forEach((planItem) => {
                if (planItem.workout) {
                    const days = planItem.frequency.split(",").map((d) => d.trim());
                    scheduled.push({
                        ...planItem.workout,
                        scheduledDays: days,
                        planItemId: planItem.id,
                    });
                }
            });

            setScheduledWorkouts(scheduled);
        } catch (error) {
            console.error("Error loading data:", error);
            Alert.alert("Error", "Failed to load workouts");
        } finally {
            setLoading(false);
        }
    }, [plan.id]);

    const handleDragEnd = ({ data }: { data: WorkoutWithDays[] }) => {
        setScheduledWorkouts(data);
    };

    const handleDayToggle = (workoutId: string, dayKey: string) => {
        setScheduledWorkouts((prev) =>
            prev.map((workout) =>
                workout.id === workoutId
                    ? {
                          ...workout,
                          scheduledDays: workout.scheduledDays.includes(dayKey)
                              ? workout.scheduledDays.filter((d) => d !== dayKey)
                              : [...workout.scheduledDays, dayKey],
                      }
                    : workout,
            ),
        );
    };

    const handleAddWorkout = (workout: Workout) => {
        const isAlreadyScheduled = scheduledWorkouts.some((w) => w.id === workout.id);
        if (isAlreadyScheduled) {
            Alert.alert("Already Added", "This workout is already scheduled in this plan");
            return;
        }

        setScheduledWorkouts((prev) => [
            ...prev,
            {
                ...workout,
                scheduledDays: [],
                planItemId: undefined,
            },
        ]);
    };

    const handleRemoveWorkout = (workoutId: string) => {
        setScheduledWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    };

    const handleSaveSchedule = async () => {
        try {
            // Remove existing plan items
            for (const workout of scheduledWorkouts) {
                if (workout.planItemId) {
                    await apiService.removeWorkoutFromPlan(workout.planItemId);
                }
            }

            // Add new plan items
            for (const workout of scheduledWorkouts) {
                if (workout.scheduledDays.length > 0) {
                    await apiService.addWorkoutToPlan(plan.id, {
                        workoutId: workout.id,
                        frequency: workout.scheduledDays.join(","),
                        intensity: workout.intensity,
                    });
                }
            }

            Alert.alert("Success", "Workout schedule saved successfully!");
            onPlanUpdated();
        } catch (error) {
            console.error("Error saving schedule:", error);
            Alert.alert("Error", "Failed to save workout schedule");
        }
    };

    const renderWorkoutItem = ({ item, drag, isActive }: RenderItemParams<WorkoutWithDays>) => (
        <View
            style={[
                styles.workoutCard,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: isActive ? 0.8 : 1,
                },
            ]}
        >
            <View style={styles.workoutHeader}>
                <TouchableOpacity
                    style={[styles.dragHandle, { backgroundColor: theme.colors.subtext }]}
                    onLongPress={drag}
                >
                    <Text style={styles.dragHandleText}>⋮⋮</Text>
                </TouchableOpacity>

                <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutTitle, { color: theme.colors.text }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.workoutDetails, { color: theme.colors.subtext }]}>
                        {item.sets} sets × {item.reps} reps • {item.category}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.danger }]}
                    onPress={() => handleRemoveWorkout(item.id)}
                >
                    <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.daysContainer}>
                <Text style={[styles.daysLabel, { color: theme.colors.text }]}>Schedule for:</Text>
                <View style={styles.daysRow}>
                    {DAYS_OF_WEEK.map((day) => (
                        <TouchableOpacity
                            key={day.key}
                            style={[
                                styles.dayButton,
                                {
                                    backgroundColor: item.scheduledDays.includes(day.key)
                                        ? theme.colors.accent
                                        : theme.colors.bg,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            onPress={() => handleDayToggle(item.id, day.key)}
                        >
                            <Text
                                style={[
                                    styles.dayButtonText,
                                    {
                                        color: item.scheduledDays.includes(day.key)
                                            ? "#FFFFFF"
                                            : theme.colors.text,
                                    },
                                ]}
                            >
                                {day.short}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
                <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                    Loading workouts...
                </Text>
            </View>
        );
    }

    const renderHeader = () => (
        <View>
            {/* Available Workouts */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Available Workouts
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.subtext }]}>
                    Tap to add to your plan
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.workoutSelector}
                >
                    {availableWorkouts.map((workout) => (
                        <TouchableOpacity
                            key={workout.id}
                            style={[
                                styles.workoutOption,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            onPress={() => handleAddWorkout(workout)}
                        >
                            <Text style={[styles.workoutOptionTitle, { color: theme.colors.text }]}>
                                {workout.title}
                            </Text>
                            <Text
                                style={[
                                    styles.workoutOptionDetails,
                                    { color: theme.colors.subtext },
                                ]}
                            >
                                {workout.category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Scheduled Workouts Header */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Scheduled Workouts
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.subtext }]}>
                    Long press to reorder • Tap days to schedule
                </Text>
            </View>
        </View>
    );

    const renderFooter = () =>
        scheduledWorkouts.length > 0 ? (
            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleSaveSchedule}
            >
                <Text style={styles.saveButtonText}>Save Workout Schedule</Text>
            </TouchableOpacity>
        ) : null;

    const renderEmptyState = () => (
        <View
            style={[
                styles.emptyState,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
        >
            <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                No workouts scheduled yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtext }]}>
                Add workouts from above to get started
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <DraggableFlatList
                data={scheduledWorkouts}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderWorkoutItem}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyState}
                style={styles.draggableList}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
    },
    loadingText: {
        textAlign: "center",
        marginTop: 50,
        fontSize: 16,
        fontFamily: "Inter_400Regular",
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "Inter_600SemiBold",
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
        marginBottom: 16,
    },
    workoutSelector: {
        marginBottom: 8,
    },
    workoutOption: {
        padding: 12,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 120,
        alignItems: "center",
    },
    workoutOptionTitle: {
        fontSize: 14,
        fontFamily: "Inter_600SemiBold",
        marginBottom: 2,
    },
    workoutOptionDetails: {
        fontSize: 12,
        fontFamily: "Inter_400Regular",
    },
    draggableList: {
        maxHeight: 400,
    },
    workoutCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        padding: 16,
    },
    workoutHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    dragHandle: {
        width: 24,
        height: 24,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    dragHandleText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 16,
        fontFamily: "Inter_600SemiBold",
        marginBottom: 2,
    },
    workoutDetails: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    removeButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    daysContainer: {
        marginTop: 8,
    },
    daysLabel: {
        fontSize: 14,
        fontFamily: "Inter_500Medium",
        marginBottom: 8,
    },
    daysRow: {
        flexDirection: "row",
        gap: 8,
    },
    dayButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        minWidth: 32,
        alignItems: "center",
    },
    dayButtonText: {
        fontSize: 12,
        fontFamily: "Inter_600SemiBold",
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: "Inter_500Medium",
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
    },
    saveButton: {
        margin: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: "Inter_600SemiBold",
    },
});
