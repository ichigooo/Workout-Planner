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
    Image,
    Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { Workout, CreateWorkoutRequest, WorkoutImport } from "@/src/types";
import { EnhancedWorkoutCard } from "@/src/components/EnhancedWorkoutCard";
import { ImportCTACard } from "@/src/components/ImportCTACard";
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

    const showingCustom = category === "Custom";

    // Separate personal imports (user's own, non-global) from public imports (global)
    const personalImports = customWorkouts.filter(
        (w) => !w.isGlobal && w.userId === currentUserId
    );

    // Filter regular workouts by category
    const filteredRegularWorkouts = category && !showingCustom
        ? workouts.filter((w) => w.category === category)
        : workouts;

    // Filter custom workouts by category (if not showing "Custom" tab)
    // For category tabs: include matching imports (personal AND public)
    const filteredCustomWorkouts = category && !showingCustom
        ? customWorkouts.filter((w) => w.category === category)
        : customWorkouts;

    // Combine regular workouts with custom workouts for category views
    // In "Custom" tab, only show personal imports (not public ones)
    // In "All" or specific category tabs, show both regular + matching custom workouts (including public)
    const listData = showingCustom
        ? personalImports
        : [...filteredRegularWorkouts, ...filteredCustomWorkouts];

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

    const handleDeleteCustomWorkout = (workoutId: string) => {
        if (!currentUserId) {
            Alert.alert("Error", "Please sign in to delete workouts.");
            return;
        }

        Alert.alert(
            "Delete Workout",
            "Are you sure you want to delete this workout? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.deleteWorkoutImport(workoutId, currentUserId);
                            // Refresh the custom workouts list
                            const imports = await apiService.getWorkoutImports(currentUserId);
                            setCustomWorkouts(imports);
                        } catch (error: any) {
                            console.error("Failed to delete workout:", error);
                            const message = error?.message || "Failed to delete workout. Please try again.";
                            Alert.alert("Error", message);
                        }
                    },
                },
            ],
        );
    };

    const renderCustomCard = (item: WorkoutImport) => {
        const mapped = convertImportToWorkout(item);

        // Determine if user can delete this import
        // Personal imports: only owner can delete
        // Global imports: only owner AND must be admin
        const isOwner = item.userId === currentUserId;
        const canDelete = isOwner && (!item.isGlobal || isAdmin);

        // Only show "Custom" tag for personal imports, not public ones
        const isPersonalImport = !item.isGlobal && isOwner;

        return (
            <EnhancedWorkoutCard
                workout={mapped}
                isCustom={isPersonalImport}
                onPress={() =>
                    router.push({
                        pathname: "/import-workout/custom",
                        params: {
                            id: item.id,
                            payload: JSON.stringify(item),
                        },
                    })
                }
                onDelete={canDelete ? () => handleDeleteCustomWorkout(item.id) : undefined}
                showQuickActions={false}
            />
        );
    };

    const renderListEmpty = () => {
        if (!showingCustom) return null;
        return (
            <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
                    <Ionicons name="cloud-upload-outline" size={36} color={theme.colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                    No workouts found
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
                    {currentUserId
                        ? "Import workouts from social media to see them here"
                        : "Sign in to save custom workouts from social media"}
                </Text>
                <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: theme.colors.accent }]}
                    onPress={() => router.push("/import-workout")}
                >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.emptyButtonText}>Import Workout</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.screenBackground, { backgroundColor: theme.colors.bg }]}>
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

                <View style={{ paddingHorizontal: 16 }}>
                    <ImportCTACard onPress={() => router.push("/import-workout")} />
                </View>

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
                        renderItem={({ item }) => {
                            // Check if this is a custom workout import by looking for sourceUrl
                            const isCustomImport = 'sourceUrl' in item;

                            if (showingCustom || isCustomImport) {
                                return renderCustomCard(item as WorkoutImport);
                            }

                            return (
                                <EnhancedWorkoutCard
                                    workout={item as Workout}
                                    onPress={() => {
                                        router.push(
                                            `/workout-detail?id=${encodeURIComponent(
                                                (item as Workout).id,
                                            )}`,
                                        );
                                    }}
                                    showQuickActions={false}
                                />
                            );
                        }}
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
        </View>
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
        paddingHorizontal: 32,
        alignItems: "center",
    },
    emptyIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
        textAlign: "center",
    },
    emptyText: {
        textAlign: "center",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
        maxWidth: 260,
    },
    emptyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    emptyButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
