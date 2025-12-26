import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/utils/haptics';

interface ReadingGoalsSheetProps {
    currentGoal: number;
    onSelectGoal: (minutes: number) => void;
    onClose: () => void;
}

const GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export const ReadingGoalsSheet = forwardRef<BottomSheet, ReadingGoalsSheetProps>(
    ({ currentGoal, onSelectGoal, onClose }, ref) => {
        const { theme } = useUnistyles();
        const insets = useSafeAreaInsets();

        const snapPoints = useMemo(() => ['55%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior="close"
                />
            ),
            []
        );

        const handleSelect = (minutes: number) => {
            haptics.selection();
            onSelectGoal(minutes);
            onClose();
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted, width: 40 }}
                onChange={(index) => {
                    if (index === -1) onClose();
                }}
            >
                <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flag" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>Daily Reading Goal</Text>
                        <Text style={styles.subtitle}>
                            How many minutes do you want to read each day?
                        </Text>
                    </View>

                    {/* Goal Grid */}
                    <View style={styles.grid}>
                        {GOAL_OPTIONS.map((minutes) => {
                            const isSelected = currentGoal === minutes;
                            return (
                                <Pressable
                                    key={minutes}
                                    style={({ pressed }) => [
                                        styles.option,
                                        isSelected && styles.optionSelected,
                                        pressed && !isSelected && styles.optionPressed,
                                    ]}
                                    onPress={() => handleSelect(minutes)}
                                >
                                    <Text style={[styles.minutes, isSelected && styles.textSelected]}>
                                        {minutes}
                                    </Text>
                                    <Text style={[styles.label, isSelected && styles.textSelected]}>
                                        min
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.checkmark}>
                                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    option: {
        width: 80,
        height: 80,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        position: 'relative',
    },
    optionSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    optionPressed: {
        backgroundColor: theme.colors.borderLight,
    },
    minutes: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xxxxxsmall,
    },
    textSelected: {
        color: '#FFFFFF',
    },
    checkmark: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
