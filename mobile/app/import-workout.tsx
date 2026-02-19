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
    Animated,
    KeyboardAvoidingView,
    Platform as RNPlatform,
    Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getTheme, spacing, radii, typography, shadows } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "@/src/services/api";
import {
    getCurrentUserId,
    loadStoredUserId,
    setCurrentUserId as persistCurrentUserId,
    getCurrentUser,
} from "@/src/state/session";
import { useAdminMode } from "@/src/hooks/useAdminMode";
import { WorkoutImportPreview } from "@/src/types";
import { WORKOUT_CATEGORIES, CATEGORY_ICONS } from "@/src/constants/workoutCategories";

// --- Types & Constants ---

type Phase = "input" | "loading" | "preview" | "saving" | "success" | "error";
type DetectedPlatform = "instagram" | "youtube" | "tiktok" | null;

const PLATFORM_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
    instagram: { icon: "logo-instagram", color: "#E4405F", label: "Instagram" },
    youtube: { icon: "logo-youtube", color: "#FF0000", label: "YouTube" },
    tiktok: { icon: "logo-tiktok", color: "#000000", label: "TikTok" },
};

function detectPlatform(text: string): DetectedPlatform {
    if (/instagram\.com\/(reel|p)\//i.test(text)) return "instagram";
    if (/youtube\.com\/(watch|shorts)|youtu\.be\//i.test(text)) return "youtube";
    if (/tiktok\.com\/@.+\/video\//i.test(text)) return "tiktok";
    return null;
}

/** Strip "N likes, N comments - user on date:" prefix from IG OG descriptions */
function cleanInstagramDescription(raw: string | null | undefined): string {
    if (!raw) return "";
    const match = raw.match(/^\d+\s+likes?,\s*\d+\s+comments?\s*[-–—]\s*.+?:\s*"?(.+)"?\s*$/s);
    return match ? match[1].replace(/"$/, "").trim() : raw;
}

// --- Component ---

export default function ImportWorkoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const { isAdminModeActive } = useAdminMode();

    // State
    const [url, setUrl] = useState("");
    const [phase, setPhase] = useState<Phase>("input");
    const [detectedPlatform, setDetectedPlatform] = useState<DetectedPlatform>(null);
    const [preview, setPreview] = useState<WorkoutImportPreview | null>(null);
    const [editableTitle, setEditableTitle] = useState("");
    const [editableDescription, setEditableDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [makePublic, setMakePublic] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserIdState] = useState<string | null>(() => getCurrentUserId());
    const [existingUrls, setExistingUrls] = useState<Set<string>>(new Set());
    const [isDuplicate, setIsDuplicate] = useState(false);

    // Animation for skeleton
    const skeletonAnim = useRef(new Animated.Value(0.3)).current;
    const latestUrlRef = useRef("");

    useEffect(() => {
        // Load userId and initialize admin mode
        getCurrentUser().then((user) => {
            if (user) {
                setCurrentUserIdState(user.id);
            } else if (!currentUserId) {
                loadStoredUserId().then((storedId) => {
                    if (storedId) {
                        persistCurrentUserId(storedId);
                        setCurrentUserIdState(storedId);
                    }
                });
            }
        });
    }, []);

    // Fetch existing import URLs so we can detect duplicates
    useEffect(() => {
        if (!currentUserId) return;
        apiService.getWorkoutImports(currentUserId).then((imports) => {
            setExistingUrls(new Set(imports.map((i) => i.sourceUrl)));
        }).catch(() => {/* silently ignore – duplicate check is best-effort */});
    }, [currentUserId]);

    // Auto-detect platform and auto-preview when URL changes
    useEffect(() => {
        const trimmed = url.trim();
        const platform = detectPlatform(trimmed);
        setDetectedPlatform(platform);
        if (error) setError(null);

        // Auto-preview when a valid supported platform is detected
        if (platform && platform !== "tiktok" && trimmed.length > 0) {
            const timer = setTimeout(() => {
                handleAutoPreview(trimmed, platform);
            }, 400);
            return () => clearTimeout(timer);
        } else if (phase === "preview" || phase === "loading") {
            setPhase("input");
            setPreview(null);
        }
    }, [url]);

    // Skeleton pulse animation
    useEffect(() => {
        if (phase !== "loading") return;
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(skeletonAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(skeletonAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [phase]);

    // --- Handlers ---

    const handleAutoPreview = async (trimmedUrl: string, platform: DetectedPlatform) => {
        if (!platform || platform === "tiktok") return;

        latestUrlRef.current = trimmedUrl;
        setPhase("loading");
        setError(null);

        try {
            const previewFn =
                platform === "instagram"
                    ? apiService.previewInstagramUrl.bind(apiService)
                    : apiService.previewYouTubeUrl.bind(apiService);

            const result = await previewFn(trimmedUrl);

            // Guard against stale response if user changed URL while fetching
            if (latestUrlRef.current !== trimmedUrl) return;

            setPreview(result);
            setEditableTitle(result.title || "");
            setEditableDescription(
                result.sourcePlatform === "instagram"
                    ? cleanInstagramDescription(result.description)
                    : result.description || "",
            );
            setIsDuplicate(existingUrls.has(result.sourceUrl));
            setPhase("preview");
        } catch (err: any) {
            if (latestUrlRef.current !== trimmedUrl) return;
            console.error(`[ImportWorkout] ${platform} preview failed`, err);
            setError(err?.message || "Couldn't fetch that link. Please check the URL and try again.");
            setPhase("error");
        }
    };

    const handleSave = async () => {
        if (!preview || !currentUserId) return;

        setPhase("saving");
        try {
            await apiService.createWorkoutImport({
                userId: currentUserId,
                sourceUrl: preview.sourceUrl,
                sourcePlatform: preview.sourcePlatform,
                title: editableTitle.trim() || preview.title || null,
                description: editableDescription.trim() || preview.description || null,
                thumbnailUrl: preview.thumbnailUrl,
                html: preview.html,
                metadata: preview.metadata,
                category: selectedCategory,
                isGlobal: makePublic,
            });
            setExistingUrls((prev) => new Set(prev).add(preview.sourceUrl));
            setPhase("success");
        } catch (err: any) {
            console.error("[ImportWorkout] save failed", err);
            setError(err?.message || "Failed to save. Please try again.");
            setPhase("preview");
        }
    };

    const handleReset = () => {
        setUrl("");
        setPhase("input");
        setDetectedPlatform(null);
        setPreview(null);
        setEditableTitle("");
        setEditableDescription("");
        setSelectedCategory(null);
        setMakePublic(false);
        setError(null);
        setIsDuplicate(false);
    };

    // --- Derived ---

    const platformInfo = detectedPlatform ? PLATFORM_META[detectedPlatform] : null;
    const hasValidUrl = !!detectedPlatform && detectedPlatform !== "tiktok" && url.trim().length > 0;
    const isSaving = phase === "saving";
    const canSave = (phase === "preview" || isSaving) && !!preview && !isDuplicate;

    // --- Render helpers ---

    const renderPlatformBadge = (platform: string, size: "sm" | "md" = "sm") => {
        const info = PLATFORM_META[platform];
        if (!info) return null;
        const iconSize = size === "sm" ? 14 : 18;
        const fontSize = size === "sm" ? typography.sizes.xs : typography.sizes.sm;
        return (
            <View style={[styles.platformBadge, { backgroundColor: info.color + "18" }]}>
                <Ionicons name={info.icon} size={iconSize} color={info.color} />
                <Text style={[styles.platformBadgeText, { color: info.color, fontSize }]}>{info.label}</Text>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View style={[styles.previewCard, { backgroundColor: theme.colors.glassWhite, borderColor: theme.colors.glassBorder }]}>
            <Animated.View
                style={[styles.skeletonThumb, { backgroundColor: theme.colors.surface, opacity: skeletonAnim }]}
            />
            <View style={{ padding: spacing.md, gap: spacing.xs }}>
                <Animated.View
                    style={[styles.skeletonLine, { width: "60%", backgroundColor: theme.colors.surface, opacity: skeletonAnim }]}
                />
                <Animated.View
                    style={[styles.skeletonLine, { width: "90%", backgroundColor: theme.colors.surface, opacity: skeletonAnim }]}
                />
                <Animated.View
                    style={[styles.skeletonLine, { width: "40%", backgroundColor: theme.colors.surface, opacity: skeletonAnim }]}
                />
            </View>
        </View>
    );

    const renderPreviewCard = () => {
        if (!preview) return null;
        const platform = preview.sourcePlatform?.toLowerCase() || detectedPlatform;
        const raw = preview.metadata?.raw;
        const ogUsername = raw?.ogFallback?.ogUsername;
        const authorName = raw?.author_name || (ogUsername ? `@${ogUsername}` : null) || preview.description;
        const displayTitle = preview.title || (authorName ? `Post by ${authorName}` : null);

        // Extract reel/post type from URL for display
        const contentType = preview.sourceUrl?.includes("/reel/") ? "Reel" : "Post";
        const platformLabel = platformInfo?.label || (platform ? PLATFORM_META[platform]?.label : null) || "Social Media";

        return (
            <View style={[styles.previewCard, { backgroundColor: theme.colors.glassWhite, borderColor: theme.colors.glassBorder }, shadows.light.card]}>
                {/* Thumbnail or branded placeholder */}
                {preview.thumbnailUrl ? (
                    <View style={styles.thumbnailContainer}>
                        <Image
                            source={{ uri: preview.thumbnailUrl }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            onError={() => {
                                setPreview((prev) => prev ? { ...prev, thumbnailUrl: null } : prev);
                            }}
                        />
                        <LinearGradient
                            colors={["transparent", "rgba(41,37,33,0.5)"]}
                            style={styles.thumbnailGradient}
                        />
                        {platform && (
                            <View style={styles.thumbnailBadge}>
                                {renderPlatformBadge(platform, "md")}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.brandedPlaceholder, { backgroundColor: (platform ? PLATFORM_META[platform]?.color : theme.colors.accent) + "12" }]}>
                        <Ionicons
                            name={platform ? PLATFORM_META[platform]?.icon || "link-outline" : "link-outline"}
                            size={48}
                            color={(platform ? PLATFORM_META[platform]?.color : theme.colors.accent) + "80"}
                        />
                        <Text style={[styles.placeholderLabel, { color: (platform ? PLATFORM_META[platform]?.color : theme.colors.textTertiary) }]}>
                            {platformLabel} {contentType}
                        </Text>
                    </View>
                )}

                {/* Content */}
                <View style={styles.previewContent}>
                    {authorName && (
                        <View style={styles.authorRow}>
                            <Ionicons name="person-outline" size={14} color={theme.colors.textTertiary} />
                            <Text style={[styles.authorText, { color: theme.colors.textTertiary }]}>
                                {authorName}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.previewTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {displayTitle || `${platformLabel} ${contentType}`}
                    </Text>
                    {preview.sourceUrl && (
                        <Text style={[styles.sourceUrl, { color: theme.colors.accent }]} numberOfLines={1}>
                            {preview.sourceUrl}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderCategoryChips = () => (
        <View style={styles.categorySection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Category</Text>
            <Text style={[styles.sectionSubtext, { color: theme.colors.textTertiary }]}>
                Optional — skip if this covers multiple categories
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {/* "None" chip */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(null)}
                    style={[
                        styles.chip,
                        selectedCategory === null
                            ? { backgroundColor: theme.colors.accent }
                            : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
                    ]}
                >
                    <Ionicons
                        name="apps-outline"
                        size={16}
                        color={selectedCategory === null ? "#fff" : theme.colors.text}
                    />
                    <Text
                        style={[
                            styles.chipText,
                            { color: selectedCategory === null ? "#fff" : theme.colors.text },
                        ]}
                    >
                        None
                    </Text>
                </TouchableOpacity>

                {WORKOUT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const icon = CATEGORY_ICONS[cat];
                    return (
                        <TouchableOpacity
                            key={cat}
                            activeOpacity={0.8}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                                styles.chip,
                                isSelected
                                    ? { backgroundColor: theme.colors.accent }
                                    : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
                            ]}
                        >
                            <Ionicons name={icon} size={16} color={isSelected ? "#fff" : theme.colors.text} />
                            <Text style={[styles.chipText, { color: isSelected ? "#fff" : theme.colors.text }]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderAdminToggle = () => {
        if (!isAdminModeActive) return null;
        return (
            <View style={[styles.adminToggle, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.adminLabel, { color: theme.colors.text }]}>Make Public</Text>
                    <Text style={[styles.adminSubtext, { color: theme.colors.textTertiary }]}>
                        Visible to all users
                    </Text>
                </View>
                <Switch
                    value={makePublic}
                    onValueChange={setMakePublic}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                />
            </View>
        );
    };

    const renderSuccess = () => (
        <View style={[styles.successCard, { backgroundColor: theme.colors.success + "15", borderColor: theme.colors.success + "40" }]}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>Saved to Library</Text>
            <Text style={[styles.successSubtext, { color: theme.colors.textTertiary }]}>
                {editableTitle || preview?.title || "Your workout"} has been imported
            </Text>
            <View style={styles.successActions}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.successBtn, { backgroundColor: theme.colors.accent }]}
                    onPress={() => {
                        if (selectedCategory) {
                            router.push(`/workout?category=${encodeURIComponent(selectedCategory)}`);
                        } else {
                            router.push("/workout");
                        }
                    }}
                >
                    <Ionicons name="library-outline" size={18} color="#fff" />
                    <Text style={styles.successBtnText}>View in Library</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.successBtnOutline, { borderColor: theme.colors.border }]}
                    onPress={handleReset}
                >
                    <Ionicons name="add-outline" size={18} color={theme.colors.text} />
                    <Text style={[styles.successBtnOutlineText, { color: theme.colors.text }]}>Import Another</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- Main render ---

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Import Workout</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.content, { paddingBottom: phase === "preview" || phase === "saving" ? insets.bottom + 140 : spacing.xl }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Page headline */}
                    <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Save a workout</Text>
                    <Text style={[styles.pageSubtitle, { color: theme.colors.textTertiary }]}>
                        Paste a link from Instagram or YouTube
                    </Text>

                    {/* URL Input */}
                    <View style={styles.inputWrapper}>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    borderColor:
                                        error && phase === "error"
                                            ? theme.colors.danger
                                            : hasValidUrl
                                                ? theme.colors.success
                                                : theme.colors.border,
                                    backgroundColor: theme.colors.glassWhite,
                                },
                            ]}
                        >
                            <Ionicons name="link-outline" size={20} color={theme.colors.textTertiary} style={{ marginLeft: spacing.sm }} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Paste a workout link..."
                                placeholderTextColor={theme.colors.textTertiary}
                                value={url}
                                onChangeText={setUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                editable={phase === "input" || phase === "error" || phase === "preview"}
                            />
                            {url.length > 0 && (phase === "input" || phase === "error" || phase === "preview") && (
                                <TouchableOpacity
                                    onPress={() => { setUrl(""); setPhase("input"); setError(null); }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingRight: platformInfo ? spacing.xxs : spacing.sm }}
                                >
                                    <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                                </TouchableOpacity>
                            )}
                            {platformInfo && (
                                <View style={[styles.inputBadge, { backgroundColor: platformInfo.color + "15" }]}>
                                    <Ionicons name={platformInfo.icon} size={14} color={platformInfo.color} />
                                </View>
                            )}
                        </View>

                        {/* Helper text / TikTok banner / Error */}
                        {detectedPlatform === "tiktok" ? (
                            <View style={[styles.tiktokBanner, { backgroundColor: theme.colors.warning + "18" }]}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                                <Text style={[styles.tiktokText, { color: theme.colors.warning }]}>
                                    TikTok support is coming soon. Try an Instagram or YouTube link.
                                </Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
                                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
                            </View>
                        ) : (
                            <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>
                                Supports Instagram Reels, Posts, YouTube videos & Shorts
                            </Text>
                        )}
                    </View>

                    {/* Loading skeleton */}
                    {phase === "loading" && renderSkeleton()}

                    {/* Preview card */}
                    {(phase === "preview" || phase === "saving") && renderPreviewCard()}

                    {/* Duplicate warning */}
                    {(phase === "preview") && isDuplicate && (
                        <View style={[styles.duplicateBanner, { backgroundColor: theme.colors.warning + "18", borderColor: theme.colors.warning + "40" }]}>
                            <Ionicons name="copy-outline" size={20} color={theme.colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.duplicateTitle, { color: theme.colors.text }]}>Already in your library</Text>
                                <Text style={[styles.duplicateSubtext, { color: theme.colors.textTertiary }]}>
                                    This workout has already been imported.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Editable title & description */}
                    {(phase === "preview" || phase === "saving") && (
                        <View style={styles.editFieldsSection}>
                            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Details</Text>
                            <Text style={[styles.sectionSubtext, { color: theme.colors.textTertiary }]}>
                                Edit the title and description for your library
                            </Text>
                            <View style={[styles.editFieldContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.glassWhite }]}>
                                <TextInput
                                    style={[styles.editFieldInput, styles.editFieldTitle, { color: theme.colors.text, flex: 1 }]}
                                    value={editableTitle}
                                    onChangeText={setEditableTitle}
                                    placeholder="Workout title"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    editable={phase === "preview"}
                                    selectTextOnFocus
                                />
                                {editableTitle.length > 0 && phase === "preview" && (
                                    <TouchableOpacity
                                        onPress={() => setEditableTitle("")}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{ paddingRight: spacing.sm }}
                                    >
                                        <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={[styles.editFieldContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.glassWhite }]}>
                                <TextInput
                                    style={[styles.editFieldInput, { color: theme.colors.text, flex: 1 }]}
                                    value={editableDescription}
                                    onChangeText={setEditableDescription}
                                    placeholder="Description (optional)"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                    editable={phase === "preview"}
                                    selectTextOnFocus
                                />
                                {editableDescription.length > 0 && phase === "preview" && (
                                    <TouchableOpacity
                                        onPress={() => setEditableDescription("")}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{ paddingRight: spacing.sm, alignSelf: "flex-start", paddingTop: spacing.sm }}
                                    >
                                        <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Category chips */}
                    {(phase === "preview" || phase === "saving") && renderCategoryChips()}

                    {/* Admin toggle */}
                    {(phase === "preview" || phase === "saving") && renderAdminToggle()}

                    {/* Success state */}
                    {phase === "success" && renderSuccess()}
                </ScrollView>

                {/* Sticky save button */}
                {(phase === "preview" || phase === "saving") && (
                    <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + spacing.sm, borderTopColor: theme.colors.border, backgroundColor: theme.colors.bg }]}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[
                                styles.saveButton,
                                { backgroundColor: canSave ? theme.colors.accent : theme.colors.accent + "50" },
                            ]}
                            onPress={handleSave}
                            disabled={!canSave || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            )}
                            <Text style={styles.saveButtonText}>
                                {isSaving ? "Saving..." : "Save to Library"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

// --- Styles ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    headerTitle: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
    },
    pageTitle: {
        fontSize: typography.sizes.xl,
        fontFamily: typography.fonts.headline,
        letterSpacing: typography.letterSpacing.tight,
        lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    },
    pageSubtitle: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
        marginTop: spacing.xxs,
        marginBottom: spacing.lg,
    },

    // Input
    inputWrapper: {
        gap: spacing.xs,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderRadius: radii.md,
        overflow: "hidden",
    },
    input: {
        flex: 1,
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.body,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    inputBadge: {
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radii.sm,
        marginRight: spacing.xs,
    },
    helperText: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.body,
        marginLeft: spacing.xxs,
    },
    tiktokBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
    },
    tiktokText: {
        flex: 1,
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodyMedium,
    },
    errorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        marginLeft: spacing.xxs,
    },
    errorText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
        flex: 1,
    },

    // Editable fields
    editFieldsSection: {
        marginTop: spacing.lg,
    },
    editFieldContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: radii.md,
        marginTop: spacing.xs,
    },
    editFieldInput: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.body,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    editFieldTitle: {
        fontFamily: typography.fonts.bodySemibold,
    },

    // Preview card
    previewCard: {
        borderWidth: 1,
        borderRadius: radii.lg,
        overflow: "hidden",
        marginTop: spacing.md,
    },
    thumbnailContainer: {
        width: "100%",
        height: 200,
        position: "relative",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    thumbnailGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    thumbnailPlaceholder: {
        width: "100%",
        height: 200,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    brandedPlaceholder: {
        width: "100%",
        height: 160,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
    },
    placeholderLabel: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodySemibold,
    },
    thumbnailBadge: {
        position: "absolute",
        top: spacing.sm,
        left: spacing.sm,
    },
    previewContent: {
        padding: spacing.md,
        gap: spacing.xxs,
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
    },
    authorText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodyMedium,
    },
    previewTitle: {
        fontSize: typography.sizes.lg,
        fontFamily: typography.fonts.headlineSemibold,
        lineHeight: typography.sizes.lg * typography.lineHeights.tight,
    },
    previewDescription: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
        lineHeight: typography.sizes.sm * typography.lineHeights.normal,
        marginTop: spacing.xxs,
    },
    sourceUrl: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.body,
        marginTop: spacing.xxs,
    },

    // Platform badge
    platformBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radii.full,
    },
    platformBadgeText: {
        fontFamily: typography.fonts.bodySemibold,
    },

    // Skeleton
    skeletonThumb: {
        width: "100%",
        height: 200,
    },
    skeletonLine: {
        height: 14,
        borderRadius: radii.sm,
    },

    // Category chips
    categorySection: {
        marginTop: spacing.lg,
    },
    sectionLabel: {
        fontSize: typography.sizes.lg,
        fontFamily: typography.fonts.headline,
        letterSpacing: typography.letterSpacing.tight,
    },
    sectionSubtext: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.body,
        marginTop: spacing.xxs,
        marginBottom: spacing.sm,
    },
    chipRow: {
        flexDirection: "row",
        gap: spacing.xs,
        paddingVertical: spacing.xxs,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
    },
    chipText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodySemibold,
    },

    // Admin toggle
    adminToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.md,
    },
    adminLabel: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
    },
    adminSubtext: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.body,
        marginTop: 2,
    },

    // Duplicate banner
    duplicateBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.md,
    },
    duplicateTitle: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodySemibold,
    },
    duplicateSubtext: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.body,
        marginTop: 2,
    },

    // Success
    successCard: {
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        marginTop: spacing.md,
    },
    successTitle: {
        fontSize: typography.sizes.lg,
        fontFamily: typography.fonts.headlineSemibold,
    },
    successSubtext: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
        textAlign: "center",
    },
    successActions: {
        flexDirection: "column",
        gap: spacing.xs,
        marginTop: spacing.sm,
        width: "100%",
    },
    successBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
    },
    successBtnText: {
        color: "#fff",
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
    },
    successBtnOutline: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 1,
    },
    successBtnOutlineText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
    },

    // Sticky footer
    stickyFooter: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        minHeight: 56,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodyBold,
    },
});
