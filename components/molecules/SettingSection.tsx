import { FC, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

interface SettingSectionProps {
    title: string;
    isDanger?: boolean;
    children: ReactNode;
}

export const SettingSection: FC<SettingSectionProps> = ({
    title,
    isDanger,
    children,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDanger && styles.dangerTitle]}>
                {title}
            </Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
