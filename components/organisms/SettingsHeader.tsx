import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface SettingsHeaderProps {
    title: string;
    onBackPress: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
    title,
    onBackPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.placeholder} />
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
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
}));
