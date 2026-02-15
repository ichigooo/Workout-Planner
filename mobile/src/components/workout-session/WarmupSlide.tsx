import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Linking,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../../theme";

interface WarmupSlideProps {
    onComplete: () => void;
}

type WarmUpVideo = {
    title: string;
    url: string;
    category: string;
};

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

export const WarmupSlide: React.FC<WarmupSlideProps> = ({ onComplete }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const handleVideoPress = async (video: WarmUpVideo) => {
        try {
            await Linking.openURL(video.url);
        } catch (error) {
            console.error("Error opening URL:", error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <View style={styles.header}>
                <Ionicons
                    name="flame-outline"
                    size={36}
                    color={theme.colors.accent}
                />
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
                            color: theme.colors.textTertiary,
                            fontFamily: typography.fonts.body,
                        },
                    ]}
                >
                    Choose a routine or skip ahead
                </Text>
            </View>

            <ScrollView
                style={styles.videoList}
                contentContainerStyle={styles.videoListContent}
                showsVerticalScrollIndicator={false}
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
                                            fontFamily:
                                                typography.fonts.bodySemibold,
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
                                            fontFamily:
                                                typography.fonts.bodyMedium,
                                        },
                                    ]}
                                >
                                    {video.title}
                                </Text>
                            </View>
                            <Ionicons
                                name="open-outline"
                                size={18}
                                color={theme.colors.textTertiary}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[
                    styles.skipButton,
                    { backgroundColor: theme.colors.accent },
                ]}
                onPress={onComplete}
                activeOpacity={0.85}
            >
                <Text style={styles.skipButtonText}>
                    Skip Warm Up
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.lg,
        gap: 8,
    },
    title: {
        fontSize: typography.sizes.xl,
        marginTop: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
    },
    videoList: {
        flex: 1,
    },
    videoListContent: {
        paddingBottom: spacing.md,
    },
    videoCard: {
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
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
    skipButton: {
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        alignItems: "center",
        marginBottom: spacing.md,
        minHeight: 48,
        justifyContent: "center",
    },
    skipButtonText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
    },
});
