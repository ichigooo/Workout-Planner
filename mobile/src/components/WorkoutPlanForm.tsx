import React, { useCallback, useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
} from "react-native";
import { RenderItemParams } from "react-native-draggable-flatlist";
import { WorkoutPlan, CreateWorkoutPlanRequest, Workout } from "../types";
import { CalendarWidget } from "./CalendarWidget";
import { apiService } from "../services/api";
import { getCurrentPlanId } from "../state/session";
import { getTheme } from "../theme";

interface WorkoutPlanFormProps {
    plan?: WorkoutPlan;
    onSubmit: (plan: CreateWorkoutPlanRequest) => void;
    onCancel: () => void;
    onPlanUpdated?: () => void;
    hideDates?: boolean; // when true, hide start/end date inputs for perpetual routine
}

interface WorkoutWithDays extends Workout {
    scheduledDays: string[];
    planItemId?: string;
    createdAt: string;
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

export const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({
    plan,
    onSubmit,
    onCancel,
    onPlanUpdated,
    hideDates = false,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    // Single routine mode: hide name; always use implicit 'Routine'
    const [name] = useState("Routine");
    // compute sensible defaults: start = plan.startDate || today, end = plan.endDate || start + 90 days
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const defaultStart = plan?.startDate ? new Date(plan.startDate) : today;
    const defaultEnd = plan?.endDate
        ? new Date(plan.endDate)
        : new Date(defaultStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    const [startDate, setStartDate] = useState<string>(plan?.startDate || formatDate(defaultStart));
    const [endDate, setEndDate] = useState<string>(plan?.endDate || formatDate(defaultEnd));

    // Workout scheduling state
    const [_availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
    const [scheduledWorkouts, setScheduledWorkouts] = useState<WorkoutWithDays[]>([]);
    const [_loadingWorkouts, setLoadingWorkouts] = useState(false);

    useEffect(() => {
        if (plan) {
            loadWorkouts();
        }
    }, [plan, loadWorkouts]);

    const loadWorkouts = useCallback(async () => {
        try {
            setLoadingWorkouts(true);
            console.log("[WorkoutPlanForm] SETTING WORKOUT DATA..");
            const cachedPlanId = getCurrentPlanId();
            const planData = await apiService.getWorkoutPlan(cachedPlanId!);
            const workouts = await apiService.getWorkouts();

            console.log("[WorkoutPlanForm] GET WORKOUT DATA!");
            setAvailableWorkouts(workouts);

            // Convert plan items to scheduled workouts with days
            const currentPlan = planData;
            const scheduled: WorkoutWithDays[] = [];

            // Group dated plan items by workout id and build scheduledDays from scheduledDate
            const byWorkout = new Map();
            const weekdayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            currentPlan?.planItems?.forEach((pi) => {
                if (!pi || !pi.workout) return;
                const workout = pi.workout;
                const wid = workout.id;
                const dateStr = (pi as any).scheduledDate ?? (pi as any).scheduled_date;
                if (!dateStr) return;
                const dayKey = weekdayKeys[new Date(dateStr).getDay()];

                const entry = byWorkout.get(wid) || {
                    workout,
                    days: new Set(),
                    latestCreatedAt: "",
                    latestPlanItemId: undefined,
                };
                entry.days.add(dayKey);
                const createdAt = (pi as any).createdAt ?? (pi as any).created_at ?? "";
                if (
                    createdAt &&
                    (!entry.latestCreatedAt ||
                        new Date(createdAt) > new Date(entry.latestCreatedAt))
                ) {
                    entry.latestCreatedAt = createdAt;
                    entry.latestPlanItemId = pi.id;
                }
                byWorkout.set(wid, entry);
            });

            for (const v of byWorkout.values()) {
                const { workout: w, days, latestCreatedAt, latestPlanItemId } = v as any;
                scheduled.push({
                    ...w,
                    scheduledDays: Array.from(days),
                    planItemId: latestPlanItemId,
                    createdAt: latestCreatedAt || "",
                });
            }

            // Newest added first
            scheduled.sort((a, b) => {
                const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
                const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
                return tb - ta;
            });
            setScheduledWorkouts(scheduled);
        } catch (error) {
            console.error("Error loading workouts:", error);
        } finally {
            setLoadingWorkouts(false);
        }
    }, [plan?.id]);

    const _handleDragEnd = ({ data }: { data: WorkoutWithDays[] }) => {
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

    const _handleAddWorkout = (workout: Workout) => {
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

    const handleSubmit = async () => {
        if (!name || (!hideDates && (!startDate || !endDate))) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (!hideDates && new Date(startDate) >= new Date(endDate)) {
            Alert.alert("Error", "End date must be after start date");
            return;
        }

        const planData: CreateWorkoutPlanRequest = {
            name,
            startDate: hideDates ? new Date().toISOString().split("T")[0] : startDate,
            endDate: hideDates ? new Date().toISOString().split("T")[0] : endDate,
            userId: plan?.userId || "temp-user-id", // TODO: Get from auth context
        };

        // If editing an existing plan, save the workout schedule
        if (plan) {
            try {
                // Fetch current plan items from server to ensure we remove any deleted items
                const cachedPlanId = getCurrentPlanId();
                const currentPlan = await apiService.getWorkoutPlan(cachedPlanId!);

                // Remove all existing plan items for this plan (server-side source of truth)
                if (currentPlan?.planItems?.length) {
                    for (const existingItem of currentPlan.planItems) {
                        if (existingItem.id) {
                            await apiService.removeWorkoutFromPlan(existingItem.id);
                        }
                    }
                }

                // Add new plan items from scheduledWorkouts
                for (const workout of scheduledWorkouts) {
                    if (workout.scheduledDays.length > 0) {
                        await apiService.addWorkoutToPlan(plan.id, {
                            workoutId: workout.id,
                            frequency: workout.scheduledDays.join(","),
                            intensity: workout.intensity,
                        });
                    }
                }

                if (onPlanUpdated) {
                    onPlanUpdated();
                }
            } catch (error) {
                console.error("Error saving workout schedule:", error);
                Alert.alert("Error", "Failed to save workout schedule");
                return;
            }
        }

        onSubmit(planData);
    };

    const renderWorkoutItem = ({
        item,
        drag: _drag,
        isActive,
    }: RenderItemParams<WorkoutWithDays>) => (
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

    const renderHeader = () => (
        <View>
            {!plan && (
                <Text style={[styles.title, { color: theme.colors.text }]}>Create Routine</Text>
            )}

            {!hideDates && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Start Date *</Text>
                    <CalendarWidget
                        selectedDate={startDate}
                        onDateSelect={setStartDate}
                        placeholder="Select start date"
                        minimumDate={new Date().toISOString().split("T")[0]}
                    />
                </View>
            )}

            {!hideDates && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>End Date *</Text>
                    <CalendarWidget
                        selectedDate={endDate}
                        onDateSelect={setEndDate}
                        placeholder="Select end date"
                        minimumDate={startDate}
                    />
                </View>
            )}

            {/* Available Workouts section removed per design */}

            {plan && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Scheduled Workouts
                    </Text>
                </View>
            )}
        </View>
    );

    const renderFooter = () => (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.subtext }]}
                onPress={onCancel}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleSubmit}
            >
                <Text style={styles.submitButtonText}>{plan ? "Update Plan" : "Create Plan"}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () =>
        plan ? (
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
        ) : null;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            {plan ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {renderHeader()}

                    {scheduledWorkouts.length > 0 ? (
                        <View style={styles.workoutsContainer}>
                            {scheduledWorkouts.map((workout, index) => (
                                <View
                                    key={`${workout.planItemId ?? workout.id}-${index}`}
                                    style={styles.workoutItemWrapper}
                                >
                                    {/* Drag handle removed per design */}
                                    {renderWorkoutItem({
                                        item: workout,
                                        drag: () => {},
                                        isActive: false,
                                        getIndex: () => index,
                                    })}
                                </View>
                            ))}
                        </View>
                    ) : (
                        renderEmptyState()
                    )}

                    {renderFooter()}
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.title, { color: theme.colors.text }]}>Create Routine</Text>

                    {!hideDates && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                                Start Date *
                            </Text>
                            <CalendarWidget
                                selectedDate={startDate}
                                onDateSelect={setStartDate}
                                placeholder="Select start date"
                                minimumDate={new Date().toISOString().split("T")[0]}
                            />
                        </View>
                    )}

                    {!hideDates && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                                End Date *
                            </Text>
                            <CalendarWidget
                                selectedDate={endDate}
                                onDateSelect={setEndDate}
                                placeholder="Select end date"
                                minimumDate={startDate}
                            />
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: theme.colors.subtext }]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.colors.accent }]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>Create Plan</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontFamily: "DMSans_700Bold",
        marginBottom: 24,
        textAlign: "center",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontFamily: "DMSans_600SemiBold",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        fontFamily: "DMSans_400Regular",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    halfWidth: {
        width: "48%",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    submitButton: {
        backgroundColor: "#366299",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 9999,
        flex: 1,
        marginLeft: 12,
    },
    cancelButton: {
        backgroundColor: "#8A7F72",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 9999,
        flex: 1,
        marginRight: 12,
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    cancelButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    // Drag and drop styles
    draggableList: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "DMSans_600SemiBold",
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: "DMSans_400Regular",
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
        fontFamily: "DMSans_600SemiBold",
        marginBottom: 2,
    },
    workoutOptionDetails: {
        fontSize: 12,
        fontFamily: "DMSans_400Regular",
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
        fontFamily: "DMSans_600SemiBold",
        marginBottom: 2,
    },
    workoutDetails: {
        fontSize: 14,
        fontFamily: "DMSans_400Regular",
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
        fontFamily: "DMSans_500Medium",
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
        fontFamily: "DMSans_600SemiBold",
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: "DMSans_500Medium",
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontFamily: "DMSans_400Regular",
    },
    workoutsContainer: {
        padding: 16,
    },
    workoutItemWrapper: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
});
