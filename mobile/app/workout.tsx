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
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { Workout, CreateWorkoutRequest } from "@/src/types";
import { WorkoutCard } from "@/src/components/WorkoutCard";
import { WorkoutForm } from "@/src/components/WorkoutForm";
import { getCurrentUser, getCurrentUserId } from "@/src/state/session";
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
                if (mounted && current) {
                    setIsAdmin(Boolean(current.isAdmin));
                    return;
                }
                // Fallback: if only an id is available, fetch it
                const id = getCurrentUserId();
                if (id) {
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

    // Initialize category from query param
    useEffect(() => {
        if (typeof params?.category === "string" && params.category.length > 0) {
            setCategory(params.category);
        }
        // After setting category, attempt to center the selected chip
        const idx =
            typeof params?.category === "string" && params.category.length > 0
                ? Math.max(
                      0,
                      categories.findIndex((c) => c === (params.category as any)),
                  ) + 1
                : 0;
        // Defer to next frame to ensure FlatList ref is measured
        requestAnimationFrame(() => {
            try {
                chipListRef.current?.scrollToIndex?.({
                    index: idx,
                    animated: true,
                    viewPosition: 0.5,
                });
            } catch {}
        });
    }, [params?.category]);

    // When an id is provided, navigate to workout detail
    useEffect(() => {
        if (typeof params.id === "string" && params.id.length > 0) {
            router.push(`/workout-detail?id=${encodeURIComponent(params.id)}`);
        }
    }, [params?.id, router]);

    const categories = orderCategoriesWithClimbingAtEnd(
        Array.from(new Set(workouts.map((w) => w.category))),
    );
    const categoriesWithAll = ["All", ...categories];
    const filteredByCategory = category
        ? workouts.filter((w) => w.category === category)
        : workouts;
    const filtered = filteredByCategory;

    // After data/categories are ready, auto-scroll the chip list to the selected category
    useEffect(() => {
        try {
            const idx =
                category && categories.length > 0
                    ? Math.max(
                          0,
                          categories.findIndex((c) => c === (category as any)),
                      ) + 1 // +1 accounts for "All"
                    : 0;
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
    }, [category, categories.length]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.cream }]}>
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.colors.surface,
                        borderBottomColor: theme.colors.border,
                        paddingTop: insets.top,
                    },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.colors.accent }]}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Workout</Text>
                {isAdmin ? (
                    <TouchableOpacity
                        onPress={() => setShowForm(true)}
                        style={[styles.addBtn, { borderColor: theme.colors.accent }]}
                        accessibilityRole="button"
                        accessibilityLabel="Add workout"
                    >
                        <Text style={[styles.addBtnText, { color: theme.colors.accent }]}>Add</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            <View
                style={[
                    styles.filterBar,
                    {
                        backgroundColor: theme.colors.surface,
                        borderBottomColor: theme.colors.border,
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
                                        : theme.colors.bg,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    {
                                        color: (
                                            item === "All" ? category === null : category === item
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
                            const idx = category
                                ? Math.max(
                                      0,
                                      categories.findIndex((c) => c === (category as any)),
                                  ) + 1
                                : 0;
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

            {loading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: theme.colors.subtext }}>Loading workouts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <WorkoutCard
                            workout={item}
                            onPress={() => {
                                router.push(`/workout-detail?id=${encodeURIComponent(item.id)}`);
                            }}
                        />
                    )}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    showsVerticalScrollIndicator={false}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { width: 60 },
    backText: { fontSize: 16, fontWeight: "600" },
    title: { fontSize: 18, fontWeight: "700" },
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
});
