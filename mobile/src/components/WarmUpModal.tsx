import React from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../theme";

interface WarmUpModalProps {
    visible: boolean;
    onClose: () => void;
}

const WarmUpModal: React.FC<WarmUpModalProps> = ({ visible, onClose }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const warmUpVideos = [
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

    const handleVideoPress = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log("Can't open URL: " + url);
            }
        } catch (error) {
            console.error("Error opening URL:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={[
                        styles.modalContent,
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
                                        backgroundColor: theme.colors.surface,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                                onPress={() => handleVideoPress(video.url)}
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
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
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
});

export default WarmUpModal;
