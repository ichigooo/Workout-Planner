import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { useColorScheme } from "react-native";
import * as Linking from "expo-linking";
import { WorkoutImport } from "@/src/types";

export default function CustomImportScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ payload?: string }>();
    const { top } = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const data: WorkoutImport | null = useMemo(() => {
        if (!params?.payload) return null;
        try {
            return JSON.parse(params.payload as string);
        } catch (err) {
            console.warn("[CustomImport] Failed to parse payload", err);
            return null;
        }
    }, [params?.payload]);

    if (!data) {
        return (
            <View style={[styles.container, { paddingTop: top + 20 }]}>
                <Text style={{ color: theme.colors.text, textAlign: "center" }}>
                    Unable to load imported workout.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={{ color: theme.colors.accent }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            <View style={[styles.header, { paddingTop: top + 12, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <Text style={{ color: theme.colors.accent }}>‹ Back</Text>
                </TouchableOpacity>
                <View style={{ width: 48 }} />
            </View>
            {data.thumbnailUrl ? (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                        data.sourceUrl &&
                        Linking.openURL(data.sourceUrl).catch(() =>
                            Alert.alert("Unable to open link", "Please try again later."),
                        )
                    }
                >
                    <Image source={{ uri: data.thumbnailUrl }} style={styles.hero} />
                </TouchableOpacity>
            ) : null}
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={[styles.platformTag, { color: theme.colors.subtext }]}>
                    {(data.sourcePlatform || "Custom").toUpperCase()}
                </Text>
                <Text style={[styles.title, { color: theme.colors.text }]}>{data.title}</Text>
                {data.metadata?.author_name ? (
                    <Text style={{ color: theme.colors.subtext, marginBottom: 12 }}>
                        by {data.metadata.author_name}
                    </Text>
                ) : null}
                {data.description ? (
                    <Text style={[styles.description, { color: theme.colors.subtext }]}>{data.description}</Text>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    hero: {
        width: "100%",
        height: 220,
        resizeMode: "cover",
    },
    platformTag: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 20,
    },
    openButton: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    backButton: {
        marginTop: 16,
        alignSelf: "center",
        padding: 8,
    },
});
