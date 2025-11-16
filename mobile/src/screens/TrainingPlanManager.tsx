import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Alert,
    useColorScheme,
    TouchableOpacity,
    Modal,
    ScrollView,
    FlatList,
} from "react-native";
import { useScrollToTopOnTabPress } from "../hooks/useScrollToTopOnTabPress";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { getTheme } from "../theme";
import { apiService } from "../services/api";
import { planItemsCache } from "../services/planItemsCache";
import { getCurrentPlanId } from "../state/session";
import { WorkoutPlan, CreateWorkoutPlanRequest, Workout, PlanItem } from "../types";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export const TrainingPlanManager: React.FC = () => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const router = useRouter();
    const [plan, setPlan] = useState<WorkoutPlan | undefined>();
    const [loading, setLoading] = useState(true);
    const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    const [selectedDates, setSelectedDates] = useState<{ [key: string]: any }>({});
    const [scheduledByDate, setScheduledByDate] = useState<
        {
            date: string;
            label: string;
            items: { id: string; workout: Workout; intensity?: string }[];
        }[]
    >([]);
    const scrollRef = useScrollToTopOnTabPress();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        loadPlan();
        loadWorkouts();
    }, []);

    // Refresh data whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            loadPlan();
            loadWorkouts();
            setRefreshKey((k) => k + 1);
        }, []),
    );

    // Preload cached plan items when the manager mounts
    useEffect(() => {
        const preload = async () => {
            if (plan && plan.id) {
                try {
                    await planItemsCache.getCachedItems();
                } catch (e) {
                    console.warn("preload plan items failed", e);
                }
            }
        };
        preload();
    }, [plan?.id, refreshKey]);

    // Build scheduled items for the next 5 days, sectioned by date
    useEffect(() => {
        if (!plan || !plan.id) {
            setScheduledByDate([]);
            return;
        }

        const buildSchedule = async () => {
            try {
                // Get items for next 5 days from centralized cache
                const nextDaysItems = await planItemsCache.getItemsForNextDays(5);
                const today = new Date();
                const nextDates: string[] = [];
                for (let i = 0; i < 5; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() + i);
                    const y = d.getFullYear();
                    const m = (d.getMonth() + 1).toString().padStart(2, "0");
                    const day = d.getDate().toString().padStart(2, "0");
                    nextDates.push(`${y}-${m}-${day}`);
                }

                const result: {
                    date: string;
                    label: string;
                    items: { id: string; workout: Workout; intensity?: string }[];
                }[] = [];

                nextDates.forEach((dateStr) => {
                    // construct a local Date using numeric components to avoid timezone shifts
                    const [yy, mm, dd] = dateStr.split("-").map((s) => parseInt(s, 10));
                    const dateObj = new Date(yy, mm - 1, dd);
                    const label = dateObj.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    });

                    const itemsForDate: { id: string; workout: Workout; intensity?: string }[] = [];
                    // Filter items for this specific date
                    nextDaysItems.forEach((ci) => {
                        const sd = (ci as any).scheduledDate ?? (ci as any).scheduled_date;
                        if (!sd) return;
                        let sdStr = "";
                        if (typeof sd === "string") {
                            sdStr = sd.split("T")[0].split(" ")[0];
                        } else {
                            const dt = new Date(sd as any);
                            sdStr = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
                        }
                        if (sdStr === dateStr && ci.workout) {
                            itemsForDate.push({
                                id: ci.id,
                                workout: ci.workout,
                                intensity: ci.intensity || ci.workout.intensity,
                            });
                        }
                    });

                    result.push({ date: dateStr, label, items: itemsForDate });
                });

                setScheduledByDate(result);
            } catch (error) {
                console.error("Failed to build schedule:", error);
                setScheduledByDate([]);
            }
        };

        buildSchedule();
    }, [plan?.id, refreshKey]);

    const loadPlan = async () => {
        try {
            setLoading(true);
            // Get plan data from cache - no API call needed!
            const cachedPlanId = getCurrentPlanId();
            const planData = await apiService.getWorkoutPlan(cachedPlanId!);
            setPlan(planData);
            console.log("[TrainingPlanManager] Loaded plan from API");
        } catch (e) {
            Alert.alert("Error", "Failed to load routine");
        } finally {
            setLoading(false);
        }
    };

    const _handleSubmit = async (_payload: CreateWorkoutPlanRequest) => {
        // For now, delegate to the embedded form flow which already saves plan items via callbacks
        Alert.alert("Saved", "Routine saved successfully");
    };

    const loadWorkouts = async () => {
        try {
            const ws = await apiService.getWorkouts();
            setAllWorkouts(ws || []);
        } catch (e) {
            // ignore
        }
    };

    const categories = useMemo(
        () => Array.from(new Set(allWorkouts.map((w) => w.category))).sort(),
        [allWorkouts],
    );
    const workoutsByCategory = useMemo(
        () => (selectedCategory ? allWorkouts.filter((w) => w.category === selectedCategory) : []),
        [allWorkouts, selectedCategory],
    );

    // Ensure a default category is selected (first one) so the list isn't empty
    useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory]);

    // Keep the active category chip in view
    const categoriesListRef = useRef<FlatList<string>>(null);
    useEffect(() => {
        if (!selectedCategory) return;
        const index = categories.findIndex((c) => c === selectedCategory);
        if (index >= 0 && categoriesListRef.current) {
            categoriesListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }
    }, [selectedCategory, categories]);

    const handleQuickAdd = async () => {
        if (!plan || !selectedWorkoutId) return;

        const selectedDateStrings = Object.keys(selectedDates);
        if (selectedDateStrings.length === 0) {
            Alert.alert("No dates selected", "Please select at least one date for the workout");
            return;
        }

        try {
            // Use the new API to add workout to specific dates
            await apiService.addWorkoutToPlanOnDates(plan.id, {
                workoutId: selectedWorkoutId,
                dates: selectedDateStrings,
                intensity: undefined,
            });

            setShowAddSheet(false);
            setSelectedWorkoutId(null);
            setSelectedCategory(null);
            setSelectedDates({});

            // Refresh the plan to show the new workouts
            await loadPlan();

            Alert.alert("Added", `Workout added to ${selectedDateStrings.length} date(s)`);
        } catch (e) {
            Alert.alert("Error", "Failed to add workout");
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                edges={["top"]}
                style={[styles.container, { backgroundColor: theme.colors.bg }]}
            >
                <Text style={{ color: theme.colors.text, textAlign: "center", marginTop: 24 }}>
                    Loading routine...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
        >
            <View style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Current Training Plan
                </Text>
                <TouchableOpacity
                    onPress={() => setShowAddSheet(true)}
                    style={[styles.browseButton, { borderColor: theme.colors.border }]}
                >
                    <Text style={[styles.browseText, { color: theme.colors.accent }]}>
                        Browse all workouts
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Scheduled Workouts (next 5 days) wrapped in ScrollView so tab press can scroll to top */}
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text }}>
                        Scheduled Workouts
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/calendar")}
                        style={styles.calendarShortcut}
                    >
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
                    </TouchableOpacity>
                </View>
                {scheduledByDate.map((section) => (
                    <View key={section.date} style={{ marginBottom: 12 }}>
                        <Text style={{ color: theme.colors.subtext, marginBottom: 8 }}>
                            {section.label}
                        </Text>
                        {section.items.length > 0 ? (
                            section.items.map((it) => (
                                <View
                                    key={it.id}
                                    style={[
                                        styles.scheduledCard,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                                        {it.workout.title}
                                    </Text>
                                    <Text style={{ color: theme.colors.subtext, marginTop: 4 }}>
                                        {it.workout.sets} sets × {it.workout.reps} reps •{" "}
                                        {it.workout.category}
                                    </Text>
                                    {it.intensity ? (
                                        <Text style={{ color: theme.colors.accent, marginTop: 6 }}>
                                            {it.intensity}
                                        </Text>
                                    ) : null}
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: theme.colors.subtext }}>
                                No workouts scheduled
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.accent }]}
                onPress={() => setShowAddSheet(true)}
            >
                <Ionicons name="add" color="#fff" size={28} />
            </TouchableOpacity>

            <Modal
                visible={showAddSheet}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddSheet(false)}
            >
                <SafeAreaView
                    edges={["top"]}
                    style={[styles.sheetContainer, { backgroundColor: theme.colors.bg }]}
                >
                    <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                            Add Workout
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddSheet(false)}>
                            <Text style={{ color: theme.colors.accent, fontWeight: "600" }}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                            Category
                        </Text>
                        <FlatList
                            ref={categoriesListRef}
                            horizontal
                            data={categories}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => {
                                const active = selectedCategory === item;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            {
                                                borderColor: theme.colors.border,
                                                backgroundColor: active
                                                    ? theme.colors.accent
                                                    : theme.colors.surface,
                                            },
                                        ]}
                                        onPress={() => {
                                            setSelectedCategory(item);
                                            setSelectedWorkoutId(null);
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={{
                                                color: active ? "#fff" : theme.colors.text,
                                                fontWeight: "600",
                                            }}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsRow}
                            onScrollToIndexFailed={(info) => {
                                // As a fallback, approximate offset
                                const approx = Math.max(0, (info.index - 1) * 100);
                                categoriesListRef.current?.scrollToOffset({
                                    offset: approx,
                                    animated: true,
                                });
                            }}
                        />

                        <Text
                            style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}
                        >
                            Workout
                        </Text>
                        <View style={{ gap: 8 }}>
                            {workoutsByCategory.map((w) => {
                                const active = selectedWorkoutId === w.id;
                                return (
                                    <TouchableOpacity
                                        key={w.id}
                                        style={[
                                            styles.workoutRow,
                                            {
                                                borderColor: theme.colors.border,
                                                backgroundColor: active
                                                    ? theme.colors.accent + "15"
                                                    : theme.colors.surface,
                                            },
                                        ]}
                                        onPress={() => setSelectedWorkoutId(w.id)}
                                    >
                                        <Text
                                            style={{ color: theme.colors.text, fontWeight: "600" }}
                                        >
                                            {w.title}
                                        </Text>
                                        <Text style={{ color: theme.colors.subtext, marginTop: 2 }}>
                                            {w.category}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text
                            style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}
                        >
                            Select Dates
                        </Text>
                        <Calendar
                            onDayPress={(day) => {
                                const dateString = day.dateString;
                                setSelectedDates((prev) => {
                                    const newDates = { ...prev };
                                    if (newDates[dateString]) {
                                        delete newDates[dateString];
                                    } else {
                                        newDates[dateString] = {
                                            selected: true,
                                            selectedColor: theme.colors.accent,
                                        };
                                    }
                                    return newDates;
                                });
                            }}
                            markedDates={selectedDates}
                            theme={{
                                backgroundColor: theme.colors.surface,
                                calendarBackground: theme.colors.surface,
                                textSectionTitleColor: theme.colors.text,
                                selectedDayBackgroundColor: theme.colors.accent,
                                selectedDayTextColor: "#fff",
                                todayTextColor: theme.colors.accent,
                                dayTextColor: theme.colors.text,
                                textDisabledColor: theme.colors.subtext,
                                dotColor: theme.colors.accent,
                                selectedDotColor: "#fff",
                                arrowColor: theme.colors.accent,
                                monthTextColor: theme.colors.text,
                                indicatorColor: theme.colors.accent,
                                textDayFontWeight: "500",
                                textMonthFontWeight: "600",
                                textDayHeaderFontWeight: "600",
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                            style={styles.calendar}
                        />

                        <TouchableOpacity
                            disabled={!selectedWorkoutId || Object.keys(selectedDates).length === 0}
                            onPress={handleQuickAdd}
                            style={[
                                styles.addBtn,
                                {
                                    backgroundColor:
                                        selectedWorkoutId && Object.keys(selectedDates).length > 0
                                            ? theme.colors.accent
                                            : theme.colors.subtext,
                                },
                            ]}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700" }}>ADD</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    browseButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    browseText: { fontSize: 14, fontWeight: "600" },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    sheetContainer: { flex: 1 },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetTitle: { fontSize: 18, fontWeight: "700" },
    fieldLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    workoutRow: { borderWidth: 1, borderRadius: 12, padding: 12 },
    calendar: { marginVertical: 8, borderRadius: 12, overflow: "hidden" },
    addBtn: {
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
    },
    scheduledCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
    calendarShortcut: { padding: 8, borderRadius: 8 },
});

export default TrainingPlanManager;
