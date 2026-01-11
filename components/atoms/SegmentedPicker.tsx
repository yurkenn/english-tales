import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { haptics } from '@/utils/haptics';

interface SegmentedPickerProps<T extends string> {
    options: { label: string; value: T }[];
    selectedValue: T;
    onValueChange: (value: T) => void;
    style?: any;
}

export const SegmentedPicker = <T extends string>({
    options,
    selectedValue,
    onValueChange,
    style,
}: SegmentedPickerProps<T>) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={[styles.container, style]}>
            {options.map((option) => {
                const isActive = selectedValue === option.value;
                return (
                    <Pressable
                        key={option.value}
                        style={[
                            styles.segment,
                            isActive && [styles.segmentActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }],
                        ]}
                        onPress={() => {
                            if (!isActive) {
                                haptics.selection();
                                onValueChange(option.value);
                            }
                        }}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                { color: isActive ? theme.colors.textInverse : theme.colors.textSecondary }
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    segmentActive: {
        ...theme.shadows.md,
    },
    segmentText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
    },
});
