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
            {items.map((item, index) => (
                <Pressable
                    key={item.label}
                    style={[
                        styles.menuItem,
                        index === items.length - 1 && styles.lastItem,
                    ]}
                    onPress={item.onPress}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={22} color={theme.colors.text} />
                    </View>
                    <Text style={styles.label}>{item.label}</Text>
                    {item.value && <Text style={styles.value}>{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </Pressable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
        marginBottom: theme.spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 36,
        alignItems: 'center',
    },
    label: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
    },
    value: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        marginRight: theme.spacing.xs,
    },
}));
