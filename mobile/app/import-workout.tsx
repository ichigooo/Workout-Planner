import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform as RNPlatform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme, spacing, radii } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "@/src/services/api";
import {
    getCurrentUserId,
    loadStoredUserId,
    setCurrentUserId as persistCurrentUserId,
} from "@/src/state/session";
import { useAdminMode } from "@/src/hooks/useAdminMode";
import { WorkoutImport } from "@/src/types";
import { WorkoutImportPreview } from "@/src/components/WorkoutImportPreview";

type ImportSource = "instagram" | "youtube" | "tiktok";
type ImportSourceState = {
    url: string;
    result: WorkoutImport | null;
    error: string | null;
    loading: boolean;
};

interface Platform {
    id: ImportSource;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    placeholder: string;
    exampleUrl: string;
    urlPattern: RegExp;
    instructions: string[];
}

const PLATFORMS: Platform[] = [
    {
        id: "instagram",
        name: "Instagram",
        icon: "logo-instagram",
        color: "#E4405F",
        placeholder: "https://www.instagram.com/reel/...",
        exampleUrl: "instagram.com/reel/ABC123...",
        urlPattern: /instagram\.com\/(reel|p)\//i,
        instructions: [
            "Open the Instagram app or website",
            "Find the reel you want to import",
            "Tap the three dots (...) menu",
            "Select 'Copy link'",
            "Paste the link here",
        ],
    },
    {
        id: "youtube",
        name: "YouTube",
        icon: "logo-youtube",
        color: "#FF0000",
        placeholder: "https://www.youtube.com/watch?v=...",
        exampleUrl: "youtube.com/watch?v=ABC123...",
        urlPattern: /youtube\.com\/(watch|shorts)|youtu\.be\//i,
        instructions: [
            "Open the YouTube app or website",
            "Find the video you want to import",
            "Tap the 'Share' button",
            "Select 'Copy link'",
            "Paste the link here",
        ],
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: "logo-tiktok",
        color: "#000000",
        placeholder: "https://www.tiktok.com/@user/video/...",
        exampleUrl: "tiktok.com/@user/video/123...",
        urlPattern: /tiktok\.com\/@.+\/video\//i,
        instructions: [
            "Open the TikTok app",
            "Find the video you want to import",
            "Tap the 'Share' button",
            "Select 'Copy link'",
            "Paste the link here",
        ],
    },
];

export default function ImportWorkoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewWorkout, setPreviewWorkout] = useState<WorkoutImport | null>(null);
    const [importStates, setImportStates] = useState<Record<ImportSource, ImportSourceState>>({
        instagram: { url: "", result: null, error: null, loading: false },
        youtube: { url: "", result: null, error: null, loading: false },
        tiktok: { url: "", result: null, error: null, loading: false },
    });
    const [currentUserId, setCurrentUserIdState] = useState<string | null>(() => getCurrentUserId());
    const { isAdminModeActive } = useAdminMode();

    // Animation values
    const inputHeightAnim = useRef(new Animated.Value(0)).current;
    const inputOpacityAnim = useRef(new Animated.Value(0)).current;
    const instructionsHeightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentUserId) return;
        loadStoredUserId().then((storedId) => {
            if (storedId) {
                persistCurrentUserId(storedId);
                setCurrentUserIdState(storedId);
            }
        });
    }, [currentUserId]);


    // Animate input field when platform is selected/deselected
    useEffect(() => {
        if (selectedSource) {
            Animated.parallel([
                Animated.timing(inputHeightAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(inputOpacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(inputHeightAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(inputOpacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [selectedSource]);

    // Animate instructions panel
    useEffect(() => {
        Animated.timing(instructionsHeightAnim, {
            toValue: showInstructions ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showInstructions]);

    const updateImportState = (source: ImportSource, next: Partial<ImportSourceState>) => {
        setImportStates((prev) => ({
            ...prev,
            [source]: {
                ...prev[source],
                ...next,
            },
        }));
    };

    const validateUrl = (url: string, platform: Platform): boolean => {
        if (!url.trim()) return false;
        return platform.urlPattern.test(url);
    };

    const handlePlatformSelect = (platformId: ImportSource) => {
        if (selectedSource === platformId) {
            // Deselect if already selected
            setSelectedSource(null);
            setShowInstructions(false);
        } else {
            setSelectedSource(platformId);
            // Clear previous errors when switching platforms
            updateImportState(platformId, { error: null });
        }
    };

    const handleImport = async (source: ImportSource) => {
        if (source === "tiktok" || source === "instagram") {
            Alert.alert("Coming Soon", `${source === "tiktok" ? "TikTok" : "Instagram"} imports will be available soon!`);
            return;
        }

        const state = importStates[source];
        const trimmed = state.url.trim();
        const platform = PLATFORMS.find((p) => p.id === source);

        if (!trimmed) {
            updateImportState(source, { error: "Please paste a valid link." });
            return;
        }

        if (platform && !validateUrl(trimmed, platform)) {
            updateImportState(source, {
                error: `Please enter a valid ${platform.name} URL.`,
            });
            return;
        }

        const userId = currentUserId;
        if (!userId) {
            Alert.alert("Please sign in again", "We need your account to save the import.");
            return;
        }

        updateImportState(source, { error: null, loading: true });
        try {
            let result: WorkoutImport;
            // Only YouTube is currently supported
            result = await apiService.importWorkoutFromYouTube({ userId, url: trimmed });
            updateImportState(source, { result, loading: false });

            // Show preview modal instead of auto-saving
            setPreviewWorkout(result);
            setShowPreview(true);
        } catch (err: any) {
            console.error(`[ImportWorkout] ${source} import failed`, err);
            const message =
                err?.message ||
                "We couldn't fetch that link. Please verify the URL and try again.";
            updateImportState(source, { error: message, loading: false });
        }
    };

    const handleConfirmImport = async (category: string, makePublic: boolean) => {
        if (!previewWorkout || !currentUserId) {
            console.log("[ImportWorkout] Missing previewWorkout or currentUserId", {
                previewWorkout,
                currentUserId,
            });
            return;
        }

        console.log("[ImportWorkout] Confirming import with category:", category, "isGlobal:", makePublic);
        console.log("[ImportWorkout] Preview workout:", previewWorkout);

        try {
            // Since the backend doesn't support updating workout imports,
            // we need to create a new import with the selected category
            console.log("[ImportWorkout] Creating new import with category:", category);

            // Use the appropriate import method based on platform
            const platform = previewWorkout.sourcePlatform?.toLowerCase();
            let finalWorkout: WorkoutImport;

            if (platform?.includes("youtube")) {
                finalWorkout = await apiService.importWorkoutFromYouTube({
                    userId: currentUserId,
                    url: previewWorkout.sourceUrl,
                    category: category,
                    isGlobal: makePublic,
                });
            } else if (platform?.includes("instagram")) {
                finalWorkout = await apiService.importWorkoutFromInstagram({
                    userId: currentUserId,
                    url: previewWorkout.sourceUrl,
                    category: category,
                    isGlobal: makePublic,
                });
            } else {
                // Generic import
                finalWorkout = await apiService.importWorkoutFromYouTube({
                    userId: currentUserId,
                    url: previewWorkout.sourceUrl,
                    category: category,
                    isGlobal: makePublic,
                });
            }

            console.log("[ImportWorkout] Import successful with category:", finalWorkout);

            // Close preview modal
            setShowPreview(false);
            setPreviewWorkout(null);

            // Show success feedback
            Alert.alert("Success!", "Workout saved to your library", [
                {
                    text: "View Library",
                    onPress: () => {
                        router.push(`/workout?category=${encodeURIComponent(category)}`);
                    },
                },
                {
                    text: "Import Another",
                    onPress: () => {
                        // Reset the form
                        if (selectedSource) {
                            handleClearUrl(selectedSource);
                        }
                    },
                },
            ]);
        } catch (err: any) {
            console.error("[ImportWorkout] Failed to save workout - Full error:", err);
            console.error("[ImportWorkout] Error message:", err?.message);
            console.error("[ImportWorkout] Error status:", err?.status);
            console.error("[ImportWorkout] Error stack:", err?.stack);
            Alert.alert(
                "Error",
                `Failed to save workout: ${err?.message || "Unknown error"}. Please try again.`,
            );
        }
    };

    const handleCancelPreview = () => {
        setShowPreview(false);
        setPreviewWorkout(null);
    };

    const handleClearUrl = (source: ImportSource) => {
        updateImportState(source, { url: "", error: null, result: null });
    };

    const selectedPlatform = PLATFORMS.find((p) => p.id === selectedSource);
    const selectedState = selectedSource ? importStates[selectedSource] : null;
    const isUrlValid = selectedPlatform && selectedState
        ? validateUrl(selectedState.url, selectedPlatform)
        : false;

    return (
        <View style={[styles.screenBackground, { backgroundColor: theme.colors.bg }]}>
            <KeyboardAvoidingView
                behavior={RNPlatform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={RNPlatform.OS === "ios" ? 0 : 0}
            >
                <View
                    style={[
                        styles.container,
                        { paddingTop: insets.top, backgroundColor: "transparent" },
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Text style={[styles.backText, { color: theme.colors.accent }]}>
                                ‹ Back
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Import Workout</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: insets.bottom + 40 },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Section Header */}
                    <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
                        Choose your source
                    </Text>
                    <Text style={[styles.sectionSubtext, { color: theme.colors.subtext }]}>
                        Select where you found the workout
                    </Text>

                    {/* Platform Cards */}
                    <View style={styles.platformCards}>
                        {PLATFORMS.map((platform) => {
                            const isSelected = selectedSource === platform.id;

                            return (
                                <TouchableOpacity
                                    key={platform.id}
                                    style={[
                                        styles.platformCard,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: isSelected
                                                ? theme.colors.accent
                                                : theme.colors.border,
                                            borderWidth: isSelected ? 2 : 1,
                                        },
                                        isSelected && styles.platformCardSelected,
                                    ]}
                                    onPress={() => handlePlatformSelect(platform.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.platformCardContent}>
                                        <View
                                            style={[
                                                styles.platformIconContainer,
                                                {
                                                    backgroundColor: isSelected
                                                        ? `${platform.color}15`
                                                        : theme.colors.border,
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name={platform.icon}
                                                size={32}
                                                color={isSelected ? platform.color : theme.colors.text}
                                            />
                                        </View>
                                        <View style={styles.platformInfo}>
                                            <Text
                                                style={[
                                                    styles.platformName,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {platform.name}
                                            </Text>
                                            {(platform.id === "tiktok" || platform.id === "instagram") && (
                                                <Text
                                                    style={[
                                                        styles.comingSoonBadge,
                                                        { color: theme.colors.subtext },
                                                    ]}
                                                >
                                                    Coming soon
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={24}
                                                color={theme.colors.accent}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Animated Input Section */}
                    {selectedPlatform && (
                        <Animated.View
                            style={[
                                styles.inputSection,
                                {
                                    maxHeight: inputHeightAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 1000],
                                    }),
                                    opacity: inputOpacityAnim,
                                },
                            ]}
                        >
                            {/* Help Button */}
                            <TouchableOpacity
                                style={styles.helpButton}
                                onPress={() => setShowInstructions(!showInstructions)}
                            >
                                <Ionicons
                                    name="help-circle-outline"
                                    size={20}
                                    color={theme.colors.accent}
                                />
                                <Text style={[styles.helpButtonText, { color: theme.colors.accent }]}>
                                    How to get the link
                                </Text>
                                <Ionicons
                                    name={showInstructions ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={theme.colors.accent}
                                />
                            </TouchableOpacity>

                            {/* Instructions Panel */}
                            {showInstructions && (
                                <Animated.View
                                    style={[
                                        styles.instructionsPanel,
                                        {
                                            backgroundColor: `${theme.colors.accent}10`,
                                            borderColor: theme.colors.accent,
                                        },
                                    ]}
                                >
                                    {selectedPlatform.instructions.map((instruction, index) => (
                                        <View key={index} style={styles.instructionItem}>
                                            <View
                                                style={[
                                                    styles.instructionNumber,
                                                    { backgroundColor: theme.colors.accent },
                                                ]}
                                            >
                                                <Text style={styles.instructionNumberText}>
                                                    {index + 1}
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.instructionText,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {instruction}
                                            </Text>
                                        </View>
                                    ))}
                                </Animated.View>
                            )}

                            {/* URL Input Label */}
                            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                                Paste your {selectedPlatform.name} link
                            </Text>

                            {/* URL Input Field with Clear Button */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: selectedState?.error
                                                ? theme.colors.danger
                                                : isUrlValid
                                                ? "#4CAF50"
                                                : theme.colors.border,
                                            backgroundColor: theme.colors.surface,
                                            color: theme.colors.text,
                                        },
                                    ]}
                                    placeholder={selectedPlatform.placeholder}
                                    placeholderTextColor={theme.colors.subtext}
                                    value={selectedState?.url || ""}
                                    onChangeText={(text) =>
                                        updateImportState(selectedPlatform.id, {
                                            url: text,
                                            error: null,
                                        })
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                />
                                {selectedState?.url ? (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => handleClearUrl(selectedPlatform.id)}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={theme.colors.subtext}
                                        />
                                    </TouchableOpacity>
                                ) : null}
                                {isUrlValid && (
                                    <View style={styles.validIcon}>
                                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                    </View>
                                )}
                            </View>

                            {/* Example Format */}
                            <Text style={[styles.exampleText, { color: theme.colors.subtext }]}>
                                Example: {selectedPlatform.exampleUrl}
                            </Text>

                            {/* Error Message */}
                            {selectedState?.error && (
                                <View style={styles.errorContainer}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={16}
                                        color={theme.colors.danger}
                                    />
                                    <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                                        {selectedState.error}
                                    </Text>
                                </View>
                            )}

                            {/* Import Button */}
                            <TouchableOpacity
                                style={[
                                    styles.importButton,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity:
                                            selectedState?.loading || !isUrlValid ? 0.5 : 1,
                                    },
                                ]}
                                onPress={() => handleImport(selectedPlatform.id)}
                                disabled={selectedState?.loading || !isUrlValid}
                            >
                                {selectedState?.loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.importButtonText}>Importing...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.importButtonText}>Import Workout</Text>
                                )}
                            </TouchableOpacity>

                            {/* Success Preview Card */}
                            {selectedState?.result && (
                                <View
                                    style={[
                                        styles.previewCard,
                                        {
                                            borderColor: theme.colors.accent,
                                            backgroundColor: theme.colors.surface,
                                        },
                                    ]}
                                >
                                    <View style={styles.previewHeader}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="#4CAF50"
                                        />
                                        <Text
                                            style={[
                                                styles.previewHeaderText,
                                                { color: "#4CAF50" },
                                            ]}
                                        >
                                            Successfully imported!
                                        </Text>
                                    </View>
                                    <View style={styles.previewContent}>
                                        {selectedState.result.thumbnailUrl && (
                                            <Image
                                                source={{ uri: selectedState.result.thumbnailUrl }}
                                                style={styles.previewImage}
                                            />
                                        )}
                                        <View style={styles.previewInfo}>
                                            <Text
                                                style={[
                                                    styles.previewTitle,
                                                    { color: theme.colors.text },
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {selectedState.result.title || "Imported workout"}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.previewDescription,
                                                    { color: theme.colors.subtext },
                                                ]}
                                                numberOfLines={3}
                                            >
                                                {selectedState.result.description ||
                                                    selectedState.result.metadata?.description ||
                                                    "No description available"}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.previewUrl,
                                                    { color: theme.colors.accent },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {selectedState.result.sourceUrl}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </ScrollView>
            </View>
            </KeyboardAvoidingView>

            {/* Preview Modal */}
            <WorkoutImportPreview
                visible={showPreview}
                workout={previewWorkout}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelPreview}
                isAdmin={isAdminModeActive}
            />
        </View>
    );
}

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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 60,
    },
    backText: {
        fontSize: 16,
        fontWeight: "600",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: spacing.xs,
        letterSpacing: 0.3,
    },
    sectionSubtext: {
        fontSize: 15,
        marginBottom: spacing.lg,
    },
    platformCards: {
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    platformCard: {
        borderRadius: radii.lg,
        padding: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    platformCardSelected: {
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    platformCardContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    platformIconContainer: {
        width: 56,
        height: 56,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    platformInfo: {
        flex: 1,
    },
    platformName: {
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    comingSoonBadge: {
        fontSize: 12,
        marginTop: spacing.xxs,
        fontStyle: "italic",
    },
    inputSection: {
        overflow: "hidden",
    },
    helpButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    helpButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    instructionsPanel: {
        borderRadius: radii.md,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    instructionItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    instructionNumberText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: spacing.xs,
    },
    inputContainer: {
        position: "relative",
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 2,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        paddingRight: 44,
    },
    clearButton: {
        position: "absolute",
        right: spacing.sm,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    validIcon: {
        position: "absolute",
        right: spacing.sm,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    exampleText: {
        fontSize: 13,
        marginBottom: spacing.md,
        fontStyle: "italic",
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    errorText: {
        fontSize: 14,
        flex: 1,
    },
    importButton: {
        borderRadius: radii.xl,
        paddingVertical: spacing.md,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    importButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    previewCard: {
        borderWidth: 2,
        borderRadius: radii.lg,
        padding: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    previewHeaderText: {
        fontSize: 15,
        fontWeight: "600",
    },
    previewContent: {
        flexDirection: "row",
        gap: spacing.md,
    },
    previewImage: {
        width: 96,
        height: 96,
        borderRadius: radii.md,
        backgroundColor: "#00000015",
    },
    previewInfo: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: spacing.xxs,
    },
    previewDescription: {
        fontSize: 14,
        lineHeight: 18,
        marginBottom: spacing.xs,
    },
    previewUrl: {
        fontSize: 12,
        fontWeight: "500",
    },
});
