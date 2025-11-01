import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { WorkoutLibrary } from "./screens/WorkoutLibrary";
import { WorkoutPlans } from "./screens/WorkoutPlans";

type TabType = "library" | "plans";

export default function App() {
    const [activeTab, setActiveTab] = useState<TabType>("library");

    const renderContent = () => {
        switch (activeTab) {
            case "library":
                return <WorkoutLibrary />;
            case "plans":
                return <WorkoutPlans />;
            default:
                return <WorkoutLibrary />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Trainichi</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "library" && styles.activeTab]}
                    onPress={() => setActiveTab("library")}
                >
                    <Text style={[styles.tabText, activeTab === "library" && styles.activeTabText]}>
                        Library
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "plans" && styles.activeTab]}
                    onPress={() => setActiveTab("plans")}
                >
                    <Text style={[styles.tabText, activeTab === "plans" && styles.activeTabText]}>
                        Plans
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>{renderContent()}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        backgroundColor: "#007AFF",
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: "#007AFF",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#666",
    },
    activeTabText: {
        color: "#007AFF",
        fontWeight: "600",
    },
    content: {
        flex: 1,
    },
});
