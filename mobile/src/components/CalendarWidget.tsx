import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, useColorScheme } from "react-native";
import { Calendar } from "react-native-calendars";
import { getTheme } from "../theme";

interface CalendarWidgetProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    placeholder?: string;
    minimumDate?: string;
    maximumDate?: string;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
    selectedDate,
    onDateSelect,
    placeholder = "Select Date",
    minimumDate,
    maximumDate,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const [showCalendar, setShowCalendar] = useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return placeholder;
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleDateSelect = (day: any) => {
        onDateSelect(day.dateString);
        setShowCalendar(false);
    };

    const calendarTheme = {
        backgroundColor: theme.colors.surface,
        calendarBackground: theme.colors.surface,
        textSectionTitleColor: theme.colors.text,
        selectedDayBackgroundColor: theme.colors.accent,
        selectedDayTextColor: "#FFFFFF",
        todayTextColor: theme.colors.accent,
        dayTextColor: theme.colors.text,
        textDisabledColor: theme.colors.subtext,
        dotColor: theme.colors.accent,
        selectedDotColor: "#FFFFFF",
        arrowColor: theme.colors.accent,
        disabledArrowColor: theme.colors.subtext,
        monthTextColor: theme.colors.text,
        indicatorColor: theme.colors.accent,
        textDayFontFamily: "Inter_400Regular",
        textMonthFontFamily: "Inter_600SemiBold",
        textDayHeaderFontFamily: "Inter_400Regular",
        textDayFontWeight: "400",
        textMonthFontWeight: "600",
        textDayHeaderFontWeight: "500",
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
    };

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.dateButton,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                    },
                ]}
                onPress={() => setShowCalendar(true)}
            >
                <Text
                    style={[
                        styles.dateText,
                        {
                            color: selectedDate ? theme.colors.text : theme.colors.subtext,
                        },
                    ]}
                >
                    {formatDate(selectedDate)}
                </Text>
                <Text style={[styles.calendarIcon, { color: theme.colors.subtext }]}>📅</Text>
            </TouchableOpacity>

            <Modal
                visible={showCalendar}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View
                            style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}
                        >
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                Select Date
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(false)}
                                style={styles.closeButton}
                            >
                                <Text
                                    style={[
                                        styles.closeButtonText,
                                        { color: theme.colors.subtext },
                                    ]}
                                >
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            onDayPress={handleDateSelect}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: theme.colors.accent,
                                },
                            }}
                            theme={calendarTheme}
                            minDate={minimumDate}
                            maxDate={maximumDate}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    dateButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 8,
    },
    dateText: {
        fontSize: 16,
        fontFamily: "Inter_400Regular",
    },
    calendarIcon: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        margin: 20,
        borderRadius: 16,
        overflow: "hidden",
        maxWidth: 400,
        width: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: "Inter_600SemiBold",
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: "600",
    },
});
