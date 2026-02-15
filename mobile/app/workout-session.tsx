import React, { useEffect, useReducer, useRef, useCallback } from "react";
import {
    View,
    Pressable,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
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
import { StoryProgressBar } from "@/src/components/workout-session/StoryProgressBar";
import { WarmupSlide } from "@/src/components/workout-session/WarmupSlide";
import { ExerciseSlide } from "@/src/components/workout-session/ExerciseSlide";
import { RestTimer } from "@/src/components/workout-session/RestTimer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAP_ZONE = SCREEN_WIDTH * 0.3;

// ─── State ───────────────────────────────────────────────────────────

type Phase = "warmup" | "exercise" | "rest" | "completed";

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
    currentSet: number; // 1-based
    totalSets: number;
    restDuration: number; // seconds
    startTime: number;
    exerciseLogs: ExerciseLog[];
}

type Action =
    | { type: "SKIP_WARMUP" }
    | { type: "COMPLETE_SET"; workout: Workout }
    | { type: "SKIP_EXERCISE"; workout: Workout }
    | { type: "REST_COMPLETE" }
    | { type: "GO_BACK"; workouts: Workout[] }
    | { type: "COMPLETE_SESSION" };

function getTotalSets(workout: Workout): number {
    if (workout.workoutType === "cardio") return 1;
    if (workout.intensityModel === "percentage_1rm") return PERCENTAGE_1RM_SETS;
    return workout.sets ?? 1;
}

function getRestDuration(workout: Workout): number {
    if (workout.workoutType === "cardio") return 0;
    if (workout.intensityModel === "sets_time") return 30;
    return 60;
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
        currentSet: 1,
        totalSets: 0,
        restDuration: 60,
        startTime: Date.now(),
        exerciseLogs: [],
    };
}

function reducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        case "SKIP_WARMUP":
            return { ...state, phase: "exercise" };

        case "COMPLETE_SET": {
            const workout = action.workout;
            const totalSets = getTotalSets(workout);
            const isLastSet = state.currentSet >= totalSets;

            if (isLastSet) {
                // Log this exercise
                const log: ExerciseLog = {
                    workoutId: workout.id,
                    title: workout.title,
                    setsCompleted: totalSets,
                    reps: getReps(workout),
                    duration: workout.duration ?? undefined,
                };
                return {
                    ...state,
                    exerciseLogs: [...state.exerciseLogs, log],
                    // Move to next exercise (handled by the component via COMPLETE_SESSION or index bump)
                    currentExerciseIndex: state.currentExerciseIndex + 1,
                    currentSet: 1,
                    phase: "exercise", // will be checked in component
                };
            }

            // More sets remaining — start rest
            const rest = getRestDuration(workout);
            if (rest > 0) {
                return {
                    ...state,
                    phase: "rest",
                    restDuration: rest,
                };
            }
            // No rest (cardio), jump to next set
            return {
                ...state,
                currentSet: state.currentSet + 1,
            };
        }

        case "SKIP_EXERCISE": {
            const skipWorkout = action.workout;
            const setsCompleted = state.currentSet - 1;
            const newLogs =
                setsCompleted > 0
                    ? [
                          ...state.exerciseLogs,
                          {
                              workoutId: skipWorkout.id,
                              title: skipWorkout.title,
                              setsCompleted,
                              reps: getReps(skipWorkout),
                              duration: skipWorkout.duration ?? undefined,
                          },
                      ]
                    : state.exerciseLogs;
            return {
                ...state,
                exerciseLogs: newLogs,
                currentExerciseIndex: state.currentExerciseIndex + 1,
                currentSet: 1,
                phase: "exercise",
            };
        }

        case "REST_COMPLETE":
            return {
                ...state,
                phase: "exercise",
                currentSet: state.currentSet + 1,
            };

        case "GO_BACK": {
            if (state.phase === "warmup") return state;
            if (state.phase === "rest") {
                // Cancel rest, go back to exercise view
                return { ...state, phase: "exercise" };
            }
            if (state.currentExerciseIndex === 0 && state.currentSet === 1) {
                // Go back to warmup
                return { ...state, phase: "warmup" };
            }
            if (state.currentSet > 1) {
                // Go back one set
                return { ...state, currentSet: state.currentSet - 1 };
            }
            // Go back to previous exercise
            const prevIdx = state.currentExerciseIndex - 1;
            const prevWorkout = action.workouts[prevIdx];
            const prevTotalSets = prevWorkout ? getTotalSets(prevWorkout) : 1;
            return {
                ...state,
                currentExerciseIndex: prevIdx,
                currentSet: prevTotalSets,
                exerciseLogs: state.exerciseLogs.slice(0, -1), // remove last log
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
            } catch (error) {
                console.error("[workout-session] Failed to load workouts:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [workoutIds]);

    // Set totalSets when exercise changes
    useEffect(() => {
        if (
            state.phase === "exercise" &&
            workouts.length > 0 &&
            state.currentExerciseIndex < workouts.length
        ) {
            // totalSets is computed on the fly, no state update needed
        }
    }, [state.currentExerciseIndex, state.phase, workouts]);

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
            if (authUser?.id && state.exerciseLogs.length > 0) {
                const now = new Date().toISOString();
                const logs = state.exerciseLogs.map((l) => ({
                    workoutId: l.workoutId,
                    userId: authUser.id,
                    date: now,
                    sets: l.setsCompleted,
                    reps: l.reps,
                    duration: l.duration,
                }));
                await apiService.createWorkoutLogsBatch(logs);
            }
        } catch (error) {
            console.error("[workout-session] Failed to save logs:", error);
        }

        const totalTime = Date.now() - state.startTime;
        router.replace({
            pathname: "/workout-summary" as any,
            params: {
                totalTime: String(totalTime),
                exerciseCount: String(state.exerciseLogs.length),
                logs: encodeURIComponent(JSON.stringify(state.exerciseLogs)),
            },
        });
    };

    // Hardware back button confirmation
    useEffect(() => {
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            confirmExit();
            return true;
        });
        return () => handler.remove();
    }, []);

    const confirmExit = () => {
        Alert.alert(
            "End Workout?",
            "Your progress will be lost.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "End Workout",
                    style: "destructive",
                    onPress: () => router.back(),
                },
            ],
        );
    };

    // ─── Gestures ────────────────────────────────────────────────────

    const handleTapRight = useCallback(() => {
        if (state.phase === "warmup") {
            dispatch({ type: "SKIP_WARMUP" });
        } else if (state.phase === "exercise" || state.phase === "rest") {
            const workout = workoutsRef.current[state.currentExerciseIndex];
            if (workout) {
                dispatch({ type: "COMPLETE_SET", workout });
            }
        }
    }, [state.phase, state.currentExerciseIndex]);

    const handleTapLeft = useCallback(() => {
        if (state.phase === "rest") {
            dispatch({ type: "GO_BACK", workouts: workoutsRef.current });
        } else if (state.phase === "exercise") {
            dispatch({ type: "GO_BACK", workouts: workoutsRef.current });
        } else if (state.phase === "warmup") {
            confirmExit();
        }
    }, [state.phase]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .runOnJS(true)
        .onEnd((e) => {
            if (e.translationX < -50) {
                // Swipe left = advance
                handleTapRight();
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
    } else if (
        state.currentExerciseIndex < workouts.length
    ) {
        const w = workouts[state.currentExerciseIndex];
        const total = getTotalSets(w);
        segmentProgress = (state.currentSet - 1) / total;
        if (state.phase === "rest") {
            // During rest, the current set was just completed
            segmentProgress = state.currentSet / total;
        }
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

                    {(state.phase === "exercise" || state.phase === "rest") &&
                        currentWorkout && (
                            <GestureDetector gesture={panGesture}>
                                <View style={{ flex: 1 }}>
                                    <ExerciseSlide
                                        workout={currentWorkout}
                                        currentSet={state.currentSet}
                                        totalSets={getTotalSets(currentWorkout)}
                                        onCompleteSet={() =>
                                            dispatch({
                                                type: "COMPLETE_SET",
                                                workout: currentWorkout,
                                            })
                                        }
                                    />
                                    {state.phase === "rest" && (
                                        <RestTimer
                                            duration={state.restDuration}
                                            onRestComplete={() =>
                                                dispatch({
                                                    type: "REST_COMPLETE",
                                                })
                                            }
                                            onSkip={() =>
                                                dispatch({
                                                    type: "REST_COMPLETE",
                                                })
                                            }
                                            nextSetNumber={state.currentSet + 1}
                                            totalSets={getTotalSets(
                                                currentWorkout,
                                            )}
                                        />
                                    )}

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
        bottom: 100, // avoid overlapping the Complete Set button
        width: "25%",
    },
    tapZoneRight: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 100,
        width: "25%",
    },
});
