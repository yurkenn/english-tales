import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

export interface MenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value?: string;
    onPress: () => void;
}

interface ProfileMenuProps {
    items: MenuItem[];
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ items }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Settings</Text>
            <View style={styles.menuCard}>
                {items.map((item, index) => (
                    <Pressable
                        key={item.label}
                        style={({ pressed }) => [
                            styles.menuItem,
                            index === items.length - 1 && styles.lastItem,
                            pressed && styles.menuItemPressed,
                        ]}
                        onPress={item.onPress}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.label}>{item.label}</Text>
                        <View style={styles.rightSection}>
                            {item.value && (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.value}>{item.value}</Text>
                                </View>
                            )}
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    menuCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    menuItemPressed: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.md,
        backgroundColor: `${theme.colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    label: {
        flex: 1,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.text,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    valueContainer: {
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.sm,
    },
    value: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.textSecondary,
    },
}));
