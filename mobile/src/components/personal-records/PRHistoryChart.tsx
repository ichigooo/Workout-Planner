import React from "react";
import { View, Text, StyleSheet, Dimensions, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { PersonalRecordEntry } from "../../types";
import { getTheme } from "../../theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface PRHistoryChartProps {
    entries: PersonalRecordEntry[];
    width?: number;
    height?: number;
}

export const PRHistoryChart: React.FC<PRHistoryChartProps> = ({
    entries,
    width = SCREEN_WIDTH - 40,
    height = 220,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    // Sort entries by date
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.dateAchieved).getTime() - new Date(b.dateAchieved).getTime()
    );

    // Take last 7 entries for the chart
    const chartEntries = sortedEntries.slice(-7);

    if (chartEntries.length < 2) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
                    Add more entries to see a chart
                </Text>
            </View>
        );
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const chartData = {
        labels: chartEntries.map((e) => formatDate(e.dateAchieved)),
        datasets: [
            {
                data: chartEntries.map((e) => e.weight),
                color: () => theme.colors.accent,
                strokeWidth: 2,
            },
        ],
    };

    return (
        <View style={styles.container}>
            <LineChart
                data={chartData}
                width={width}
                height={height}
                chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0,
                    color: () => theme.colors.accent,
                    labelColor: () => theme.colors.subtext,
                    style: {
                        borderRadius: 12,
                    },
                    propsForDots: {
                        r: "5",
                        strokeWidth: "2",
                        stroke: theme.colors.accent,
                    },
                }}
                bezier
                style={styles.chart}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    chart: {
        borderRadius: 12,
    },
    emptyContainer: {
        height: 120,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 14,
    },
});
