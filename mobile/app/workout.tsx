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
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { Workout, CreateWorkoutRequest } from "@/src/types";
import { WorkoutCard } from "@/src/components/WorkoutCard";
import { WorkoutDetail } from "@/src/components/WorkoutDetail";
import { WorkoutForm } from "@/src/components/WorkoutForm";
import { getCurrentUser, getCurrentUserId } from "@/src/state/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function WorkoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string; id?: string }>();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string | null>(null);
    const [selected, setSelected] = useState<Workout | undefined>();
    const [showDetail, setShowDetail] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
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

    // When an id is provided, open the workout detail after data loads
    useEffect(() => {
        const openById = async () => {
            if (typeof params?.id !== "string" || params.id.length === 0) return;
            // Try to find in the loaded list first
            const found = workouts.find((w) => w.id === params.id);
            if (found) {
                setSelected(found);
                setShowDetail(true);
                return;
            }
            // Fallback: fetch a single workout and show it
            try {
                const single = await apiService.getWorkout(params.id);
                if (single) {
                    setSelected(single);
                    setShowDetail(true);
                }
            } catch {
                // ignore
            }
        };
        openById();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.id, workouts.length]);

    const categories = Array.from(new Set(workouts.map((w) => w.category))).sort();
    const categoriesWithAll = ["All", ...categories];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByCategory = category
        ? workouts.filter((w) => w.category === category)
        : workouts;
    const filtered = normalizedQuery
        ? filteredByCategory.filter((w) => {
              const hay = `${w.title}\n${w.description ?? ""}\n${w.intensity ?? ""}`.toLowerCase();
              return hay.includes(normalizedQuery);
          })
        : filteredByCategory;

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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.colors.surface,
                        borderBottomColor: theme.colors.border,
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
                {/* Search Bar */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                    <View
                        style={[
                            styles.searchContainer,
                            { borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
                        ]}
                    >
                        <Ionicons
                            name="search-outline"
                            size={18}
                            color={theme.colors.subtext}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search workouts"
                            placeholderTextColor={theme.colors.subtext}
                            style={[styles.searchInput, { color: theme.colors.text }]}
                            returnKeyType="search"
                            autoCorrect={false}
                            autoCapitalize="none"
                            accessibilityLabel="Search workouts"
                        />
                        {searchQuery.length > 0 ? (
                            <TouchableOpacity
                                onPress={() => setSearchQuery("")}
                                accessibilityRole="button"
                                accessibilityLabel="Clear search"
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color={theme.colors.subtext}
                                />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
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
                                setSelected(item);
                                setShowDetail(true);
                            }}
                        />
                    )}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet">
                {selected && (
                    <WorkoutDetail
                        workout={selected}
                        onEdit={(updated) => {
                            // replace in list and update selection so UI reflects new data
                            setWorkouts((prev) =>
                                prev.map((w) => (w.id === updated.id ? updated : w)),
                            );
                            setSelected(updated);
                        }}
                        onDelete={() => {}}
                        onClose={() => setShowDetail(false)}
                    />
                )}
            </Modal>

            {/* Create / Edit Workout */}
            <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={{ flex: 1 }}>
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
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
});
