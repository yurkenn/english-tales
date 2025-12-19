import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SettingSectionProps {
    title: string;
    isDanger?: boolean;
    children: React.ReactNode;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
    title,
    isDanger,
    children,
}) => {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDanger && styles.dangerTitle]}>
                {title}
            </Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    section: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    sectionContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    dangerTitle: {
        color: theme.colors.error,
    },
}));
