import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ImageBackground,
    Animated,
    useColorScheme,
    ImageSourcePropType,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScrollToTopOnTabPress } from "../hooks/useScrollToTopOnTabPress";
import { getTheme } from "../theme";
import { apiService } from "../services/api";
import { getCurrentUserId } from "../state/session";
import { planItemsCache } from "../services/planItemsCache";
import { Workout, PlanItem, WorkoutCategory } from "../types";
import { orderCategoriesWithClimbingAtEnd } from "../utils/categoryOrder";
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

const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
};

const getTimeBasedEmoji = (): string => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 17 ? "☀️" : "🌙";
};

const categoryIconSources: Record<string, ImageSourcePropType> = {
    "Upper Body - Pull": require("../../assets/images/workout_types/upper_body_pull.png"),
    "Upper Body - Push": require("../../assets/images/workout_types/upper_body_push.png"),
    "Legs": require("../../assets/images/workout_types/legs.png"),
    "Core": require("../../assets/images/workout_types/core.png"),
    "Climbing - Power": require("../../assets/images/workout_types/climbing.png"),
    "Climbing - Endurance": require("../../assets/images/workout_types/climbing.png"),
    "Climbing - Warm Up": require("../../assets/images/workout_types/climbing.png"),
    "Cardio": require("../../assets/images/workout_types/warmup.png"),
};

const getTypeIcon = (category: WorkoutCategory): ImageSourcePropType =>
    categoryIconSources[category] || require("../../assets/images/workout_types/default.png");

const equipmentIconSources: Record<string, ImageSourcePropType> = {
    dumbbell: require("../../assets/images/equipment/dumbbell.png"),
    barbell: require("../../assets/images/equipment/barbell.png"),
    kettlebell: require("../../assets/images/equipment/kettlebell.png"),
};

const getEquipmentIconForTitle = (title: string): ImageSourcePropType | null => {
    const lower = title.toLowerCase();
    if (lower.includes("dumbbell")) return equipmentIconSources.dumbbell;
    if (lower.includes("barbell")) return equipmentIconSources.barbell;
    if (lower.includes("kettlebell")) return equipmentIconSources.kettlebell;
    return null;
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
    const dotAnimations = useMemo(
        () =>
            weekDates.reduce<Record<string, Animated.Value>>((acc, dateISO) => {
                acc[dateISO] = new Animated.Value(1);
                return acc;
            }, {}),
        [weekDates],
    );

    const handleDayPress = (dateISO: string) => {
        setSelectedDate(dateISO);
        const anim = dotAnimations[dateISO];
        if (!anim) return;

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
                        const dotScale = dotAnimations[dateISO] || new Animated.Value(1);

                        return (
                            <TouchableOpacity
                                key={dateISO}
                                style={styles.dayCol}
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
                                                    ? isSelected
                                                        ? "#FFFFFF"
                                                        : theme.colors.accent
                                                    : theme.colors.border,
                                                transform: [{ scale: dotScale }],
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
    const scrollRef = useScrollToTopOnTabPress();

    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [_loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const nowLocal = new Date();
    const localTodayStr = `${nowLocal.getFullYear()}-${(nowLocal.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${nowLocal.getDate().toString().padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState<string>(localTodayStr);

    // Load cached data on mount
    useEffect(() => {
        let mounted = true;

        const loadPreloadedData = async () => {
            try {
                const [cachedWorkouts, cachedPlanItems] = await Promise.all([
                    planItemsCache.getWorkouts(),
                    planItemsCache.getCachedItems(),
                ]);
                if (!mounted) return;
                setWorkouts(cachedWorkouts);
                setPlanItems(cachedPlanItems);
            } catch (error) {
                console.error("[Home] Failed to load cached data:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadPreloadedData();
        return () => {
            mounted = false;
        };
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

    const refreshCacheFromStore = useCallback(async () => {
        try {
            const [cachedWorkouts, cachedPlanItems] = await Promise.all([
                planItemsCache.getWorkouts(),
                planItemsCache.getCachedItems(),
            ]);
            setWorkouts(cachedWorkouts);
            setPlanItems(cachedPlanItems);
        } catch (error) {
            console.error("[Home] Failed to refresh cached data:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
            const refreshCache = async () => {
                try {
                    planItemsCache.invalidate();
                    await refreshCacheFromStore();
                } catch (error) {
                    console.error("[Home] Error refreshing cache:", error);
                }
            };
            refreshCache();
        }, [loadUserProfile, refreshCacheFromStore]),
    );

    const getWeekDates = (baseISO: string) => {
        const parts = baseISO.split("-").map((s) => parseInt(s, 10));
        const base = new Date(parts[0], parts[1] - 1, parts[2]);
        const startOfWeek = new Date(base);
        startOfWeek.setDate(base.getDate() - base.getDay()); // Sunday start

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

        weekDates.forEach((dateISO) => {
            planItems.forEach((item) => {
                if (!item || !item.workout) return;
                const sd = (item as any).scheduledDate ?? (item as any).scheduled_date;
                if (!sd) return;
                const sdStr =
                    typeof sd === "string"
                        ? sd.split("T")[0].split(" ")[0]
                        : (() => {
                              const dt = new Date(sd as any);
                              return `${dt.getFullYear()}-${(dt.getMonth() + 1)
                                  .toString()
                                  .padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
                          })();
                if (sdStr === dateISO) {
                    result[dateISO].push(item.workout);
                }
            });
        });

        return result;
    };

    const weekDates = getWeekDates(selectedDate);
    const weekWorkouts = getScheduledWorkoutsByDate();
    const todayISO = localTodayStr;
    const todaysWorkoutList = weekWorkouts[todayISO] || [];
    const isRestDay = selectedDate === todayISO && todaysWorkoutList.length === 0;

    const displayDate = isRestDay
        ? todayISO
        : weekWorkouts[selectedDate] && weekWorkouts[selectedDate].length > 0
          ? selectedDate
          : weekDates.find((d) => (weekWorkouts[d] || []).length > 0) || selectedDate;

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            planItemsCache.invalidate();
            await refreshCacheFromStore();
        } catch (error) {
            console.error("[Home] Refresh failed:", error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshCacheFromStore]);

    return (
        <ImageBackground
            source={require("../../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
            <SafeAreaView
                edges={["top"]}
                style={[styles.safeArea, { backgroundColor: "transparent" }]}
            >
                <ScrollView
                    ref={scrollRef}
                    style={[styles.container, { backgroundColor: "transparent" }]}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.accent]}
                            progressBackgroundColor={theme.colors.surface}
                        />
                    }
                    overScrollMode="never"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HERO IMAGE WITH GREETING */}
                    <ImageBackground
                        source={require("../../assets/images/homebg.png")}
                        style={styles.heroBanner}
                        imageStyle={styles.heroBannerImage}
                    >
                        <View style={[styles.headerRow, styles.heroHeader]}>
                            <TouchableOpacity
                                onPress={onOpenProfile}
                                style={[
                                    styles.iconButton,
                                    {
                                        backgroundColor: "rgba(0,0,0,0.4)",
                                        borderColor: "rgba(255,255,255,0.4)",
                                        borderWidth: StyleSheet.hairlineWidth,
                                    },
                                ]}
                            >
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
                                            { backgroundColor: "rgba(255,255,255,0.2)" },
                                        ]}
                                    >
                                        <Ionicons name="person" size={20} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onOpenCalendar}
                                style={[
                                    styles.iconButton,
                                    {
                                        backgroundColor: "rgba(0,0,0,0.4)",
                                        borderColor: "rgba(255,255,255,0.4)",
                                        borderWidth: StyleSheet.hairlineWidth,
                                    },
                                ]}
                            >
                                <Ionicons name="calendar-outline" size={26} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.heroBannerOverlay}>
                            <Text style={styles.heroBannerTitle}>
                                {getTimeBasedGreeting()}
                                {userName ? `, ${userName}` : ""} {getTimeBasedEmoji()}
                            </Text>
                            <Text style={styles.heroBannerSubtitle}>
                                Curated workouts and plans tailored for your climb to the top.
                            </Text>
                            <View style={styles.heroBannerActions}>
                                <TouchableOpacity
                                    style={styles.heroBannerPrimaryButton}
                                    onPress={() => router.push("/workout")}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.heroBannerButtonText}>Browse Workouts</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.heroBannerSecondaryButton}
                                    onPress={() => router.push("/plan")}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.heroBannerSecondaryButtonText}>
                                        Browse Plans
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ImageBackground>
                    {/* WEEK SNAPSHOT */}
                    <WeekSnapshot
                        weekDates={weekDates}
                        weekWorkouts={weekWorkouts}
                        todayISO={todayISO}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        theme={theme}
                        styles={styles}
                    />

                    {/* TODAY / SELECTED DAY WORKOUTS */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            {isRestDay
                                ? "Today's workouts"
                                : displayDate === todayISO
                                  ? "Today's workouts"
                                  : (() => {
                                        const [yy, mm, dd] = displayDate
                                            .split("-")
                                            .map((s) => parseInt(s, 10));
                                        return new Date(yy, mm - 1, dd).toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        );
                                    })()}
                        </Text>

                        {isRestDay ? (
                            <View style={styles.restDayRow}>
                                <Text style={[styles.restDayText, { color: theme.colors.text }]}>
                                    Rest day
                                </Text>
                                <Text
                                    style={[styles.restDaySubtext, { color: theme.colors.subtext }]}
                                >
                                    Take today to recover—tonight’s stretch counts as progress too.
                                </Text>
                            </View>
                        ) : weekWorkouts[displayDate] && weekWorkouts[displayDate].length > 0 ? (
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
                                        activeOpacity={0.85}
                                        onPress={() =>
                                            router.push(
                                                `/workout-detail?id=${encodeURIComponent(item.id)}`,
                                            )
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
                                            {getEquipmentIconForTitle(item.title) && (
                                                <Image
                                                    source={getEquipmentIconForTitle(item.title)}
                                                    style={styles.previewEquipmentIcon}
                                                    resizeMode="contain"
                                                />
                                            )}
                                        </View>
                                        <Text
                                            style={[
                                                styles.previewTitle,
                                                { color: theme.colors.text },
                                            ]}
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
                                        <View style={styles.previewStats}>
                                            {item.sets !== undefined && item.reps !== undefined ? (
                                                <Text
                                                    style={[
                                                        styles.previewStatText,
                                                        { color: theme.colors.text },
                                                    ]}
                                                >
                                                    {item.sets} sets × {item.reps} reps
                                                </Text>
                                            ) : null}
                                            {item.intensity ? (
                                                <Text
                                                    style={[
                                                        styles.previewStatText,
                                                        { color: theme.colors.subtext },
                                                    ]}
                                                >
                                                    {item.intensity}
                                                </Text>
                                            ) : null}
                                        </View>
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
                                <Text style={[styles.todaysDesc, { color: theme.colors.subtext }]}>
                                    Check back later or add a workout from the library.
                                </Text>
                            </View>
                        )}
                    </View>

                    {!isRestDay &&
                    weekWorkouts[displayDate] &&
                    weekWorkouts[displayDate].length > 0 ? (
                        <TouchableOpacity activeOpacity={0.85} style={styles.warmupCard}>
                            <ImageBackground
                                source={require("../../assets/images/warmup.png")}
                                style={styles.warmupBackground}
                                imageStyle={styles.warmupImage}
                            >
                                <View style={styles.warmupOverlay}>
                                    <Text style={styles.warmupTitle}>Start With A Warm Up</Text>
                                    <Text style={styles.warmupSubtitle}>
                                        Ease into today’s session with pulses and mobility.
                                    </Text>
                                    <View style={styles.warmupPill}>
                                        <Text style={styles.warmupPillText}>Let’s warm up</Text>
                                    </View>
                                </View>
                            </ImageBackground>
                        </TouchableOpacity>
                    ) : null}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    // This controls the *only* padding; no flexGrow tricks
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
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
        fontSize: 30,
        fontWeight: "700",
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    heroBanner: {
        width: "100%",
        height: 420,
        borderRadius: 32,
        overflow: "hidden",
        marginBottom: 28,
    },
    heroBannerImage: {
        borderRadius: 32,
    },
    heroHeader: {
        position: "absolute",
        top: 16,
        left: 20,
        right: 20,
        zIndex: 2,
    },
    heroBannerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: "flex-end",
    },
    heroBannerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 6,
    },
    heroBannerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.92)",
        marginBottom: 14,
    },
    heroBannerActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },
    heroBannerPrimaryButton: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.94)",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
    },
    heroBannerSecondaryButton: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.8)",
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    heroBannerButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f1f1f",
    },
    heroBannerSecondaryButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    warmupCard: {
        width: "100%",
        height: 200,
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 24,
    },
    warmupBackground: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    warmupImage: {
        borderRadius: 24,
    },
    warmupOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: 20,
        justifyContent: "flex-end",
    },
    warmupTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    warmupSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.9)",
        marginTop: 4,
        marginBottom: 12,
    },
    warmupPill: {
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.92)",
    },
    warmupPillText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#262626",
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        marginBottom: 16,
    },
    weekContainer: {
        marginBottom: 16,
    },
    weekCard: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
    restDayRow: {
        alignItems: "flex-start",
        paddingVertical: 12,
    },
    restDayText: {
        fontSize: 18,
        fontWeight: "700",
    },
    restDaySubtext: {
        fontSize: 14,
        marginTop: 4,
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
        borderRadius: 18,
        padding: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    previewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    previewEquipmentIcon: {
        width: 24,
        height: 24,
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
    previewStats: {
        marginTop: 8,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    previewStatText: {
        fontSize: 12,
        marginRight: 12,
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 8,
    },
    categoryTile: {
        width: "48%",
        aspectRatio: 1.05,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        position: "relative",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: 12,
    },
    categoryTileContent: {
        paddingLeft: 8,
        paddingRight: 20,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    categoryTileText: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        maxWidth: "100%",
    },
    categoryTileCount: {
        fontSize: 12,
        fontWeight: "400",
        textAlign: "center",
        marginTop: 4,
    },
    categoryTileIconWrapper: {
        position: "absolute",
        right: 8,
        bottom: 8,
        opacity: 0.9,
    },
    categoryTileIcon: {
        width: 40,
        height: 40,
    },
});

export default Home;
