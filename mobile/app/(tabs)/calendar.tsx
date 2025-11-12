import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { getTheme } from "@/src/theme";
import { apiService } from "@/src/services/api";
import { PlanItem, Workout } from "@/src/types";

interface ScheduledWorkout {
    id: string;
    workout: Workout;
    date: string;
    intensity?: string;
}

export default function CalendarScreen() {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const now = new Date();
    const localTodayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState(localTodayStr);
    const [monthItems, setMonthItems] = useState<PlanItem[]>([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const plans = await apiService.getWorkoutPlans();
                if (!mounted) return;
                if (plans && plans.length > 0) {
                    const pid = plans[0].id;
                    const now = new Date();
                    const resp = await apiService.getPlanItemsByMonth(
                        pid,
                        now.getFullYear(),
                        now.getMonth() + 1,
                    );
                    if (!mounted) return;
                    setMonthItems(resp.items || []);
                }
            } catch (e) {
                console.warn("CalendarView load error", e);
            } finally {
                // no-op
            }
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
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: theme.colors.text,
                        marginBottom: 12,
                    }}
                >
                    Calendar
                </Text>
                <Calendar
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    markedDates={getMarkedDates()}
                    markingType="custom"
                    theme={{
                        backgroundColor: theme.colors.surface,
                        calendarBackground: theme.colors.surface,
                        textSectionTitleColor: theme.colors.text,
                        selectedDayBackgroundColor: theme.colors.accent,
                        selectedDayTextColor: "#fff",
                        todayTextColor: theme.colors.accent,
                    }}
                />

                <View style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: "700", marginBottom: 8 }}>
                        {selectedDate === localTodayStr
                            ? "Today's Workouts"
                            : `${selectedDate} Workouts`}
                    </Text>
                    {selectedDayWorkouts.length > 0 ? (
                        selectedDayWorkouts.map((s) => (
                            <View
                                key={s.id}
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                    borderWidth: 1,
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                                    {s.workout.title}
                                </Text>
                                <Text style={{ color: theme.colors.subtext }}>
                                    {s.workout.sets} sets × {s.workout.reps} reps • {s.workout.category}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.subtext }}>No workouts scheduled.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
