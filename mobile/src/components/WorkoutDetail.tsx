import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    useColorScheme,
    Alert,
    Modal,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Workout, CreateWorkoutRequest, WorkoutPersonalRecord } from "../types";
import { getTheme } from "../theme";
import { apiService } from "../services/api";
import { getCurrentPlanId, getCurrentUserId, getCurrentUser } from "../state/session";
import { WorkoutForm } from "./WorkoutForm";
import { planItemsCache } from "../services/planItemsCache";
import { useRouter } from "expo-router";

interface WorkoutDetailProps {
    workout: Workout;
    onEdit: (updated: Workout) => void;
    onDelete: () => void;
    onClose: () => void;
}

export const WorkoutDetail: React.FC<WorkoutDetailProps> = ({
    workout,
    onEdit,
    onDelete,
    onClose,
}) => {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    // Menu state
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    // Add to plan sheet state
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [selectedDates, setSelectedDates] = useState<{ [key: string]: any }>({});
    const [planId, setPlanId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const windowWidth = Dimensions.get("window").width;
    const heroHeight = Math.round(windowWidth * 0.75);
    const heroImages = useMemo(
        () => [workout.imageUrl, workout.imageUrl2].filter(Boolean) as string[],
        [workout.imageUrl, workout.imageUrl2],
    );
    const [personalRecord, setPersonalRecord] = useState<WorkoutPersonalRecord | null>(null);
    const [personalRecordValue, setPersonalRecordValue] = useState("");
    const [recordLoading, setRecordLoading] = useState(false);
    const [recordSaving, setRecordSaving] = useState(false);
    const [recordUserId, setRecordUserId] = useState<string | null>(() => getCurrentUserId());
    const [isEditingRecord, setIsEditingRecord] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // Try to get current user from session first
                const current = await getCurrentUser();
                if (!mounted) return;
                if (current) {
                    setIsCurrentUserAdmin(Boolean(current.isAdmin));
                    return;
                }
                // Fallback: if only an id is available, fetch it
                const userId = getCurrentUserId();
                if (userId) {
                    const u = await apiService.getUserProfile(userId);
                    if (!mounted) return;
                    setIsCurrentUserAdmin(Boolean(u?.isAdmin));
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsCurrentUserAdmin(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        setRecordUserId(getCurrentUserId());
    }, []);

    useEffect(() => {
        const userId = recordUserId;
        if (!userId) {
            setPersonalRecord(null);
            setPersonalRecordValue("");
            return;
        }
        let cancelled = false;
        setRecordLoading(true);
        apiService
            .getPersonalRecord(workout.id, userId)
            .then((record) => {
                if (cancelled) return;
                setPersonalRecord(record);
                setPersonalRecordValue(record?.value ?? "");
                setIsEditingRecord(false);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error("Failed to load personal record", error);
            })
            .finally(() => {
                if (!cancelled) setRecordLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [workout.id, recordUserId]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [heroImages.length]);

    const _handleLogWorkout = () => {
        Alert.alert("Saved", "Notes saved.");
    };

    const handleEditPress = () => {
        setShowMenu(false);
        // open inline edit modal
        setShowEditModal(true);
    };

    const handleSavePersonalRecord = async () => {
        const userId = recordUserId || getCurrentUserId();
        if (!userId) {
            Alert.alert("Unavailable", "Please sign in to save a personal record.");
            return;
        }
        try {
            setRecordSaving(true);
            const trimmed = personalRecordValue.trim();
            if (!trimmed) {
                await apiService.deletePersonalRecord(workout.id, userId);
                setPersonalRecord(null);
                setPersonalRecordValue("");
                setIsEditingRecord(false);
                Alert.alert("Removed", "Personal record cleared.");
            } else {
                const updated = await apiService.upsertPersonalRecord(workout.id, userId, trimmed);
                setPersonalRecord(updated);
                setPersonalRecordValue(updated.value);
                setIsEditingRecord(false);
                Alert.alert("Saved", "Personal record updated.");
            }
        } catch (error) {
            console.error("Failed to save personal record", error);
            Alert.alert("Error", "Unable to save your personal record right now.");
        } finally {
            setRecordSaving(false);
        }
    };

    const handleClearPersonalRecord = async () => {
        const userId = recordUserId || getCurrentUserId();
        if (!userId) {
            Alert.alert("Unavailable", "Please sign in first.");
            return;
        }
        try {
            setRecordSaving(true);
            await apiService.deletePersonalRecord(workout.id, userId);
            setPersonalRecord(null);
            setPersonalRecordValue("");
            setIsEditingRecord(false);
            Alert.alert("Removed", "Personal record cleared.");
        } catch (error) {
            console.error("Failed to clear personal record", error);
            Alert.alert("Error", "Unable to clear your personal record right now.");
        } finally {
            setRecordSaving(false);
        }
    };

    const handleDeletePress = () => {
        setShowMenu(false);
        Alert.alert(
            "Delete workout",
            "This will remove the workout from the library for everyone. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.deleteWorkout(workout.id);
                            Alert.alert("Deleted", "Workout removed.");
                            onDelete();
                        } catch (error) {
                            console.error("Failed to delete workout", error);
                            Alert.alert(
                                "Error",
                                "Unable to delete the workout right now. Please try again.",
                            );
                        }
                    },
                },
            ],
        );
    };

    const openAddSheet = async () => {
        setShowAddSheet(true);
        const cachedPlanId = getCurrentPlanId();
        setPlanId(cachedPlanId!);
    };

    const handleAddToPlan = async () => {
        if (!planId) {
            Alert.alert("No plan", "No plan available to add to");
            return;
        }
        const dates = Object.keys(selectedDates);
        if (dates.length === 0) {
            Alert.alert("No dates selected", "Please select at least one date");
            return;
        }
        try {
            setAdding(true);
            await apiService.addWorkoutToPlanOnDates(planId, { workoutId: workout.id, dates });
            // refresh cache
            try {
                await planItemsCache.getCachedItems();
            } catch (e) {
                console.warn("Failed to refresh plan items cache", e);
            }
            setShowAddSheet(false);
            setSelectedDates({});
            Alert.alert("Added", `Workout added to ${dates.length} date(s)`);
        } catch (e) {
            console.error("Add to plan failed", e);
            Alert.alert("Error", "Failed to add workout to plan");
        } finally {
            setAdding(false);
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: "transparent",
                        paddingTop: insets.top + 4,
                    },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.subtext }]}>Workout</Text>
                {isCurrentUserAdmin ? (
                    <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
                        <Text style={[styles.menuButtonText, { color: theme.colors.text }]}>⋯</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.menuButton} />
                )}
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 32,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {heroImages.length > 0 && (
                        <View style={[styles.heroContainer, { height: heroHeight }]}>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(event) => {
                                    const index = Math.round(
                                        event.nativeEvent.contentOffset.x / windowWidth,
                                    );
                                    setActiveImageIndex(index);
                                }}
                            >
                                {heroImages.map((uri, index) => (
                                    <Image
                                        key={`${uri}-${index}`}
                                        source={{ uri }}
                                        style={[
                                            styles.heroImage,
                                            { width: windowWidth, height: heroHeight },
                                        ]}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                            {heroImages.length > 1 && (
                                <View style={styles.imagePagination}>
                                    {heroImages.map((_, index) => (
                                        <View
                                            key={`dot-${index}`}
                                            style={[
                                                styles.imageDot,
                                                index === activeImageIndex && styles.imageDotActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.body}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryPillText}>{workout.category}</Text>
                        </View>

                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            {workout.title}
                        </Text>

                        {workout.description && (
                            <View style={styles.section}>
                                <Text style={[styles.description, { color: theme.colors.subtext }]}>
                                    {workout.description}
                                </Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <View style={styles.detailPillRow}>
                                {workout.workoutType === "cardio" ? (
                                    <>
                                        <View
                                            style={[
                                                styles.detailPill,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.detailPillLabel,
                                                    { color: theme.colors.subtext },
                                                ]}
                                            >
                                                Duration
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.detailPillValue,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {workout.duration} min
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.detailPill,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.detailPillLabel,
                                                    { color: theme.colors.subtext },
                                                ]}
                                            >
                                                Intensity
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.detailPillValue,
                                                    { color: theme.colors.text },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {workout.intensity}
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View
                                            style={[
                                                styles.detailPill,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.detailPillLabel,
                                                    { color: theme.colors.subtext },
                                                ]}
                                            >
                                                Sets
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.detailPillValue,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {workout.sets}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.detailPill,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.detailPillLabel,
                                                    { color: theme.colors.subtext },
                                                ]}
                                            >
                                                Reps
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.detailPillValue,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {workout.reps}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.detailPill,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.detailPillLabel,
                                                    { color: theme.colors.subtext },
                                                ]}
                                            >
                                                Intensity
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.detailPillValue,
                                                    { color: theme.colors.text },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {workout.intensity}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                My personal record
                            </Text>
                            {personalRecord && !isEditingRecord ? (
                                <>
                                    <Text
                                        style={[
                                            styles.personalRecordValue,
                                            { color: theme.colors.text },
                                        ]}
                                    >
                                        {personalRecord.value}
                                    </Text>
                                    <View style={styles.recordActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.recordButton,
                                                styles.recordButtonSecondary,
                                                { borderColor: theme.colors.border, flex: undefined },
                                            ]}
                                            onPress={() => setIsEditingRecord(true)}
                                        >
                                            <Text
                                                style={[
                                                    styles.recordButtonSecondaryText,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                Update
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.recordButton,
                                                styles.recordButtonSecondary,
                                                { borderColor: theme.colors.border, flex: undefined },
                                            ]}
                                            onPress={handleClearPersonalRecord}
                                            disabled={recordSaving}
                                        >
                                            <Text
                                                style={[
                                                    styles.recordButtonSecondaryText,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                Clear
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <TextInput
                                        style={[
                                            styles.personalRecordInput,
                                            {
                                                borderColor: theme.colors.border,
                                                color: theme.colors.text,
                                                backgroundColor: theme.colors.surface,
                                            },
                                        ]}
                                        placeholder="e.g., 25 lb"
                                        placeholderTextColor={theme.colors.subtext}
                                        value={personalRecordValue}
                                        onChangeText={setPersonalRecordValue}
                                        editable={!recordSaving && Boolean(recordUserId)}
                                    />
                                    <Text
                                        style={[
                                            styles.personalRecordHint,
                                            { color: theme.colors.subtext },
                                        ]}
                                    >
                                        {recordLoading
                                            ? "Loading your record..."
                                            : "Track your best set, rep, or time so you always know what to beat."}
                                    </Text>
                                    <View style={styles.recordActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.recordButton,
                                                styles.recordButtonSecondary,
                                                { borderColor: theme.colors.border },
                                            ]}
                                            onPress={handleSavePersonalRecord}
                                            disabled={recordSaving || !recordUserId}
                                        >
                                            <Text
                                                style={[
                                                    styles.recordButtonSecondaryText,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {recordSaving ? "Saving..." : "Save record"}
                                            </Text>
                                        </TouchableOpacity>
                                        {personalRecord ? (
                                            <TouchableOpacity
                                                style={[
                                                    styles.recordButton,
                                                    styles.recordButtonSecondary,
                                                    { borderColor: theme.colors.border },
                                                ]}
                                                onPress={() => {
                                                    setIsEditingRecord(false);
                                                    setPersonalRecordValue(
                                                        personalRecord?.value ?? "",
                                                    );
                                                }}
                                                disabled={recordSaving}
                                            >
                                                <Text
                                                    style={[
                                                        styles.recordButtonSecondaryText,
                                                        { color: theme.colors.text },
                                                    ]}
                                                >
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </>
                            )}
                            {!recordUserId && (
                                <Text
                                    style={[
                                        styles.personalRecordHint,
                                        { color: theme.colors.subtext },
                                    ]}
                                >
                                    Sign in to save personal records.
                                </Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View
                        style={[
                            styles.menuContainer,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={handleEditPress}
                        >
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                                Edit Workout
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={handleDeletePress}>
                            <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>
                                Delete Workout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            {/* Edit workout modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={{ flex: 1 }}>
                    <WorkoutForm
                        workout={workout}
                        onCancel={() => setShowEditModal(false)}
                        onSubmit={async (payload: CreateWorkoutRequest) => {
                            try {
                                // call API to update workout
                                await apiService.updateWorkout(workout.id, payload);
                                // refresh workout details by fetching again
                                const refreshed = await apiService.getWorkout(workout.id);
                                // notify parent with updated workout so it can refresh UI state
                                onEdit(refreshed);
                                setShowEditModal(false);
                                // Optionally update UI immediately (not wired here)
                                Alert.alert("Updated", "Workout updated successfully");
                            } catch (e) {
                                console.error("Failed to update workout", e);
                                Alert.alert("Error", "Failed to update workout");
                            }
                        }}
                    />
                </View>
            </Modal>
            <Modal
                visible={showAddSheet}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddSheet(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}>
                    <View
                        style={[
                            styles.modalHeader,
                            {
                                borderBottomColor: theme.colors.border,
                                backgroundColor: theme.colors.surface,
                            },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            Add to Plan
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddSheet(false)}>
                            <Text style={{ color: theme.colors.accent }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>
                            Select Dates
                        </Text>
                        <Calendar
                            onDayPress={(day) => {
                                const dateString = day.dateString;
                                setSelectedDates((prev) => {
                                    const newDates = { ...prev };
                                    if (newDates[dateString]) delete newDates[dateString];
                                    else
                                        newDates[dateString] = {
                                            selected: true,
                                            selectedColor: theme.colors.accent,
                                        };
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
                            }}
                            style={{ marginVertical: 8 }}
                        />

                        <TouchableOpacity
                            onPress={handleAddToPlan}
                            disabled={adding}
                            style={[
                                styles.addButton,
                                { backgroundColor: theme.colors.accent, marginTop: 12 },
                            ]}
                        >
                            <Text style={styles.addButtonText}>
                                {adding ? "Adding..." : "Add to Plan"}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "500",
    },
    menuButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    menuButtonText: {
        fontSize: 20,
        fontWeight: "600",
    },
    content: {
        flex: 1,
    },
    heroContainer: {
        width: "100%",
        position: "relative",
        backgroundColor: "#111827",
        marginBottom: 16,
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroPlaceholder: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1f2937",
    },
    heroPlaceholderText: {
        color: "#9CA3AF",
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    imagePagination: {
        position: "absolute",
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
        zIndex: 1,
    },
    imageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(0, 0, 0, 0.25)",
    },
    imageDotActive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#111827",
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 12,
    },
    category: {
        fontSize: 16,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 20,
    },
    categoryPill: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: "transparent",
        borderColor: "#D1D5DB",
        marginBottom: 10,
    },
    categoryPillText: {
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.3,
        color: "#4B5563",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    detailsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
    },
    detailPillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
        gap: 8,
    },
    detailPill: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        marginHorizontal: 6,
        marginBottom: 8,
    },
    detailPillLabel: {
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 2,
    },
    detailPillValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    personalRecordInput: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginTop: 4,
    },
    personalRecordHint: {
        fontSize: 13,
        marginTop: 6,
    },
    recordActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    recordButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flex: 1,
    },
    recordButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
    recordButtonSecondary: {
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: "transparent",
    },
    recordButtonSecondaryText: {
        fontSize: 15,
        fontWeight: "600",
    },
    personalRecordDisplay: {
        padding: 16,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    personalRecordValue: {
        fontSize: 20,
        fontWeight: "700",
    },
    addToPlanButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 24,
    },
    addToPlanButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
        gap: 8,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    editButton: {
        // backgroundColor set dynamically
    },
    deleteButton: {
        // backgroundColor set dynamically
    },
    actionButtonText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    // Tracker styles
    timerContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        marginBottom: 12,
    },
    timerText: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 12,
        fontFamily: "monospace",
    },
    timerButtons: {
        flexDirection: "row",
        gap: 8,
    },
    timerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    timerButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    setsContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    setsTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    setsProgress: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    setsText: {
        fontSize: 16,
        fontWeight: "500",
    },
    completeSetButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    completeSetText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    inputsContainer: {
        marginBottom: 12,
    },
    inputRow: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    logButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
    },
    logButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    // Menu styles
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
        paddingTop: 60,
        paddingRight: 16,
    },
    menuContainer: {
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 160,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    menuItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: "500",
    },
    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    placeholder: {
        width: 32,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    workoutTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 24,
        textAlign: "center",
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    plansSelector: {
        marginBottom: 8,
    },
    planOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 100,
        alignItems: "center",
    },
    planOptionText: {
        fontSize: 14,
        fontWeight: "600",
    },
    frequencyInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    helpText: {
        fontSize: 12,
        fontStyle: "italic",
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginRight: 12,
    },
    addButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginLeft: 12,
    },
    cancelButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});
