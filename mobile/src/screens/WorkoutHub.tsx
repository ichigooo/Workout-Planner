import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme } from "../theme";
import { WorkoutLibrary } from "./WorkoutLibrary";
import { WorkoutPlans } from "./WorkoutPlans";
import { useLocalSearchParams } from "expo-router";

export const WorkoutHub: React.FC = () => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const params = useLocalSearchParams<{ tab?: string }>();
    const [tab, setTab] = useState<"workout" | "routine">(
        params?.tab === "routine" ? "routine" : "workout",
    );

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
        >
            <View
                style={[
                    styles.segment,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.segmentButton,
                        tab === "routine" && [
                            styles.segmentActive,
                            { backgroundColor: theme.colors.accent },
                        ],
                    ]}
                    onPress={() => setTab("routine")}
                >
                    <Text
                        style={[
                            styles.segmentText,
                            { color: tab === "routine" ? "#fff" : theme.colors.text },
                        ]}
                    >
                        Routine
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.segmentButton,
                        tab === "workout" && [
                            styles.segmentActive,
                            { backgroundColor: theme.colors.accent },
                        ],
                    ]}
                    onPress={() => setTab("workout")}
                >
                    <Text
                        style={[
                            styles.segmentText,
                            { color: tab === "workout" ? "#fff" : theme.colors.text },
                        ]}
                    >
                        Workout
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {tab === "routine" ? <WorkoutPlans /> : <WorkoutLibrary />}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    segment: {
        margin: 12,
        flexDirection: "row",
        borderRadius: 10,
        borderWidth: 1,
        overflow: "hidden",
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
    },
    segmentActive: {},
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
    },
    content: {
        flex: 1,
    },
});

export default WorkoutHub;
