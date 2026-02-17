import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Linking,
    Pressable,
    useColorScheme,
    Image,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography, hexToRgba } from "../theme";

interface WarmUpModalProps {
    visible: boolean;
    onClose: () => void;
}

type WarmUpVideo = {
    title: string;
    url: string;
    category: string;
};

const extractYouTubeVideoId = (url: string): string | null => {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return shortsMatch[1];
    const standardMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (standardMatch) return standardMatch[1];
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    return null;
};

const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const WarmUpModal: React.FC<WarmUpModalProps> = ({ visible, onClose }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [selectedVideo, setSelectedVideo] = useState<WarmUpVideo | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [thumbnailLoading, setThumbnailLoading] = useState(true);

    const warmUpVideos: WarmUpVideo[] = [
        {
            title: "Simple Leg Day Warm Up!",
            url: "https://youtube.com/shorts/-3t7rSIC-z8?si=kperCDnbHHFEnLYg",
            category: "Lower Body",
        },
        {
            title: "DO THIS WARM UP BEFORE UPPER BODY DAY",
            url: "https://youtube.com/shorts/_P58Wi1Kw1w?si=6pw_RKz0qxHNzDEj",
            category: "Upper Body",
        },
        {
            title: "Dynamic warmups for runners",
            url: "https://youtube.com/shorts/h4GfPtYFe0o?si=dPEXiRbMh09r75R_",
            category: "Running",
        },
        {
            title: "Lower Body Warm Up Before Workout",
            url: "https://youtube.com/shorts/Ok6hdKX_Fcg?si=WcOIhLm2iNy15lRF",
            category: "Glute Activation",
        },
        {
            title: "WHAT TO DO BEFORE UPPER BODY DAYS",
            url: "https://youtube.com/shorts/dV9xwy6Sz9Q?si=AZ0pRuS_wAMFCaYd",
            category: "Upper Body",
        },
    ];

    const handleVideoPress = (video: WarmUpVideo) => {
        setSelectedVideo(video);
        setShowPreview(true);
        setThumbnailLoading(true);
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setSelectedVideo(null);
    };

    const handleOpenInYouTube = async () => {
        if (!selectedVideo) return;
        try {
            const supported = await Linking.canOpenURL(selectedVideo.url);
            if (supported) {
                await Linking.openURL(selectedVideo.url);
                handleClosePreview();
            } else {
                console.log("Can't open URL: " + selectedVideo.url);
            }
        } catch (error) {
            console.error("Error opening URL:", error);
        }
    };

    const getPreviewThumbnail = (): string | null => {
        if (!selectedVideo) return null;
        const videoId = extractYouTubeVideoId(selectedVideo.url);
        if (!videoId) return null;
        return getYouTubeThumbnail(videoId);
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
                <Pressable
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: hexToRgba(theme.colors.bg, 0.95),
                            paddingBottom: insets.bottom + spacing.md,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Ionicons name="flame-outline" size={28} color={theme.colors.accent} />
                            <View style={styles.headerText}>
                                <Text
                                    style={[
                                        styles.title,
                                        {
                                            color: theme.colors.text,
                                            fontFamily: typography.fonts.headlineSemibold,
                                        },
                                    ]}
                                >
                                    Warm Up
                                </Text>
                                <Text
                                    style={[
                                        styles.subtitle,
                                        {
                                            color: theme.colors.textSecondary,
                                            fontFamily: typography.fonts.body,
                                        },
                                    ]}
                                >
                                    Choose a routine to get started
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[
                                styles.closeButton,
                                { backgroundColor: theme.colors.surface },
                            ]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Video List */}
                    <ScrollView
                        style={styles.videoList}
                        contentContainerStyle={styles.videoListContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {warmUpVideos.map((video, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.videoCard,
                                    {
                                        backgroundColor: theme.colors.glassWhite,
                                        borderColor: theme.colors.glassBorder,
                                    },
                                ]}
                                onPress={() => handleVideoPress(video)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.videoContent}>
                                    <View style={styles.videoIconContainer}>
                                        <Ionicons
                                            name="play-circle"
                                            size={24}
                                            color={theme.colors.accent}
                                        />
                                    </View>
                                    <View style={styles.videoInfo}>
                                        <Text
                                            style={[
                                                styles.videoCategory,
                                                {
                                                    color: theme.colors.accent,
                                                    fontFamily: typography.fonts.bodySemibold,
                                                },
                                            ]}
                                        >
                                            {video.category}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.videoTitle,
                                                {
                                                    color: theme.colors.text,
                                                    fontFamily: typography.fonts.bodyMedium,
                                                },
                                            ]}
                                        >
                                            {video.title}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={theme.colors.textTertiary}
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                        style={[
                            styles.closeButtonBottom,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                            },
                        ]}
                        onPress={onClose}
                    >
                        <Text
                            style={[
                                styles.closeButtonBottomText,
                                {
                                    color: theme.colors.text,
                                    fontFamily: typography.fonts.bodyMedium,
                                },
                            ]}
                        >
                            Close
                        </Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>

            {/* Video Preview Modal */}
            <Modal
                visible={showPreview}
                animationType="slide"
                transparent={true}
                onRequestClose={handleClosePreview}
            >
                <Pressable style={[styles.previewOverlay, { backgroundColor: theme.colors.overlay }]} onPress={handleClosePreview}>
                    <Pressable
                        style={[
                            styles.previewContent,
                            {
                                backgroundColor: theme.colors.bg,
                                paddingBottom: insets.bottom + spacing.md,
                            },
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={handleClosePreview}
                            style={[
                                styles.previewCloseButton,
                                { backgroundColor: theme.colors.surface },
                            ]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>

                        {selectedVideo && (
                            <>
                                {/* Thumbnail */}
                                <View style={styles.thumbnailContainer}>
                                    {thumbnailLoading && (
                                        <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.colors.surface }]}>
                                            <ActivityIndicator color={theme.colors.accent} />
                                        </View>
                                    )}
                                    <Image
                                        source={{ uri: getPreviewThumbnail() || undefined }}
                                        style={styles.thumbnail}
                                        resizeMode="cover"
                                        onLoadStart={() => setThumbnailLoading(true)}
                                        onLoadEnd={() => setThumbnailLoading(false)}
                                    />
                                    {/* Play Icon Overlay */}
                                    <View style={styles.playIconOverlay}>
                                        <View style={styles.playIconBackground}>
                                            <Ionicons name="play" size={32} color="#FFFFFF" />
                                        </View>
                                    </View>
                                </View>

                                {/* Badges */}
                                <View style={styles.badgeRow}>
                                    <View style={styles.youtubeBadge}>
                                        <Ionicons name="logo-youtube" size={14} color="#FFFFFF" />
                                        <Text style={styles.youtubeBadgeText}>YouTube</Text>
                                    </View>
                                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}>
                                        <Text style={styles.categoryBadgeText}>{selectedVideo.category}</Text>
                                    </View>
                                </View>

                                {/* Title */}
                                <Text
                                    style={[
                                        styles.previewTitle,
                                        {
                                            color: theme.colors.text,
                                            fontFamily: typography.fonts.headlineSemibold,
                                        },
                                    ]}
                                >
                                    {selectedVideo.title}
                                </Text>

                                {/* Action Buttons */}
                                <View style={styles.actionButtonRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.cancelButton,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderColor: theme.colors.border,
                                            },
                                        ]}
                                        onPress={handleClosePreview}
                                    >
                                        <Text
                                            style={[
                                                styles.cancelButtonText,
                                                {
                                                    color: theme.colors.text,
                                                    fontFamily: typography.fonts.bodyMedium,
                                                },
                                            ]}
                                        >
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.watchButton, { backgroundColor: theme.colors.accent }]}
                                        onPress={handleOpenInYouTube}
                                    >
                                        <Ionicons name="play" size={18} color="#FFFFFF" />
                                        <Text
                                            style={[
                                                styles.watchButtonText,
                                                { fontFamily: typography.fonts.bodyMedium },
                                            ]}
                                        >
                                            Watch on YouTube
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        maxHeight: "85%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    handleContainer: {
        alignItems: "center",
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: radii.full,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        flex: 1,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: typography.sizes.xl,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        lineHeight: 20,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        justifyContent: "center",
        alignItems: "center",
    },
    videoList: {
        maxHeight: 400,
        marginBottom: spacing.md,
    },
    videoListContent: {
        paddingBottom: spacing.xs,
    },
    videoCard: {
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    videoContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    videoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "center",
    },
    videoInfo: {
        flex: 1,
    },
    videoCategory: {
        fontSize: typography.sizes.xs,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    videoTitle: {
        fontSize: typography.sizes.md,
        lineHeight: 20,
    },
    closeButtonBottom: {
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        alignItems: "center",
        borderWidth: 1.5,
        minHeight: 48,
    },
    closeButtonBottomText: {
        fontSize: typography.sizes.md,
    },
    // Preview Modal Styles
    previewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        justifyContent: "flex-end",
    },
    previewContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    previewCloseButton: {
        position: "absolute",
        top: spacing.md,
        right: spacing.md,
        width: 32,
        height: 32,
        borderRadius: radii.md,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    thumbnailContainer: {
        width: "100%",
        height: 220,
        borderRadius: radii.lg,
        overflow: "hidden",
        marginTop: spacing.md,
        marginBottom: spacing.md,
        position: "relative",
    },
    thumbnailPlaceholder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    playIconOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    playIconBackground: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 4,
    },
    badgeRow: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    youtubeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FF0000",
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    youtubeBadgeText: {
        color: "#FFFFFF",
        fontSize: typography.sizes.xs,
        fontWeight: "600",
    },
    categoryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    categoryBadgeText: {
        color: "#FFFFFF",
        fontSize: typography.sizes.xs,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    previewTitle: {
        fontSize: typography.sizes.lg,
        marginBottom: spacing.lg,
        lineHeight: 26,
    },
    actionButtonRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    cancelButton: {
        flex: 1,
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        minHeight: 48,
    },
    cancelButtonText: {
        fontSize: typography.sizes.md,
    },
    watchButton: {
        flex: 2,
        flexDirection: "row",
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        minHeight: 48,
    },
    watchButtonText: {
        color: "#FFFFFF",
        fontSize: typography.sizes.md,
    },
});

export default WarmUpModal;
