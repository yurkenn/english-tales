import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { HighlightColor, HIGHLIGHT_COLOR_SOLID } from '@/store/highlightStore'
import { haptics } from '@/utils/haptics'

interface HighlightMenuProps {
    visible: boolean
    selectedText: string
    onHighlight: (color: HighlightColor) => void
    onCopy: () => void
    onDismiss: () => void
    existingColor?: HighlightColor
    onRemoveHighlight?: () => void
}

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink']

export const HighlightMenu = React.memo(({
    visible,
    selectedText,
    onHighlight,
    onCopy,
    onDismiss,
    existingColor,
    onRemoveHighlight,
}: HighlightMenuProps) => {
    const { theme } = useUnistyles()

    if (!visible) return null

    const handleColorPress = (color: HighlightColor) => {
        haptics.light()
        onHighlight(color)
    }

    const handleCopy = () => {
        haptics.light()
        onCopy()
    }

    const handleRemove = () => {
        haptics.light()
        onRemoveHighlight?.()
    }

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.container}
        >
            <Pressable style={styles.backdrop} onPress={onDismiss} />

            <View style={[styles.menu, { backgroundColor: theme.colors.surface }]}>
                {/* Truncated preview of selected text */}
                <Text style={[styles.preview, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    "{selectedText.length > 30 ? selectedText.slice(0, 30) + '...' : selectedText}"
                </Text>

                {/* Color options */}
                <View style={styles.colorsRow}>
                    {COLORS.map((color) => (
                        <Pressable
                            key={color}
                            style={[
                                styles.colorButton,
                                { backgroundColor: HIGHLIGHT_COLOR_SOLID[color] },
                                existingColor === color && styles.colorButtonSelected,
                            ]}
                            onPress={() => handleColorPress(color)}
                        >
                            {existingColor === color && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                        </Pressable>
                    ))}
                </View>

                {/* Action buttons */}
                <View style={styles.actionsRow}>
                    <Pressable style={styles.actionButton} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={18} color={theme.colors.text} />
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>Copy</Text>
                    </Pressable>

                    {existingColor && onRemoveHighlight && (
                        <Pressable style={styles.actionButton} onPress={handleRemove}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                            <Text style={[styles.actionText, { color: theme.colors.error }]}>Remove</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Animated.View>
    )
})

HighlightMenu.displayName = 'HighlightMenu'

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    menu: {
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        minWidth: 250,
        maxWidth: 300,
        ...theme.shadows.lg,
    },
    preview: {
        fontSize: theme.typography.size.sm,
        fontStyle: 'italic',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    colorsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    colorButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorButtonSelected: {
        borderWidth: 2,
        borderColor: '#fff',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.xl,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    actionText: {
        fontSize: theme.typography.size.sm,
        fontFamily: theme.typography.fontFamily.semiBold,
    },
}))
