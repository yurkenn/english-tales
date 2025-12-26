import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabHeaderAction {
    icon: string;
    onPress: () => void;
    badge?: boolean;
    badgeColor?: string;
}

interface TabHeaderProps {
    title: string;
    actions?: TabHeaderAction[];
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, actions = [] }) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
            <Text style={styles.title}>{title}</Text>
            {actions.length > 0 && (
                <View style={styles.actions}>
                    {actions.map((action, index) => (
                        <Pressable
                            key={index}
                            style={styles.actionButton}
                            onPress={action.onPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={action.icon as any}
                                size={22}
                                color={theme.colors.text}
                            />
                            {action.badge && (
                                <View style={[styles.badge, action.badgeColor && { backgroundColor: action.badgeColor }]} />
                            )}
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
}));
