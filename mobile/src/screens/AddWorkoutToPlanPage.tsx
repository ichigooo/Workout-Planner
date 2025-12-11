import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Workout } from "../types";
import { getTheme } from "../theme";

interface AddWorkoutToPlanPageProps {
    theme: ReturnType<typeof getTheme>;
    categories: string[];
    activeCategory: string | null;
    onSelectCategory: (category: string) => void;
    workoutsByCategory: Workout[];
    selectedWorkoutId: string | null;
    onSelectWorkout: (id: string | null) => void;
    selectedDates: { [key: string]: any };
    onToggleDate: (dateISO: string) => void;
    canAdd: boolean;
    onAdd: () => void;
    onClose: () => void;
    categoriesListRef: React.RefObject<FlatList<string>>;
}

export const AddWorkoutToPlanPage: React.FC<AddWorkoutToPlanPageProps> = ({
    theme,
    categories,
    activeCategory,
    onSelectCategory,
    workoutsByCategory,
    selectedWorkoutId,
    onSelectWorkout,
    selectedDates,
    onToggleDate,
    canAdd,
    onAdd,
    onClose,
    categoriesListRef,
}) => {
    const showWorkoutScrollHint = workoutsByCategory.length > 3;
    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            style={[styles.container, { backgroundColor: 'transparent' }]}
        >
            <View
                style={[
                    styles.headerRow,
                    {
                        borderBottomColor: theme.colors.border,
                    },
                ]}
            >
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add Workout</Text>
                <TouchableOpacity onPress={onClose}>
                    <Text style={{ color: theme.colors.accent, fontWeight: "600" }}>Close</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.categorySection}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Category</Text>
                    <FlatList
                        ref={categoriesListRef}
                        horizontal
                        style={styles.chipsList}
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => {
                            const active = activeCategory === item;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        {
                                            borderColor: theme.colors.border,
                                            backgroundColor: active
                                                ? theme.colors.accent
                                                : theme.colors.surface,
                                        },
                                    ]}
                                    onPress={() => onSelectCategory(item)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={{
                                            color: active ? "#fff" : theme.colors.text,
                                            fontWeight: "600",
                                        }}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsRow}
                        onScrollToIndexFailed={(info) => {
                            const approx = Math.max(0, (info.index - 1) * 100);
                            categoriesListRef.current?.scrollToOffset({
                                offset: approx,
                                animated: true,
                            });
                        }}
                    />
                </View>

                <Text
                    style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 8 }]}
                >
                    Workout
                </Text>
                <View style={styles.workoutListContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={showWorkoutScrollHint}
                        contentContainerStyle={styles.workoutListContent}
                    >
                        <View style={{ gap: 8 }}>
                            {workoutsByCategory.length === 0 ? (
                                <Text
                                    style={{
                                        color: theme.colors.subtext,
                                        textAlign: "center",
                                        fontStyle: "italic",
                                    }}
                                >
                                    No workouts in this category yet
                                </Text>
                            ) : (
                                workoutsByCategory.map((w) => {
                                    const active = selectedWorkoutId === w.id;
                                    return (
                                        <TouchableOpacity
                                            key={w.id}
                                            style={[
                                                styles.workoutRow,
                                                {
                                                    borderColor: theme.colors.border,
                                                    backgroundColor: active
                                                        ? theme.colors.accent + "15"
                                                        : theme.colors.surface,
                                                },
                                            ]}
                                            onPress={() =>
                                                onSelectWorkout(
                                                    selectedWorkoutId === w.id ? null : w.id,
                                                )
                                            }
                                        >
                                            <Text
                                                style={{ color: theme.colors.text, fontWeight: "600" }}
                                            >
                                                {w.title}
                                            </Text>
                                            <Text
                                                style={{ color: theme.colors.subtext, marginTop: 2 }}
                                            >
                                                {w.category}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    </ScrollView>
                    {showWorkoutScrollHint && (
                        <Text style={[styles.workoutScrollHint, { color: theme.colors.subtext }]}>
                            Scroll for more workouts
                        </Text>
                    )}
                </View>

                <Text
                    style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}
                >
                    Select Dates
                </Text>
                <Calendar
                    onDayPress={(day) => {
                        onToggleDate(day.dateString);
                    }}
                    markedDates={selectedDates}
                    theme={{
                        backgroundColor: theme.colors.surface,
                        calendarBackground: theme.colors.surface,
                        textSectionTitleColor: theme.colors.text,
                        selectedDayBackgroundColor: theme.colors.accent,
                        selectedDayTextColor: "#fff",
                        todayTextColor: theme.colors.accent,
                        dayTextColor: theme.colors.text,
                        textDisabledColor: theme.colors.subtext,
                        dotColor: theme.colors.accent,
                        selectedDotColor: "#fff",
                        arrowColor: theme.colors.accent,
                        monthTextColor: theme.colors.text,
                        indicatorColor: theme.colors.accent,
                        textDayFontWeight: "500",
                        textMonthFontWeight: "600",
                        textDayHeaderFontWeight: "600",
                        textDayFontSize: 16,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 12,
                    }}
                    style={styles.calendar}
                />

                <TouchableOpacity
                    disabled={!canAdd}
                    onPress={onAdd}
                    style={[
                        styles.addBtn,
                        {
                            backgroundColor: canAdd ? theme.colors.accent : theme.colors.lightBlue,
                        },
                    ]}
                >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>ADD</Text>
                </TouchableOpacity>
                {!canAdd && (
                    <Text style={[styles.disabledHint, { color: theme.colors.subtext }]}>
                        {!selectedWorkoutId
                            ? "Select a workout to continue"
                            : Object.keys(selectedDates).length === 0
                            ? "Select at least one date to continue"
                            : ""}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    scrollArea: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 24,
    },
    fieldLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
    categorySection: {
        marginBottom: 12,
    },
    chipsList: {
        flexGrow: 0,
        minHeight: 32,
    },
    chipsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 0 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    workoutListContainer: {
        maxHeight: 160,
        marginBottom: 8,
    },
    workoutListContent: {
        paddingBottom: 4,
    },
    workoutRow: { borderWidth: 1, borderRadius: 12, padding: 12 },
    workoutScrollHint: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 4,
    },
    calendar: {
        marginVertical: 6,
        borderRadius: 12,
        overflow: "hidden",
        paddingVertical: 4,
    },
    disabledHint: {
        fontSize: 13,
        textAlign: "center",
        marginTop: 6,
    },
    addBtn: {
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
    },
});

export default AddWorkoutToPlanPage;
