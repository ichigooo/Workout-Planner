import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, useColorScheme, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { getCurrentPlanId } from "@/src/state/session";
import { PlanItem, Workout } from "@/src/types";
import { useRouter } from "expo-router";

interface ScheduledWorkout {
    id: string;
    workout: Workout;
    date: string;
    intensity?: string;
}

export default function CalendarScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const now = new Date();
    const localTodayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState(localTodayStr);
    const [monthItems, setMonthItems] = useState<PlanItem[]>([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const pid = getCurrentPlanId()!;
            if (!mounted) return;
            const now = new Date();
            const resp = await apiService.getPlanItemsByMonth(
                pid,
                now.getFullYear(),
                now.getMonth() + 1,
            );
            if (!mounted) return;
            setMonthItems(resp.items || []);
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    const getMarkedDates = () => {
        const marked: any = {
            [selectedDate]: { selected: true, selectedColor: theme.colors.accent },
        };
        // Always highlight today (text/dot) even if not selected (no outline)
        if (localTodayStr !== selectedDate) {
            marked[localTodayStr] = {
                customStyles: {
                    text: {
                        color: theme.colors.accent,
                        fontWeight: "700",
                    },
                },
                marked: true,
                dotColor: theme.colors.accent,
            };
        }
        monthItems.forEach((pi) => {
            const sdRaw = (pi as any).scheduledDate ?? (pi as any).scheduled_date;
            if (!sdRaw) return;
            const datePart =
                typeof sdRaw === "string"
                    ? sdRaw.split("T")[0].split(" ")[0]
                    : (() => {
                          const dt = new Date(sdRaw as any);
                          return `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
                      })();
            const d = datePart;
            if (!marked[d]) marked[d] = { marked: true, dotColor: theme.colors.accent };
        });
        return marked;
    };

    const scheduledFromMonth: ScheduledWorkout[] = monthItems
        .map((pi) => {
            const workout = (pi as any).workout as Workout | undefined;
            if (!workout) return null;
            const sdRaw = (pi as any).scheduledDate ?? (pi as any).scheduled_date;
            let d = "";
            if (sdRaw) {
                if (typeof sdRaw === "string") {
                    d = sdRaw.split("T")[0].split(" ")[0];
                } else {
                    const dt = new Date(sdRaw as any);
                    d = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
                }
            }
            return {
                id: `${pi.id}-${d}`,
                workout,
                date: d,
                intensity: pi.intensity || workout.intensity,
            } as ScheduledWorkout;
        })
        .filter(Boolean) as ScheduledWorkout[];

    const selectedDayWorkouts = scheduledFromMonth.filter((w) => w.date === selectedDate);

    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.cream }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: theme.colors.cream,
                }}
            >
                <TouchableOpacity onPress={() => router.back()} style={{ width: 60 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.accent }}>
                        ‹ Back
                    </Text>
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: theme.colors.text,
                        flex: 1,
                        textAlign: "center",
                    }}
                >
                    Workout Calendar
                </Text>
                <View style={{ width: 60 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 8,
                        marginBottom: 16,
                    }}
                >
                        <Calendar
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                            markedDates={getMarkedDates()}
                            markingType="custom"
                            style={{
                                backgroundColor: theme.colors.surface,
                            }}
                            theme={{
                                backgroundColor: theme.colors.surface,
                                calendarBackground: theme.colors.surface,
                                textSectionTitleColor: theme.colors.text,
                                textSectionTitleDisabledColor: theme.colors.subtext,
                                selectedDayBackgroundColor: theme.colors.accent,
                                selectedDayTextColor: "#FFFFFF",
                                todayTextColor: theme.colors.accent,
                                dayTextColor: theme.colors.text,
                                textDisabledColor: theme.colors.subtext,
                                monthTextColor: theme.colors.text,
                            textDayFontSize: 16,
                            textDayFontWeight: "700",
                            textMonthFontSize: 20,
                            textMonthFontWeight: "700",
                            textDayHeaderFontSize: 14,
                            textDayHeaderFontWeight: "700",
                            arrowColor: theme.colors.accent,
                            disabledArrowColor: theme.colors.border,
                            dotColor: theme.colors.accent,
                            selectedDotColor: "#FFFFFF",
                            indicatorColor: theme.colors.accent,
                        }}
                    />
                </View>

                <View style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: "700", marginBottom: 8 }}>
                        {selectedDate === localTodayStr
                            ? "Today's Workouts"
                            : `${selectedDate} Workouts`}
                    </Text>
                    {selectedDayWorkouts.length > 0 ? (
                        selectedDayWorkouts.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                    borderWidth: 1,
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 8,
                                }}
                                onPress={() =>
                                    router.push(
                                        `/workout-detail?id=${encodeURIComponent(s.workout.id)}`,
                                    )
                                }
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                                    {s.workout.title}
                                </Text>
                                <Text style={{ color: theme.colors.subtext }}>
                                    {s.workout.sets} sets × {s.workout.reps} reps •{" "}
                                    {s.workout.category}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.subtext }}>No workouts scheduled.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
