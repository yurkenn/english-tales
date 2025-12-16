import React, { forwardRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Keyboard } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

interface EditProfileSheetProps {
    initialName: string;
    onSave: (name: string) => Promise<void>;
    onClose: () => void;
}

export const EditProfileSheet = forwardRef<BottomSheet, EditProfileSheetProps>(
    ({ initialName, onSave, onClose }, ref) => {
        const { theme } = useUnistyles();
        const insets = useSafeAreaInsets();
        const [name, setName] = useState(initialName);
        const [isSaving, setIsSaving] = useState(false);
        const toastActions = useToastStore((state) => state.actions);

        const snapPoints = useMemo(() => ['45%'], []);

        useEffect(() => {
            setName(initialName);
        }, [initialName]);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior="close"
                />
            ),
            []
        );

        const handleSave = async () => {
            if (!name.trim()) {
                haptics.error();
                toastActions.error('Display name cannot be empty');
                return;
            }
            Keyboard.dismiss();
            setIsSaving(true);
            try {
                await onSave(name.trim());
                haptics.success();
                toastActions.success('Profile updated successfully');
                onClose();
            } catch (error) {
                haptics.error();
                toastActions.error('Failed to update profile. Please try again.');
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted, width: 40 }}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                onChange={(index) => {
                    if (index === -1) {
                        Keyboard.dismiss();
                        onClose();
                    }
                }}
            >
                <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Profile</Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>

                    {/* Input */}
                    <Text style={styles.inputLabel}>Display Name</Text>
                    <BottomSheetTextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.colors.textMuted}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                    />

                    {/* Save Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            (isSaving || pressed) && { opacity: 0.8 },
                        ]}
                        disabled={isSaving}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </Pressable>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    inputLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.full,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
    },
}));
