import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function NotFound() {
    return (
        <View style={styles.container}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>404 — Page not found</Text>
            </View>

            <Text style={styles.title}>Nothing to see here.</Text>
            <Text style={styles.subtitle}>The page you’re looking for doesn’t exist or has moved.</Text>

            <Link href="/" asChild>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Go back home</Text>
                </TouchableOpacity>
            </Link>

            <Text style={styles.footer}>Workout Planner</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor: "#F8F5EB",
        gap: 12,
    },
    badge: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.15)",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.8)",
    },
    badgeText: {
        fontSize: 12,
        letterSpacing: 1,
        color: "rgba(0,0,0,0.5)",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        color: "#1A1A1A",
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(0,0,0,0.6)",
        textAlign: "center",
    },
    button: {
        marginTop: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.2)",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1A1A1A",
    },
    footer: {
        marginTop: 24,
        fontSize: 12,
        color: "rgba(0,0,0,0.4)",
    },
});
