import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { getTheme } from "@/src/theme";

function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>["name"]; color: string }) {
    return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.accent,
                tabBarInactiveTintColor: theme.colors.subtext,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <TabBarIcon name="home-outline" color={color} />,
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "Routine",
                    tabBarIcon: ({ color }) => <TabBarIcon name="barbell-outline" color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    // Hide calendar from the bottom tab bar; still accessible via router.push
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
                }}
            />
        </Tabs>
    );
}
