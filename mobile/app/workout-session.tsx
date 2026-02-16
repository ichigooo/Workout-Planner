import React, { useEffect, useReducer, useRef, useCallback, useState } from "react";
import {
    View,
    Text,
    Modal,
    Pressable,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    BackHandler,
    StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
    GestureDetector,
    Gesture,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useAuth } from "@/src/state/AuthContext";
import { apiService } from "@/src/services/api";
import { planItemsCache } from "@/src/services/planItemsCache";
import {
    Workout,
    PERCENTAGE_PRESETS,
    PERCENTAGE_1RM_SETS,
} from "@/src/types";
import { spacing, radii, typography, palettes } from "@/src/theme";
import { StoryProgressBar } from "@/src/components/workout-session/StoryProgressBar";
import { WarmupSlide } from "@/src/components/workout-session/WarmupSlide";
import { ExerciseSlide } from "@/src/components/workout-session/ExerciseSlide";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAP_ZONE = SCREEN_WIDTH * 0.3;
const IMAGE_AREA_HEIGHT = Math.round(SCREEN_WIDTH * 0.75);

// ─── State ───────────────────────────────────────────────────────────

type Phase = "warmup" | "exercise" | "completed";

interface ExerciseLog {
    workoutId: string;
    title: string;
    setsCompleted: number;
    reps?: number;
    duration?: number;
}

interface SessionState {
    phase: Phase;
    currentExerciseIndex: number;
    exerciseSetProgress: number[]; // exerciseSetProgress[i] = completed sets for exercise i
    startTime: number;
    exerciseLogs: ExerciseLog[];
}

type Action =
    | { type: "SKIP_WARMUP" }
    | { type: "INIT_PROGRESS"; workoutCount: number }
    | { type: "COMPLETE_SET"; exerciseIndex: number; totalSets: number; workout: Workout }
    | { type: "NAVIGATE_NEXT"; totalExercises: number }
    | { type: "NAVIGATE_BACK" }
    | { type: "COMPLETE_SESSION" };

function getTotalSets(workout: Workout): number {
    if (workout.workoutType === "cardio") return 1;
    if (workout.intensityModel === "percentage_1rm") return PERCENTAGE_1RM_SETS;
    return workout.sets ?? 1;
}

function getReps(workout: Workout): number | undefined {
    if (workout.workoutType === "cardio") return undefined;
    if (workout.intensityModel === "percentage_1rm") {
        const preset =
            workout.defaultPreset && PERCENTAGE_PRESETS[workout.defaultPreset]
                ? PERCENTAGE_PRESETS[workout.defaultPreset]
                : PERCENTAGE_PRESETS.hypertrophy;
        return preset.reps;
    }
    return workout.reps ?? undefined;
}

function initState(): SessionState {
    return {
        phase: "warmup",
        currentExerciseIndex: 0,
        exerciseSetProgress: [],
        startTime: Date.now(),
        exerciseLogs: [],
    };
}

function reducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        case "SKIP_WARMUP":
            return { ...state, phase: "exercise" };

        case "INIT_PROGRESS":
            return {
                ...state,
                exerciseSetProgress: new Array(action.workoutCount).fill(0),
            };

        case "COMPLETE_SET": {
            const { exerciseIndex, totalSets, workout } = action;
            const currentCompleted = state.exerciseSetProgress[exerciseIndex] ?? 0;

            // Already fully completed — do nothing
            if (currentCompleted >= totalSets) return state;

            const newCompleted = currentCompleted + 1;
            const newProgress = [...state.exerciseSetProgress];
            newProgress[exerciseIndex] = newCompleted;

            // Last set done → log exercise and auto-advance
            if (newCompleted >= totalSets) {
                const log: ExerciseLog = {
                    workoutId: workout.id,
                    title: workout.title,
                    setsCompleted: totalSets,
                    reps: getReps(workout),
                    duration: workout.duration ?? undefined,
                };
                // Update existing log if navigated back and re-completed
                const existingIdx = state.exerciseLogs.findIndex(
                    (l) => l.workoutId === workout.id,
                );
                const newLogs =
                    existingIdx >= 0
                        ? state.exerciseLogs.map((l, i) => (i === existingIdx ? log : l))
                        : [...state.exerciseLogs, log];

                return {
                    ...state,
                    exerciseSetProgress: newProgress,
                    exerciseLogs: newLogs,
                    currentExerciseIndex: state.currentExerciseIndex + 1,
                };
            }

            // More sets to go
            return {
                ...state,
                exerciseSetProgress: newProgress,
            };
        }

        case "NAVIGATE_NEXT": {
            const nextIndex = state.currentExerciseIndex + 1;
            return { ...state, currentExerciseIndex: nextIndex };
        }

        case "NAVIGATE_BACK": {
            if (state.currentExerciseIndex === 0) {
                return { ...state, phase: "warmup" };
            }
            return {
                ...state,
                currentExerciseIndex: state.currentExerciseIndex - 1,
            };
        }

        case "COMPLETE_SESSION":
            return { ...state, phase: "completed" };

        default:
            return state;
    }
}

// ─── Component ───────────────────────────────────────────────────────

export default function WorkoutSessionScreen() {
    const { workoutIds } = useLocalSearchParams<{ workoutIds: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user: authUser } = useAuth();
    const [state, dispatch] = useReducer(reducer, undefined, initState);
    const workoutsRef = useRef<Workout[]>([]);
    const [workouts, setWorkouts] = React.useState<Workout[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Load workouts
    useEffect(() => {
        const load = async () => {
            try {
                const ids = (workoutIds || "").split(",").filter(Boolean);
                // Try cache first, fall back to API
                const cached = await planItemsCache.getWorkouts();
                const found: Workout[] = [];
                for (const id of ids) {
                    const w = cached.find((c) => c.id === id);
                    if (w) {
                        found.push(w);
                    } else {
                        try {
                            const fetched = await apiService.getWorkout(id);
                            found.push(fetched);
                        } catch {
                            console.warn(`[workout-session] Could not load workout ${id}`);
                        }
                    }
                }
                workoutsRef.current = found;
                setWorkouts(found);
                dispatch({ type: "INIT_PROGRESS", workoutCount: found.length });
            } catch (error) {
                console.error("[workout-session] Failed to load workouts:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [workoutIds]);

    // Handle completion
    useEffect(() => {
        if (
            state.phase === "exercise" &&
            workouts.length > 0 &&
            state.currentExerciseIndex >= workouts.length
        ) {
            saveAndNavigate();
        }
    }, [state.currentExerciseIndex, state.phase, workouts]);

    const saveAndNavigate = async () => {
        try {
            // Collect all exercise logs, including partially-completed ones
            const allLogs: ExerciseLog[] = [...state.exerciseLogs];
            const loggedWorkoutIds = new Set(state.exerciseLogs.map((l) => l.workoutId));

            workoutsRef.current.forEach((workout, index) => {
                const completed = state.exerciseSetProgress[index] ?? 0;
                if (completed > 0 && !loggedWorkoutIds.has(workout.id)) {
                    allLogs.push({
                        workoutId: workout.id,
                        title: workout.title,
                        setsCompleted: completed,
                        reps: getReps(workout),
                        duration: workout.duration ?? undefined,
                    });
                }
            });

            if (authUser?.id && allLogs.length > 0) {
                const now = new Date().toISOString();
                const logs = allLogs.map((l) => ({
                    workoutId: l.workoutId,
                    userId: authUser.id,
                    date: now,
                    sets: l.setsCompleted,
                    reps: l.reps,
                    duration: l.duration,
                }));
                await apiService.createWorkoutLogsBatch(logs);
            }

            const totalTime = Date.now() - state.startTime;
            router.replace({
                pathname: "/workout-summary" as any,
                params: {
                    totalTime: String(totalTime),
                    exerciseCount: String(allLogs.length),
                    logs: encodeURIComponent(JSON.stringify(allLogs)),
                },
            });
        } catch (error) {
            console.error("[workout-session] Failed to save logs:", error);
        }
    };

    // Hardware back button confirmation
    useEffect(() => {
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            confirmExit();
            return true;
        });
        return () => handler.remove();
    }, []);

    const confirmExit = useCallback(() => {
        setShowExitConfirm(true);
    }, []);

    const handleDismissExit = useCallback(() => {
        setShowExitConfirm(false);
    }, []);

    const handleConfirmExit = useCallback(() => {
        setShowExitConfirm(false);
        router.back();
    }, [router]);

    // ─── Gestures ────────────────────────────────────────────────────

    const handleTapRight = useCallback(() => {
        if (state.phase === "warmup") {
            dispatch({ type: "SKIP_WARMUP" });
        } else if (state.phase === "exercise") {
            const workout = workoutsRef.current[state.currentExerciseIndex];
            if (!workout) return;
            const total = getTotalSets(workout);
            const completed = state.exerciseSetProgress[state.currentExerciseIndex] ?? 0;
            if (completed < total) {
                // Sets remain → complete next set
                dispatch({
                    type: "COMPLETE_SET",
                    exerciseIndex: state.currentExerciseIndex,
                    totalSets: total,
                    workout,
                });
            } else {
                // All sets done → next exercise
                dispatch({
                    type: "NAVIGATE_NEXT",
                    totalExercises: workoutsRef.current.length,
                });
            }
        }
    }, [state.phase, state.currentExerciseIndex, state.exerciseSetProgress]);

    const handleTapLeft = useCallback(() => {
        if (state.phase === "exercise") {
            dispatch({ type: "NAVIGATE_BACK" });
        } else if (state.phase === "warmup") {
            confirmExit();
        }
    }, [state.phase]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .runOnJS(true)
        .onEnd((e) => {
            if (e.translationX < -50) {
                // Swipe left = always skip to next exercise
                if (state.phase === "warmup") {
                    dispatch({ type: "SKIP_WARMUP" });
                } else if (state.phase === "exercise") {
                    dispatch({
                        type: "NAVIGATE_NEXT",
                        totalExercises: workoutsRef.current.length,
                    });
                }
            } else if (e.translationX > 50) {
                // Swipe right = go back
                handleTapLeft();
            }
        });

    // ─── Progress calculation ────────────────────────────────────────

    const totalSegments = 1 + workouts.length; // warmup + exercises
    const currentSegment =
        state.phase === "warmup" ? 0 : state.currentExerciseIndex + 1;

    let segmentProgress = 0;
    if (state.phase === "warmup") {
        segmentProgress = 0;
    } else if (state.currentExerciseIndex < workouts.length) {
        const w = workouts[state.currentExerciseIndex];
        const total = getTotalSets(w);
        const completed = state.exerciseSetProgress[state.currentExerciseIndex] ?? 0;
        segmentProgress = completed / total;
    }

    // ─── Render ──────────────────────────────────────────────────────

    if (loading || workouts.length === 0) {
        return <View style={styles.container} />;
    }

    const currentWorkout =
        state.currentExerciseIndex < workouts.length
            ? workouts[state.currentExerciseIndex]
            : null;

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                {/* Progress bar */}
                <View
                    style={[
                        styles.progressBarContainer,
                        { paddingTop: insets.top + 8 },
                    ]}
                >
                    <StoryProgressBar
                        totalSegments={totalSegments}
                        currentSegment={currentSegment}
                        segmentProgress={segmentProgress}
                    />
                </View>

                {/* Close button */}
                <View
                    style={[
                        styles.closeButtonContainer,
                        { top: insets.top + 28 },
                    ]}
                >
                    <TouchableOpacity
                        onPress={confirmExit}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={[styles.slideContainer, { paddingBottom: insets.bottom }]}>
                    {state.phase === "warmup" && (
                        <WarmupSlide
                            onComplete={() =>
                                dispatch({ type: "SKIP_WARMUP" })
                            }
                        />
                    )}

                    {state.phase === "exercise" &&
                        currentWorkout && (
                            <GestureDetector gesture={panGesture}>
                                <View style={{ flex: 1 }}>
                                    <ExerciseSlide
                                        workout={currentWorkout}
                                        completedSets={state.exerciseSetProgress[state.currentExerciseIndex] ?? 0}
                                        totalSets={getTotalSets(currentWorkout)}
                                        onCompleteSet={() =>
                                            dispatch({
                                                type: "COMPLETE_SET",
                                                exerciseIndex: state.currentExerciseIndex,
                                                totalSets: getTotalSets(currentWorkout),
                                                workout: currentWorkout,
                                            })
                                        }
                                    />
                                    {/* Tap zones — left/right edges for IG-style navigation */}
                                    <Pressable
                                        style={styles.tapZoneLeft}
                                        onPress={handleTapLeft}
                                    />
                                    <Pressable
                                        style={styles.tapZoneRight}
                                        onPress={handleTapRight}
                                    />
                                </View>
                            </GestureDetector>
                        )}
                </View>

                {/* Exit Confirmation Modal */}
                <Modal
                    visible={showExitConfirm}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={handleDismissExit}
                >
                    <Pressable style={exitStyles.overlay} onPress={handleDismissExit}>
                        <Pressable
                            style={exitStyles.card}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={exitStyles.iconContainer}>
                                <Ionicons
                                    name="warning-outline"
                                    size={32}
                                    color={palettes.light.danger}
                                />
                            </View>

                            <Text style={exitStyles.title}>End Workout?</Text>

                            <Text style={exitStyles.body}>
                                Your progress will be lost.
                            </Text>

                            <View style={exitStyles.buttonRow}>
                                <TouchableOpacity
                                    style={exitStyles.cancelButton}
                                    onPress={handleDismissExit}
                                    activeOpacity={0.7}
                                >
                                    <Text style={exitStyles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={exitStyles.endButton}
                                    onPress={handleConfirmExit}
                                    activeOpacity={0.7}
                                >
                                    <Text style={exitStyles.endButtonText}>End Workout</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A1A1A",
    },
    progressBarContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    closeButtonContainer: {
        position: "absolute",
        right: 16,
        zIndex: 11,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    slideContainer: {
        flex: 1,
    },
    tapZoneLeft: {
        position: "absolute",
        left: 0,
        top: 0,
        height: IMAGE_AREA_HEIGHT,
        width: "25%",
    },
    tapZoneRight: {
        position: "absolute",
        right: 0,
        top: 0,
        height: IMAGE_AREA_HEIGHT,
        width: "25%",
    },
});

const exitStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    card: {
        backgroundColor: palettes.light.bg,
        borderRadius: radii.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.md,
        width: "100%",
        maxWidth: 320,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(196, 119, 106, 0.12)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
        color: palettes.light.text,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    body: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        color: palettes.light.textTertiary,
        textAlign: "center",
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: "row",
        gap: spacing.sm,
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        borderRadius: radii.sm,
        borderWidth: 1.5,
        borderColor: palettes.light.border,
        backgroundColor: palettes.light.surface,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    cancelButtonText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
        color: palettes.light.text,
    },
    endButton: {
        flex: 1,
        borderRadius: radii.sm,
        backgroundColor: palettes.light.danger,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    endButtonText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
    },
});
