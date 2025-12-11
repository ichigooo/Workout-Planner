import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";

export default function ImportWorkoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <ImageBackground
            source={require("../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: "transparent" }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={[styles.backText, { color: theme.colors.accent }]}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Import Workout</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.content}>
                    <Text style={[styles.placeholder, { color: theme.colors.subtext }]}>
                        Import from IG, YouTube, TikTok, etc. (coming soon)
                    </Text>
                </View>
            </View>
        </ImageBackground>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        fontSize: 18,
        fontWeight: "700",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    placeholder: {
        fontSize: 16,
        textAlign: "center",
    },
});
