import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { UserProfile } from "@/src/screens/UserProfile";
import { useAuth } from "@/src/state/AuthContext";
import { getTheme } from "@/src/theme";

export default function ProfileRoute() {
    const { user, loading } = useAuth();
    const theme = getTheme("light");

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.bg }]}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    if (!user?.id) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.bg }]}>
                <Text style={[styles.text, { color: theme.colors.text }]}>
                    Please sign in to view your profile
                </Text>
            </View>
        );
    }

    return <UserProfile userId={user.id} />;
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 16,
    },
});

export const options = {
    headerShown: false,
};
