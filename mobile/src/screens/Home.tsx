import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    useColorScheme,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScrollToTopOnTabPress } from "../hooks/useScrollToTopOnTabPress";
import { getTheme } from "../theme";
import { apiService } from "../services/api";
import { getCurrentPlanId, getCurrentUserId } from "../state/session";
import { planItemsCache } from "../services/planItemsCache";
import { Workout, PlanItem } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

interface HomeProps {
    onOpenCalendar: () => void;
    onOpenProfile: () => void;
    onOpenLibrary: (category?: string) => void;
    onOpenRoutine?: () => void;
}

interface WeekSnapshotProps {
    weekDates: string[];
    weekWorkouts: Record<string, Workout[]>;
    todayISO: string;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    theme: ReturnType<typeof getTheme>;
    styles: any;
}

// Helper function to get greeting based on time of day
const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Good morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
        return "Good evening";
    } else {
        return "Good night";
    }
};

// Helper function to get time-appropriate emoji
const getTimeBasedEmoji = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) {
        return "☀️"; // Sunrise for morning
    } else {
        return "🌙"; // Moon for night
    }
};

// Mapping of category names to emojis
const getCategoryEmoji = (category: string): string => {
    const categoryMap: Record<string, string> = {
        "Cardio": "🏃‍♀️",
        "Climbing - Endurance": "🧗‍♀️",
        "Climbing - Warm Up": "🧎‍♀️",
        "Climbing - Power": "⚡️",
        "Core": "🎯",
        "Legs": "🏋️‍♂️",
        "Upper Body - Pull": "💪",
        "Upper Body - Push": "💪",
    };
    return categoryMap[category] || "🏋️";
};

const WeekSnapshot: React.FC<WeekSnapshotProps> = ({
    weekDates,
    weekWorkouts,
    todayISO,
    selectedDate,
    setSelectedDate,
    theme,
    styles,
}) => {
    const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dotAnimations = useRef<Record<string, Animated.Value>>({});

    // Initialize animations for each day
    weekDates.forEach((dateISO) => {
        if (!dotAnimations.current[dateISO]) {
            dotAnimations.current[dateISO] = new Animated.Value(1);
        }
    });

    const handleDayPress = (dateISO: string) => {
        setSelectedDate(dateISO);
        
        // Animate the dot when tapped
        const anim = dotAnimations.current[dateISO];
        if (anim) {
            Animated.sequence([
                Animated.spring(anim, {
                    toValue: 1.3,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 7,
                }),
                Animated.spring(anim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 7,
                }),
            ]).start();
        }
    };

    return (
        <View style={styles.weekContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>This week</Text>
            <View
                style={[
                    styles.weekCard,
                    {
                        backgroundColor: theme.colors.surface + "E6",
                        borderColor: theme.colors.border + "40",
                    },
                ]}
            >
                <View style={styles.weekRow}>
                    {weekDates.map((dateISO) => {
                        const [yy, mm, dd] = dateISO.split("-").map((s) => parseInt(s, 10));
                        const d = new Date(yy, mm - 1, dd);
                        const label = dayShort[d.getDay()];
                        const hasWorkouts = (weekWorkouts[dateISO] || []).length > 0;
                        const isToday = dateISO === todayISO;
                        const isSelected = dateISO === selectedDate;
                        const dotScale = dotAnimations.current[dateISO] || new Animated.Value(1);
                        
                        return (
                            <TouchableOpacity
                                key={dateISO}
                                style={[
                                    styles.dayCol,
                                ]}
                                onPress={() => handleDayPress(dateISO)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.dayCircle,
                                        {
                                            backgroundColor: isSelected
                                                ? theme.colors.accent
                                                : "transparent",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayLabel,
                                            {
                                                color: isSelected
                                                    ? "#FFFFFF"
                                                    : isToday
                                                      ? theme.colors.accent
                                                      : theme.colors.subtext,
                                                fontWeight: isSelected
                                                    ? "700"
                                                    : isToday
                                                      ? "600"
                                                      : "500",
                                            },
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                    <Animated.View
                                        style={[
                                            styles.dot,
                                            {
                                                backgroundColor: hasWorkouts
                                                    ? (isSelected ? "#FFFFFF" : theme.colors.accent)
                                                    : theme.colors.border,
                                                transform: [
                                                    {
                                                        scale: dotScale,
                                                    },
                                                ],
                                                width: 6,
                                                height: 6,
                                                borderRadius: 3,
                                            },
                                        ]}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export const Home: React.FC<HomeProps> = ({
    onOpenCalendar,
    onOpenProfile,
    onOpenLibrary,
    onOpenRoutine: _onOpenRoutine,
}) => {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [_loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const nowLocal = new Date();
    const localTodayStr = `${nowLocal.getFullYear()}-${(nowLocal.getMonth() + 1).toString().padStart(2, "0")}-${nowLocal.getDate().toString().padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState<string>(localTodayStr);
    const scrollRef = useScrollToTopOnTabPress();

    useEffect(() => {
        const loadPreloadedData = async () => {
            // Get workouts from planItemsCache (will use cache or fetch if needed)
            const cachedWorkouts = await planItemsCache.getWorkouts();
            setWorkouts(cachedWorkouts);

            // Get plan items from cache (already preloaded in startup)
            const cachedPlanItems = await planItemsCache.getCachedItems();
            setPlanItems(cachedPlanItems);

            console.log("[Home] Loaded cached workouts:", cachedWorkouts.length);
            console.log("[Home] Loaded cached plan items:", cachedPlanItems.length);
            setLoading(false);
        };

        loadPreloadedData();
    }, []);

    const loadUserProfile = useCallback(async () => {
        const userId = getCurrentUserId();
        if (!userId) return;

        try {
            const user = await apiService.getUserProfile(userId);
            setProfilePhoto(user.profilePhoto || null);
            setUserName(user.name || null);
        } catch (error) {
            console.error("[Home] Error loading user profile:", error);
        }
    }, []);

    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    // Refresh profile photo and cache when screen comes into focus (e.g., after updating profile or re-tapping tab)
    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
            // Refresh cache when Home tab is tapped
            const refreshCache = async () => {
                try {
                    planItemsCache.invalidate();
                    await Promise.all([
                        planItemsCache.getCachedItems(),
                        planItemsCache.getWorkouts(),
                    ]);
                } catch (error) {
                    console.error("[Home] Error refreshing cache:", error);
                }
            };
            refreshCache();
        }, [loadUserProfile])
    );

    // scroll to top when tab is pressed (handled by hook)
    useEffect(() => {}, []);

    // Helpers to compute scheduled workouts similar to CalendarView
    // Legacy frequency-based scheduling is deprecated. We'll only consider explicit dated plan items.

    const getWeekDates = (baseISO: string) => {
        // Parse baseISO (YYYY-MM-DD) into local components to avoid timezone shifts
        const parts = baseISO.split("-").map((s) => parseInt(s, 10));
        const base = new Date(parts[0], parts[1] - 1, parts[2]);
        const startOfWeek = new Date(base);
        // Sunday as 0; align to Sunday start
        startOfWeek.setDate(base.getDate() - base.getDay());
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, "0");
            const dd = d.getDate().toString().padStart(2, "0");
            dates.push(`${y}-${m}-${dd}`);
        }
        return dates;
    };

    const getScheduledWorkoutsByDate = (): Record<string, Workout[]> => {
        const weekDates = getWeekDates(selectedDate);
        const result: Record<string, Workout[]> = {};
        weekDates.forEach((d) => (result[d] = []));

        // Process plan items directly (no need for workout plan wrapper)
        weekDates.forEach((dateISO) => {
            planItems.forEach((item) => {
                if (!item || !item.workout) return;
                const sd = (item as any).scheduledDate ?? (item as any).scheduled_date;
                if (!sd) return; // we only handle explicit dated items here
                const sdStr =
                    typeof sd === "string"
                        ? sd.split("T")[0].split(" ")[0]
                        : (() => {
                              const dt = new Date(sd as any);
                              return `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
                          })();
                if (sdStr === dateISO) result[dateISO].push(item.workout);
            });
        });
        return result;
    };

    const weekDates = getWeekDates(selectedDate);
    const weekWorkouts = getScheduledWorkoutsByDate();
    const todayISO = localTodayStr;
    // choose which date to display in the "Today's workouts" section:
    // prefer the selected date; if it has no workouts, fall back to the next date in the week that does
    const displayDate =
        weekWorkouts[selectedDate] && weekWorkouts[selectedDate].length > 0
            ? selectedDate
            : weekDates.find((d) => (weekWorkouts[d] || []).length > 0) || selectedDate;

    const _todaysWorkout = workouts.length > 0 ? workouts[0] : undefined;

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.safeArea, { backgroundColor: theme.colors.bg }]}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onOpenProfile} style={styles.iconButton}>
                        {profilePhoto ? (
                            <Image
                                source={{ uri: profilePhoto }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.profileImage,
                                    styles.profileImagePlaceholder,
                                    { backgroundColor: theme.colors.surface },
                                ]}
                            >
                                <Ionicons name="person" size={20} color={theme.colors.subtext} />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onOpenCalendar} style={styles.iconButton}>
                        <Ionicons name="calendar-outline" size={26} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                    {getTimeBasedGreeting()}
                    {userName ? `, ${userName}` : ""} {getTimeBasedEmoji()}
                </Text>

                <WeekSnapshot
                    weekDates={weekDates}
                    weekWorkouts={weekWorkouts}
                    todayISO={localTodayStr}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    theme={theme}
                    styles={styles}
                />

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        {displayDate === todayISO
                            ? "Today's workouts"
                            : (() => {
                                  const [yy, mm, dd] = displayDate
                                      .split("-")
                                      .map((s) => parseInt(s, 10));
                                  return new Date(yy, mm - 1, dd).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                  });
                              })()}
                    </Text>
                    {weekWorkouts[displayDate] && weekWorkouts[displayDate].length > 0 ? (
                        <View style={{ gap: 12 }}>
                            {weekWorkouts[displayDate].map((item, idx) => (
                                <TouchableOpacity
                                    key={`${item.id}-${idx}`}
                                    style={[
                                        styles.previewCardFull,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                        },
                                    ]}
                                    onPress={() =>
                                        router.push(`/workout?id=${encodeURIComponent(item.id)}`)
                                    }
                                >
                                    <View style={styles.previewHeader}>
                                        <View
                                            style={[
                                                styles.categoryBadge,
                                                { backgroundColor: theme.colors.accent },
                                            ]}
                                        >
                                            <Text style={styles.categoryBadgeText}>
                                                {item.category.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[styles.previewTitle, { color: theme.colors.text }]}
                                        numberOfLines={1}
                                    >
                                        {item.title}
                                    </Text>
                                    {item.description ? (
                                        <Text
                                            style={[
                                                styles.previewDesc,
                                                { color: theme.colors.subtext },
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.todaysCard,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.todaysTitle, { color: theme.colors.text }]}>
                                No workout scheduled
                            </Text>
                        </View>
                    )}
                </View>

                {/* Workout categories snapshot below today's workouts */}
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Workout
                        </Text>
                        <TouchableOpacity onPress={() => onOpenLibrary && onOpenLibrary()}>
                            <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                                See all
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryGrid}>
                        {Array.from(new Set(workouts.map((w) => w.category)))
                            .sort()
                            .map((cat) => {
                                const workoutCount = workouts.filter((w) => w.category === cat).length;
                                return (
                                    <TouchableOpacity
                                        key={String(cat)}
                                        style={[
                                            styles.categoryTile,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderColor: theme.colors.border,
                                                shadowColor: "#000",
                                                shadowOpacity: 0.08,
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowRadius: 8,
                                                elevation: 3,
                                            },
                                        ]}
                                        onPress={() => onOpenLibrary && onOpenLibrary(String(cat))}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.categoryTileEmoji}>
                                            {getCategoryEmoji(cat)}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.categoryTileText,
                                                { color: theme.colors.text },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {cat}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.categoryTileCount,
                                                { color: theme.colors.subtext },
                                            ]}
                                        >
                                            {workoutCount} {workoutCount === 1 ? "workout" : "workouts"}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    profileImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    profileImagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 12,
    },
    weekContainer: {
        marginBottom: 16,
    },
    weekCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
    },
    weekRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dayCol: {
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
    },
    dayLabel: {
        fontSize: 13,
        marginBottom: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    section: {
        marginBottom: 20,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    linkText: {
        fontSize: 14,
        fontWeight: "600",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
    },
    todaysCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    todaysTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    todaysDesc: {
        fontSize: 14,
    },
    previewList: {
        paddingVertical: 8,
    },
    previewCard: {
        width: 220,
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    previewCardFull: {
        borderRadius: 12,
        padding: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    previewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    categoryBadgeText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },
    previewDesc: {
        fontSize: 13,
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12,
    },
    categoryTile: {
        width: "48%",
        aspectRatio: 1.2,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
    },
    categoryTileEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    categoryTileText: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    categoryTileCount: {
        fontSize: 12,
        fontWeight: "400",
        textAlign: "center",
        marginTop: 4,
    },
});

export default Home;
