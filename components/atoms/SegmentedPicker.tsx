import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from './Typography';
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
    const { theme } = useUnistyles();

    return (
        <View style={[styles.container, style]}>
            <View style={styles.background}>
                {options.map((option) => (
                    <Pressable
                        key={option.value}
                        style={[
                            styles.segment,
                            selectedValue === option.value && styles.segmentActive,
                        ]}
                        onPress={() => {
                            if (selectedValue !== option.value) {
                                haptics.selection();
                                onValueChange(option.value);
                            }
                        }}
                    >
                        <Typography
                            variant="body"
                            color={selectedValue === option.value ? theme.colors.text : theme.colors.textMuted}
                            style={{ fontWeight: selectedValue === option.value ? '600' : '400' }}
                        >
                            {option.label}
                        </Typography>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingVertical: theme.spacing.sm,
    },
    background: {
        flexDirection: 'row',
        backgroundColor: theme.colors.borderLight,
        borderRadius: 14,
        padding: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentActive: {
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
}));
