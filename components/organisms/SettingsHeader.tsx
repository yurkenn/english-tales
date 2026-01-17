import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface SettingsHeaderProps {
    title: string;
    onBackPress: () => void;
}

export const SettingsHeader: FC<SettingsHeaderProps> = ({
    title,
    onBackPress,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBackPress} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.placeholder} />
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
});
