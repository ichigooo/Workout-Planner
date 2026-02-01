import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    useColorScheme,
    Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../theme";

interface AddToPlanBottomSheetProps {
    visible: boolean;
    workoutTitle: string;
    onClose: () => void;
    onConfirm: (dates: string[]) => Promise<void>;
}

export const AddToPlanBottomSheet: React.FC<AddToPlanBottomSheetProps> = ({
    visible,
    workoutTitle,
    onClose,
    onConfirm,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [selectedDates, setSelectedDates] = useState<{ [key: string]: any }>({});
    const [adding, setAdding] = useState(false);

    const handleDatePress = (day: { dateString: string }) => {
        const dateString = day.dateString;
        setSelectedDates((prev) => {
            const newDates = { ...prev };
            if (newDates[dateString]) {
                delete newDates[dateString];
            } else {
                newDates[dateString] = {
                    selected: true,
                    selectedColor: theme.colors.accent,
                };
            }
            return newDates;
        });
    };

    const handleConfirm = async () => {
        const dates = Object.keys(selectedDates);
        if (dates.length === 0) return;

        setAdding(true);
        try {
            await onConfirm(dates);
            setSelectedDates({});
            onClose();
        } catch (error) {
            console.error("Failed to add to plan:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleClose = () => {
        setSelectedDates({});
        onClose();
    };

    const selectedCount = Object.keys(selectedDates).length;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.backdrop} onPress={handleClose}>
                <Pressable
                    style={[
                        styles.bottomSheet,
                        {
                            backgroundColor: theme.colors.bg,
                            paddingBottom: insets.bottom + spacing.md,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Ionicons name="calendar-outline" size={24} color={theme.colors.accent} />
                            <View style={styles.headerText}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>
                                    Add to Schedule
                                </Text>
                                <Text
                                    style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {workoutTitle}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Instructions */}
                        <View
                            style={[
                                styles.instructionCard,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={theme.colors.accent}
                            />
                            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                                Tap dates to add this workout to your schedule
                            </Text>
                        </View>

                        {/* Calendar */}
                        <View
                            style={[
                                styles.calendarContainer,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Calendar
                                onDayPress={handleDatePress}
                                markedDates={selectedDates}
                                minDate={new Date().toISOString().split("T")[0]}
                                theme={{
                                    backgroundColor: "transparent",
                                    calendarBackground: "transparent",
                                    textSectionTitleColor: theme.colors.textSecondary,
                                    selectedDayBackgroundColor: theme.colors.accent,
                                    selectedDayTextColor: "#FFFFFF",
                                    todayTextColor: theme.colors.accent,
                                    dayTextColor: theme.colors.text,
                                    textDisabledColor: theme.colors.textTertiary,
                                    monthTextColor: theme.colors.text,
                                    arrowColor: theme.colors.accent,
                                    textDayFontFamily: typography.fonts.body,
                                    textMonthFontFamily: typography.fonts.bodyMedium,
                                    textDayHeaderFontFamily: typography.fonts.bodySemibold,
                                    textDayFontSize: typography.sizes.sm,
                                    textMonthFontSize: typography.sizes.md,
                                    textDayHeaderFontSize: typography.sizes.xs,
                                }}
                            />
                        </View>

                        {/* Selected count indicator */}
                        {selectedCount > 0 && (
                            <View
                                style={[
                                    styles.selectedIndicator,
                                    {
                                        backgroundColor: theme.colors.accent + "15",
                                        borderColor: theme.colors.accent + "30",
                                    },
                                ]}
                            >
                                <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} />
                                <Text style={[styles.selectedText, { color: theme.colors.accent }]}>
                                    {selectedCount} {selectedCount === 1 ? "date" : "dates"} selected
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.cancelButton,
                                {
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            onPress={handleClose}
                            disabled={adding}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                {
                                    backgroundColor:
                                        selectedCount === 0 || adding
                                            ? theme.colors.textTertiary
                                            : theme.colors.accent,
                                },
                            ]}
                            onPress={handleConfirm}
                            disabled={selectedCount === 0 || adding}
                        >
                            {adding ? (
                                <Text style={styles.confirmButtonText}>Adding...</Text>
                            ) : (
                                <>
                                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.confirmButtonText}>
                                        Add to Schedule
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    bottomSheet: {
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: "90%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    handleContainer: {
        alignItems: "center",
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: radii.full,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: typography.sizes.lg,
        fontFamily: typography.fonts.bodySemibold,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radii.md,
    },
    content: {
        paddingHorizontal: spacing.md,
        maxHeight: 480,
    },
    instructionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    instructionText: {
        flex: 1,
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
    },
    calendarContainer: {
        borderRadius: radii.lg,
        borderWidth: 1,
        padding: spacing.xs,
        marginBottom: spacing.md,
    },
    selectedIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    selectedText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodyMedium,
    },
    footer: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    button: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        minHeight: 48,
    },
    cancelButton: {
        borderWidth: 1.5,
    },
    cancelButtonText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodyMedium,
    },
    confirmButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    confirmButtonText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
        color: "#FFFFFF",
    },
});
