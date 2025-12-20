import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    useColorScheme,
    Modal,
    Alert,
    ImageBackground,
    Image,
    Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { Workout, CreateWorkoutRequest, WorkoutImport } from "@/src/types";
import { WorkoutCard } from "@/src/components/WorkoutCard";
import { WorkoutForm } from "@/src/components/WorkoutForm";
import { getCurrentUser, getCurrentUserId, loadStoredUserId } from "@/src/state/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderCategoriesWithClimbingAtEnd } from "@/src/utils/categoryOrder";

export default function WorkoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string; id?: string }>();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(() => getCurrentUserId());
    const [customWorkouts, setCustomWorkouts] = useState<WorkoutImport[]>([]);
    const [customLoading, setCustomLoading] = useState(false);
    const chipListRef = useRef<import("react-native").FlatList<string> | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await apiService.getWorkouts();
                setWorkouts(data || []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Determine admin based on the authenticated/selected current user
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // Prefer a resolved current user if available
                const current = await getCurrentUser();
                if (!mounted) return;
                if (current) {
                    setIsAdmin(Boolean(current.isAdmin));
                    setCurrentUserId(current.id);
                    return;
                }
                // Fallback: if only an id is available, fetch it
                const id = getCurrentUserId();
                if (id) {
                    setCurrentUserId(id);
                    const u = await apiService.getUserProfile(id);
                    if (!mounted) return;
                    setIsAdmin(Boolean(u?.isAdmin));
                }
            } catch {
                // default false
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (currentUserId) return;
        loadStoredUserId().then((storedId) => {
            if (storedId) {
                setCurrentUserId(storedId);
            }
        });
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) {
            console.log("No current user ID; skipping fetch of custom workouts");
            setCustomWorkouts([]);
            return;
        }
        let active = true;
        setCustomLoading(true);
        (async () => {
            try {
                const data = await apiService.getWorkoutImports(currentUserId);
                console.log("Fetched custom workouts:", data);
                if (!active) return;
                setCustomWorkouts(data || []);
            } catch (err) {
                if (!active) return;
                setCustomWorkouts([]);
            } finally {
                if (active) setCustomLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [currentUserId]);

    const categoriesWithAll = React.useMemo(() => {
        const base = orderCategoriesWithClimbingAtEnd(
            Array.from(new Set(workouts.map((w) => w.category))),
        );
        return ["All", "Custom", ...base];
    }, [workouts]);
    const categories = categoriesWithAll.filter((cat) => cat !== "All" && cat !== "Custom");
    const computeChipIndex = (value: string | null) => {
        if (!value || value === "All") return 0;
        const idx = categoriesWithAll.findIndex((cat) => cat === value);
        return idx >= 0 ? idx : 0;
    };

    // Initialize category from query param
    useEffect(() => {
        if (!categoriesWithAll) return;
        if (typeof params?.category === "string" && params.category.length > 0) {
            setCategory(params.category);
        }
        const idx =
            typeof params?.category === "string" && params.category.length > 0
                ? computeChipIndex(params.category)
                : 0;
        requestAnimationFrame(() => {
            try {
                chipListRef.current?.scrollToIndex?.({
                    index: idx,
                    animated: true,
                    viewPosition: 0.5,
                });
            } catch {}
        });
    }, [params?.category, categoriesWithAll]);

    // When an id is provided, navigate to workout detail
    useEffect(() => {
        if (typeof params.id === "string" && params.id.length > 0) {
            router.push(`/workout-detail?id=${encodeURIComponent(params.id)}`);
        }
    }, [params?.id, router]);

    const filteredByCategory = category
        ? workouts.filter((w) => w.category === category)
        : workouts;
    const filtered = filteredByCategory;
    const showingCustom = category === "Custom";
    const listData = showingCustom ? customWorkouts : filtered;
    const listLoading = showingCustom ? customLoading : loading;

    // After data/categories are ready, auto-scroll the chip list to the selected category
    useEffect(() => {
        try {
            const idx = computeChipIndex(category);
            if (chipListRef.current && idx >= 0) {
                chipListRef.current.scrollToIndex?.({
                    index: idx,
                    animated: true,
                    viewPosition: 0.5,
                });
            }
        } catch {
            // best-effort only
        }
    }, [category, categoriesWithAll.length]);

    const renderImportPrompt = () => (
        <TouchableOpacity
            style={[
                styles.importPrompt,
                {
                    borderColor: "transparent",
                    backgroundColor: "rgba(255,255,255,0.15)",
                },
            ]}
            onPress={() => router.push("/import-workout")}
        >
            <View style={{ flex: 1 }}>
                <Text style={[styles.importPromptTitle, { color: theme.colors.text }]}>
                    Don’t find your workout?
                </Text>
                <View style={styles.importIconsRow}>
                    <Ionicons name="logo-instagram" size={18} color={theme.colors.text} />
                    <Ionicons name="logo-youtube" size={18} color={theme.colors.text} />
                    <Ionicons name="logo-tiktok" size={18} color={theme.colors.text} />
                    <Text style={[styles.importPromptSubtitle, { color: theme.colors.accent }]}>
                        Import…
                    </Text>
                </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
        </TouchableOpacity>
    );

    const convertImportToWorkout = (item: WorkoutImport): Workout => ({
        id: item.id,
        title: item.title || "Imported workout",
        category: (item.category || null) as Workout["category"],
        description: item.description || "",
        workoutType: "cardio",
        duration: undefined,
        sets: undefined,
        reps: undefined,
        intensity: item.sourcePlatform || "custom",
        imageUrl: item.thumbnailUrl || undefined,
        imageUrl2: undefined,
        isGlobal: false,
        createdBy: undefined,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    });

    const renderCustomCard = (item: WorkoutImport) => {
        const mapped = convertImportToWorkout(item);
        return (
            <WorkoutCard
                workout={mapped}
                isCustom
                onPress={() =>
                    router.push({
                        pathname: "/import-workout/custom",
                        params: {
                            id: item.id,
                            payload: JSON.stringify(item),
                        },
                    })
                }
            />
        );
    };

    const renderListEmpty = () => {
        if (!showingCustom) return null;
        return (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
                    {currentUserId
                        ? "No custom workouts yet. Import one to see it here."
                        : "Sign in to save custom workouts from social media."}
                </Text>
            </View>
        );
    };

    return (
        <ImageBackground
            source={require("../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
            <SafeAreaView
                edges={["top"]}
                style={[styles.container, { backgroundColor: "transparent" }]}
            >
                <View style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={[styles.backText, { color: theme.colors.accent }]}>
                            ‹ Back
                        </Text>
                    </TouchableOpacity>
                    {isAdmin ? (
                        <TouchableOpacity
                            onPress={() => setShowForm(true)}
                            style={[styles.addBtn, { borderColor: theme.colors.accent }]}
                            accessibilityRole="button"
                            accessibilityLabel="Add workout"
                        >
                            <Text style={[styles.addBtnText, { color: theme.colors.accent }]}>
                                Add
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 60 }} />
                    )}
                </View>

                <View
                    style={[
                        styles.filterBar,
                        {
                            borderBottomColor: "transparent",
                        },
                    ]}
                >
                    <FlatList
                        ref={chipListRef as any}
                        horizontal
                        data={categoriesWithAll}
                        keyExtractor={(item) => item}
                        onScrollToIndexFailed={(info) => {
                            // Retry by scrolling close to the desired offset; then try again
                            try {
                                const offset = Math.max(0, info.averageItemLength * info.index);
                                (chipListRef.current as any)?.scrollToOffset?.({
                                    offset,
                                    animated: true,
                                });
                                setTimeout(() => {
                                    (chipListRef.current as any)?.scrollToIndex?.({
                                        index: info.index,
                                        animated: true,
                                        viewPosition: 0.5,
                                    });
                                }, 100);
                            } catch {
                                // ignore
                            }
                        }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setCategory(item === "All" ? null : item)}
                                style={[
                                    styles.filterChip,
                                    {
                                        borderColor: theme.colors.border,
                                        backgroundColor: (
                                            item === "All" ? category === null : category === item
                                        )
                                            ? theme.colors.accent
                                            : "transparent",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        {
                                            color: (
                                                item === "All"
                                                    ? category === null
                                                    : category === item
                                            )
                                                ? "#fff"
                                                : theme.colors.text,
                                        },
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                    />
                    {/* Auto-scroll chips to selected category when provided via params */}
                    {/* Execute after layout to ensure list is measured */}
                <View
                    onLayout={() => {
                        try {
                            const idx = computeChipIndex(category);
                            if (chipListRef.current && idx >= 0) {
                                (chipListRef.current as any).scrollToIndex?.({
                                    index: idx,
                                        animated: true,
                                        viewPosition: 0.5,
                                    });
                                }
                            } catch {
                                // best-effort only
                            }
                        }}
                    />
                </View>

                <View style={{ paddingHorizontal: 16 }}>{renderImportPrompt()}</View>

                {listLoading ? (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: theme.colors.subtext }}>
                            {showingCustom ? "Loading custom workouts..." : "Loading workouts..."}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        keyExtractor={(item: any) => item.id}
                        renderItem={({ item }) =>
                            showingCustom ? (
                                renderCustomCard(item as WorkoutImport)
                            ) : (
                                <WorkoutCard
                                    workout={item as Workout}
                                    onPress={() => {
                                        router.push(
                                            `/workout-detail?id=${encodeURIComponent(
                                                (item as Workout).id,
                                            )}`,
                                        );
                                    }}
                                />
                            )
                        }
                        contentContainerStyle={{
                            paddingVertical: 8,
                            paddingBottom: insets.bottom + 16,
                        }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderListEmpty}
                    />
                )}

                {/* Create / Edit Workout */}
                <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
                    <View style={{ flex: 1 }}>
                        <WorkoutForm
                            onCancel={() => setShowForm(false)}
                            onSubmit={async (payload: CreateWorkoutRequest) => {
                                try {
                                    const created = await apiService.createWorkout(payload);
                                    setWorkouts((prev) => [created, ...prev]);
                                    setShowForm(false);
                                    Alert.alert("Created", "Workout created successfully");
                                } catch (e) {
                                    Alert.alert("Error", "Failed to create workout");
                                }
                            }}
                        />
                    </View>
                </Modal>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: { width: 60 },
    backText: { fontSize: 16, fontWeight: "600" },
    addBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    addBtnText: { fontSize: 16, fontWeight: "700" },
    filterBar: { borderBottomWidth: 1 },
    filterChip: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    filterText: { fontSize: 14, fontWeight: "600" },
    importPrompt: {
        marginTop: 16,
        borderWidth: 1,
        borderRadius: 24,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    importPromptTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    importPromptSubtitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    importIconsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    emptyState: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    emptyText: {
        textAlign: "center",
        fontSize: 15,
    },
    importIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
});
