import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface StoryCardMenuItem {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    destructive?: boolean;
}

interface StoryCardMenuProps {
    visible: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    items: StoryCardMenuItem[];
    sectionLabel?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = 200;
const MENU_OFFSET = 8;

export const StoryCardMenu: React.FC<StoryCardMenuProps> = ({
    visible,
    onClose,
    position,
    items,
    sectionLabel,
}) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset animations
            opacityAnim.setValue(0);
            scaleAnim.setValue(0.95);
        }
    }, [visible, opacityAnim, scaleAnim]);

    const handleItemPress = (item: StoryCardMenuItem) => {
        onClose();
        // Small delay to allow menu to close before action
        setTimeout(() => {
            item.onPress();
        }, 150);
    };

    // Calculate menu position
    // Position menu to appear below and to the right of the button (like the image)
    // The position.x is the right edge of the button, position.y is the top
    const menuX = Math.min(
        position.x - MENU_WIDTH, // Align right edge of menu with button's right edge
        SCREEN_WIDTH - MENU_WIDTH - insets.right - theme.spacing.lg
    );
    const menuY = position.y + MENU_OFFSET; // Position below the button

    // Ensure menu doesn't go off screen
    const adjustedX = Math.max(theme.spacing.lg, menuX);
    const adjustedY = Math.max(
        insets.top + theme.spacing.sm,
        Math.min(
            menuY,
            SCREEN_HEIGHT - (items.length * 50) - insets.bottom - theme.spacing.lg
        )
    );

    const animatedStyle = {
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
                onPress={onClose}
                activeOpacity={1}
            >
                <Animated.View
                    style={[
                        styles.menuContainer,
                        {
                            top: adjustedY,
                            left: adjustedX,
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.borderLight,
                            ...theme.shadows.lg,
                        },
                        animatedStyle,
                    ]}
                >
                    {sectionLabel && (
                        <View style={styles.sectionLabelContainer}>
                            <Text
                                style={[
                                    styles.sectionLabel,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                {sectionLabel}
                            </Text>
                        </View>
                    )}

                    <View style={styles.menuItems}>
                        {items.map((item, index) => (
                            <Pressable
                                key={item.label}
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    index === items.length - 1 && styles.menuItemLast,
                                    pressed && {
                                        backgroundColor: theme.colors.backgroundSecondary,
                                    },
                                ]}
                                onPress={() => handleItemPress(item)}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                accessibilityHint={item.destructive ? "This action cannot be undone" : undefined}
                            >
                                <Text
                                    style={[
                                        styles.menuItemText,
                                        {
                                            color: item.destructive
                                                ? theme.colors.error
                                                : theme.colors.text,
                                        },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {item.icon && (
                                    <Ionicons
                                        name={item.icon}
                                        size={18}
                                        color={
                                            item.destructive
                                                ? theme.colors.error
                                                : theme.colors.textMuted
                                        }
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
    },
    menuContainer: {
        position: 'absolute',
        minWidth: MENU_WIDTH,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        paddingVertical: theme.spacing.sm,
        overflow: 'hidden',
    },
    sectionLabelContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xs,
    },
    sectionLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
    },
    menuItems: {
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        flex: 1,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.medium,
    },
}));
