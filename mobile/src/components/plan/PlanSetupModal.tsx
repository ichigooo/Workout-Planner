// mobile/src/components/plan/PlanSetupModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { getTheme } from "@/src/theme";
import type { WorkoutPlanTemplate } from "@/src/types";
import { createUserPlanFromTemplate } from "./planScheduling";

type PlanSetupModalProps = {
    visible: boolean;
    templateId?: string;
    template?: WorkoutPlanTemplate;
    weeklyDays?: number;
    onClose: () => void;
    onPlanCreated?: () => void;
};

type Step = 1 | 2;

const DAY_OPTIONS = [
    { label: "M", value: "mon" },
    { label: "T", value: "tue" },
    { label: "W", value: "wed" },
    { label: "T", value: "thu" },
    { label: "F", value: "fri" },
    { label: "S", value: "sat" },
    { label: "S", value: "sun" },
];

// default day presets based on days/week
const DEFAULT_DAY_MAP: Record<number, string[]> = {
    2: ["mon", "thu"],
    3: ["mon", "thu", "sat"],
    4: ["mon", "wed", "fri", "sun"],
    5: ["mon", "wed", "fri", "sun", "tue"],
};

export const PlanSetupModal: React.FC<PlanSetupModalProps> = ({
    visible,
    templateId,
    template,
    weeklyDays = 3,
    onClose,
    onPlanCreated,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const isDark = scheme === "dark";
    const insets = useSafeAreaInsets();

    const computeDefaultDays = (count: number) => {
        if (DEFAULT_DAY_MAP[count]) return DEFAULT_DAY_MAP[count];
        if (count <= 0) return [];
        if (count >= DAY_OPTIONS.length) {
            return DAY_OPTIONS.map((day) => day.value);
        }
        // fallback: spread selections across week
        const result: string[] = [];
        const interval = Math.floor(DAY_OPTIONS.length / count);
        for (let i = 0; i < count; i++) {
            const index = Math.min(i * interval, DAY_OPTIONS.length - 1);
            const value = DAY_OPTIONS[index]?.value;
            if (value && !result.includes(value)) {
                result.push(value);
            }
        }
        return result.length > 0 ? result : DAY_OPTIONS.slice(0, count).map((day) => day.value);
    };

    const [step, setStep] = useState<Step>(1);
    const [startDate, setStartDate] = useState<Date>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    const [selectedDays, setSelectedDays] = useState<string[]>(computeDefaultDays(weeklyDays));
    const [showPicker, setShowPicker] = useState(Platform.OS === "ios");
    const [submitting, setSubmitting] = useState(false);
    const [clearExistingPlan, setClearExistingPlan] = useState(false);

    useEffect(() => {
        if (!visible) {
            // reset flow when modal closes
            setStep(1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setStartDate(tomorrow);
            setSelectedDays(computeDefaultDays(weeklyDays));
            setShowPicker(Platform.OS === "ios");
            setSubmitting(false);
            setClearExistingPlan(false);
        }
    }, [visible, weeklyDays]);

    const formattedDate = useMemo(
        () =>
            startDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
        [startDate],
    );

    const toggleDay = (value: string) => {
        setSelectedDays((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
        );
    };

    const handleContinue = () => setStep(2);
    const handleBack = () => setStep(1);

    const handleCreatePlan = async () => {
        try {
            setSubmitting(true);
            await createUserPlanFromTemplate({
                template,
                startDate,
                workoutDays: selectedDays,
                clearExistingPlan,
            });
            onPlanCreated?.();
        } finally {
            setSubmitting(false);
        }
    };

    const renderDatePicker = () => (
        <>
            {Platform.OS === "android" && !showPicker ? (
                <TouchableOpacity
                    style={[
                        styles.dateButton,
                        {
                            borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
                            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                        },
                    ]}
                    onPress={() => setShowPicker(true)}
                >
                    <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                        {formattedDate}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View
                    style={[
                        styles.datePickerWrapper,
                        {
                            backgroundColor: isDark ? "#111" : "#FFFFFF",
                        },
                    ]}
                >
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        themeVariant={isDark ? "dark" : "light"}
                        textColor={theme.colors.text}
                        onChange={(_, date) => {
                            if (!date) return;
                            setStartDate(date);
                            if (Platform.OS === "android") {
                                setShowPicker(false);
                            }
                        }}
                    />
                </View>
            )}
        </>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            {/* Dim over existing bg image */}
            <View style={styles.backdrop}>
                <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
                    {/* Bottom sheet card – fully opaque so nothing shows through */}
                    <View
                        style={[
                            styles.sheet,
                            {
                                backgroundColor: isDark ? "#111111" : theme.colors.surface,
                                paddingBottom: insets.bottom,
                            },
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={{ paddingBottom: 16 }}
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.sheetHeader}>
                                <TouchableOpacity onPress={onClose} hitSlop={8}>
                                    <Text style={[styles.headerText, { color: theme.colors.text }]}>
                                        Close
                                    </Text>
                                </TouchableOpacity>
                                {step === 2 ? (
                                    <TouchableOpacity onPress={handleBack} hitSlop={8}>
                                        <Text
                                            style={[
                                                styles.headerText,
                                                { color: theme.colors.text },
                                            ]}
                                        >
                                            Back
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {step === 1 ? (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.title, { color: theme.colors.text }]}>
                                        Start your training plan
                                    </Text>
                                    <Text
                                        style={[
                                            styles.subtitle,
                                            {
                                                color: isDark
                                                    ? "rgba(255,255,255,0.8)"
                                                    : "rgba(0,0,0,0.65)",
                                            },
                                        ]}
                                    >
                                        Choose when you want to begin.
                                    </Text>

                                    <View
                                        style={[
                                            styles.card,
                                            {
                                                borderColor: isDark
                                                    ? "rgba(255,255,255,0.16)"
                                                    : "rgba(0,0,0,0.08)",
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.helperLabel,
                                                {
                                                    color: isDark
                                                        ? "rgba(255,255,255,0.7)"
                                                        : "rgba(0,0,0,0.6)",
                                                },
                                            ]}
                                        >
                                            Start date
                                        </Text>
                                        <Text
                                            style={[styles.dateValue, { color: theme.colors.text }]}
                                        >
                                            {formattedDate}
                                        </Text>
                                        {renderDatePicker()}
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.primaryButton,
                                            { backgroundColor: theme.colors.accent },
                                        ]}
                                        onPress={handleContinue}
                                    >
                                        <Text style={styles.primaryButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.stepContent}>
                                    <Text style={[styles.title, { color: theme.colors.text }]}>
                                        Which days do you train each week?
                                    </Text>
                                    <Text
                                        style={[
                                            styles.subtitle,
                                            {
                                                color: isDark
                                                    ? "rgba(255,255,255,0.8)"
                                                    : "rgba(0,0,0,0.65)",
                                            },
                                        ]}
                                    >
                                        Pick all the days you want this plan to run.
                                    </Text>

                                    <View style={styles.dayRow}>
                                        {DAY_OPTIONS.map((day, idx) => {
                                            const selected = selectedDays.includes(day.value);
                                            return (
                                                <TouchableOpacity
                                                    key={`${day.value}-${idx}`}
                                                    style={[
                                                        styles.dayChip,
                                                        {
                                                            borderColor: selected
                                                                ? theme.colors.accent
                                                                : isDark
                                                                  ? "rgba(255,255,255,0.35)"
                                                                  : "rgba(0,0,0,0.15)",
                                                            backgroundColor: selected
                                                                ? theme.colors.accent
                                                                : "transparent",
                                                        },
                                                    ]}
                                                    onPress={() => toggleDay(day.value)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.dayChipText,
                                                            {
                                                                color: selected
                                                                    ? "#111"
                                                                    : theme.colors.text,
                                                            },
                                                        ]}
                                                    >
                                                        {day.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => setClearExistingPlan((prev) => !prev)}
                                        style={styles.checkboxRow}
                                    >
                                        <View
                                            style={[
                                                styles.checkboxBox,
                                                {
                                                    borderColor: isDark
                                                        ? "rgba(255,255,255,0.4)"
                                                        : "rgba(0,0,0,0.25)",
                                                    backgroundColor: clearExistingPlan
                                                        ? theme.colors.accent
                                                        : "transparent",
                                                },
                                            ]}
                                        >
                                            {clearExistingPlan ? (
                                                <Text style={styles.checkboxCheck}>✓</Text>
                                            ) : null}
                                        </View>
                                        <Text
                                            style={[
                                                styles.checkboxLabel,
                                                { color: theme.colors.text },
                                            ]}
                                        >
                                            Clear my current training plan before starting this plan
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.primaryButton,
                                            {
                                                backgroundColor:
                                                    selectedDays.length === 0 || submitting
                                                        ? isDark
                                                            ? "rgba(255,255,255,0.18)"
                                                            : "rgba(0,0,0,0.08)"
                                                        : theme.colors.accent,
                                            },
                                        ]}
                                        disabled={selectedDays.length === 0 || submitting}
                                        onPress={handleCreatePlan}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {submitting ? "Creating..." : "Create my plan"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)", // dim only; sheet is solid
        justifyContent: "flex-end",
    },
    safeArea: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "transparent",
    },
    sheet: {
        width: "100%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
        minHeight: "60%",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    headerText: {
        fontSize: 15,
        fontWeight: "600",
    },
    stepContent: {
        width: "100%",
        gap: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 16,
        gap: 8,
    },
    helperLabel: {
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    dateButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        marginTop: 8,
    },
    dateButtonText: {
        fontSize: 15,
    },
    datePickerWrapper: {
        borderRadius: 12,
        marginTop: 8,
        overflow: "hidden",
    },
    dayRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    dayChip: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
        minWidth: 36,
        alignItems: "center",
    },
    dayChipText: {
        fontSize: 14,
        fontWeight: "600",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
    },
    checkboxBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxCheck: {
        color: "#111",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 16,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
    },
    primaryButton: {
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16,
        alignSelf: "stretch",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
