import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    useColorScheme,
    ImageBackground,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { planItemsCache } from "@/src/services/planItemsCache";
import type { WorkoutPlanTemplate } from "@/src/types";
import { useRouter } from "expo-router";

const templateBackgrounds = [
    require("../../assets/images/workout_templates/temp1.png"),
    require("../../assets/images/workout_templates/temp2.png"),
    require("../../assets/images/workout_templates/temp3.png"),
    require("../../assets/images/workout_templates/temp4.png"),
    require("../../assets/images/workout_templates/temp5.png"),
];

export default function PlanScreen() {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const router = useRouter(); // 👈

    const [templates, setTemplates] = useState<WorkoutPlanTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTemplates = async () => {
        try {
            const data = await planItemsCache.getWorkoutPlanTemplates();
            setTemplates(data);
            setError(null);
        } catch (err) {
            console.error("[PlanScreen] Failed to load templates:", err);
            setError("Unable to load plan templates right now.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        planItemsCache.invalidatePlanTemplates();
        fetchTemplates();
    };

    const handlePressTemplate = (tpl: WorkoutPlanTemplate) => {
        const payload = encodeURIComponent(JSON.stringify(tpl));
        router.push({
            pathname: "/plan/[id]",
            params: { id: tpl.id, data: payload },
        });
    };

    return (
        <ImageBackground
            source={require("../../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
            <SafeAreaView
                style={[styles.safeArea, { backgroundColor: "transparent" }]}
                edges={["top"]}
            >
                <View style={[styles.container, { backgroundColor: "transparent" }]}>
                    <ScrollView
                        contentContainerStyle={styles.content}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[theme.colors.accent]}
                                progressBackgroundColor={theme.colors.surface}
                            />
                        }
                    >
                        {loading ? (
                            <ActivityIndicator size="large" color={theme.colors.accent} />
                        ) : error ? (
                            <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                {error}
                            </Text>
                        ) : templates.length === 0 ? (
                            <Text style={[styles.message, { color: theme.colors.subtext }]}>
                                No templates available yet.
                            </Text>
                        ) : (
                            templates.map((tpl, index) => {
                                const isClimbTemplate = tpl.name.toLowerCase().includes("climb");
                                const background = isClimbTemplate
                                    ? require("../../assets/images/workout_templates/climb_temp1.jpg")
                                    : (templateBackgrounds[index % templateBackgrounds.length] ??
                                      templateBackgrounds[0]);

                                return (
                                    <TouchableOpacity
                                        key={tpl.id}
                                        activeOpacity={0.9}
                                        onPress={() => handlePressTemplate(tpl)} // 👈
                                    >
                                        <ImageBackground
                                            source={background}
                                            style={[
                                                styles.templateCardBackground,
                                                { borderColor: theme.colors.border },
                                            ]}
                                            imageStyle={styles.templateCardImage}
                                        >
                                            <View style={styles.templateOverlay}>
                                                <Text style={styles.templateName}>{tpl.name}</Text>
                                                {tpl.description ? (
                                                    <Text style={styles.templateDescription}>
                                                        {tpl.description}
                                                    </Text>
                                                ) : null}
                                                <View style={styles.metaRow}>
                                                    <Text style={styles.metaText}>
                                                        {tpl.numWeeks} wk · {tpl.daysPerWeek}{" "}
                                                        days/week
                                                    </Text>
                                                    {tpl.level ? (
                                                        <Text style={styles.metaText}>
                                                            {tpl.level}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    content: {
        padding: 24,
        gap: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: "700",
    },
    message: {
        fontSize: 16,
        textAlign: "center",
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
    },
    templateCardBackground: {
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
        minHeight: 220,
        marginBottom: 16,
    },
    templateCardImage: {
        borderRadius: 16,
    },
    templateOverlay: {
        flex: 1,
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "space-between",
    },
    templateName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    templateDescription: {
        marginTop: 4,
        fontSize: 14,
        color: "rgba(255,255,255,0.92)",
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    metaText: {
        fontSize: 13,
        color: "rgba(255,255,255,0.9)",
    },
});
